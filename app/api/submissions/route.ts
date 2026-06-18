import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Calculate dates
    const surat = data.tanggal_surat ? new Date(data.tanggal_surat) : null;
    const selesai = data.tanggal_selesai ? new Date(data.tanggal_selesai) : null;
    // For SP, tanggal_mulai is not on the form — use tanggal_surat so monthly filters work
    const mulai = data.tanggal_mulai
      ? new Date(data.tanggal_mulai)
      : data.jenis_form === "SP" && surat
      ? surat
      : null;

    // Optional: Fuzzy match employee again (server side)
    let employeeMatched = data.employee_matched || false;
    let employeeId = null;
    let finalNik = data.nik || null;
    let finalName = data.nama || "";

    // Fuzzy match NIK/Name for strong relation
    if (finalNik || finalName) {
      const normalizeStr = (s?: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      const normExtNik = normalizeStr(finalNik);
      const normExtNama = normalizeStr(finalName);
      
      const employees = await prisma.employee.findMany({
        where: { is_active: true },
        select: { id: true, nik: true, nama: true }
      });

      const matchedEmployee = employees.find(e => {
        const normNik = normalizeStr(e.nik);
        const normNama = normalizeStr(e.nama);
        
        const nikMatch = Boolean(normExtNik && normNik && (normNik === normExtNik || normNik.includes(normExtNik) || normExtNik.includes(normNik)));
        const namaMatch = Boolean(normExtNama && normNama && (normNama === normExtNama || normNama.includes(normExtNama) || normExtNama.includes(normNama)));
        
        return nikMatch || namaMatch;
      });

      if (matchedEmployee) {
        employeeId = matchedEmployee.id;
        employeeMatched = true;
        finalNik = matchedEmployee.nik;
        finalName = matchedEmployee.nama;
      }
    }

    // Calculate confidence average if confidence object exists
    let confidenceAvg = 0.9;
    if (data.confidence) {
      const vals = Object.values(data.confidence).map(v => Number(v) || 0);
      if (vals.length > 0) {
        confidenceAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
      }
    }

    // Parse TTD Status
    const ttd_personalia = data.tanda_tangan?.slot_1?.signed || false;
    const ttd_atasan = data.tanda_tangan?.slot_2?.signed || false;
    const ttd_pemohon = data.tanda_tangan?.slot_3?.signed || false;
    const ttd_lengkap = data.semua_ttd_lengkap || false;

    // Block save if TTD not complete (Security/Validation check)
    if (!ttd_lengkap) {
      return NextResponse.json({ error: "Validasi Gagal: Tanda tangan belum lengkap (3 area TTD wajib diisi)." }, { status: 422 });
    }

    // Insert submission
    const submission = await prisma.formSubmission.create({
      data: {
        jenis_form: data.jenis_form,
        employee_id: employeeId,
        nik_karyawan: finalNik,
        nama_karyawan: finalName,
        departemen: data.departemen,
        bagian: data.bagian,
        tanggal_surat: surat,
        tanggal_mulai: mulai,
        tanggal_selesai: selesai,
        keterangan: data.keterangan,
        alasan: data.alasan,
        image_url: data.image_url || null,
        raw_ocr_text: data.raw_ocr_text || null,
        employee_matched: employeeMatched,
        confidence_avg: confidenceAvg,
        ttd_personalia,
        ttd_atasan,
        ttd_pemohon,
        ttd_lengkap
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        record_id: submission.id,
        action: "CREATE",
        changed_by: session.user.email || "admin",
        new_data: JSON.parse(JSON.stringify(submission)),
      },
    });

    // Increment employee counter column
    if (employeeId) {
      const counterField =
        data.jenis_form === "SP" ? "total_sp" :
        data.jenis_form === "CUTI" ? "total_cuti" :
        data.jenis_form === "IJIN" ? "total_ijin" : null;
      if (counterField) {
        await prisma.employee.update({
          where: { id: employeeId },
          data: { [counterField]: { increment: 1 } },
        });
      }
    }

    // Clean up Supabase storage: delete image to save space
    // It's safe to do this asynchronously in the background
    if (data.image_url) {
      const { deleteFormImage } = await import("@/lib/storage");
      deleteFormImage(data.image_url).catch((err) => 
        console.warn("Background image deletion failed:", err)
      );
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("POST /api/submissions error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const jenis_form = searchParams.get("jenis_form");
    const departemen = searchParams.get("departemen");
    const bulan = searchParams.get("bulan"); // "YYYY-MM"
    const tahun = searchParams.get("tahun"); // "YYYY"

    const andClauses: any[] = [{ is_deleted: false }];

    if (search) {
      andClauses.push({
        OR: [
          { nama_karyawan: { contains: search, mode: "insensitive" } },
          { nik_karyawan: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (jenis_form && jenis_form !== "SEMUA") {
      andClauses.push({ jenis_form });
    }

    if (departemen && departemen !== "SEMUA") {
      andClauses.push({ departemen });
    }

    if (bulan) {
      // Filter by specific month (bulan already includes year, e.g. "2026-06")
      const [year, month] = bulan.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      andClauses.push({
        OR: [
          { tanggal_surat: { gte: startDate, lte: endDate } },
          { tanggal_mulai: { gte: startDate, lte: endDate } },
          { AND: [{ tanggal_surat: null }, { tanggal_mulai: null }, { created_at: { gte: startDate, lte: endDate } }] },
        ],
      });
    } else if (tahun) {
      // Filter by entire year
      const year = Number(tahun);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      andClauses.push({
        OR: [
          { tanggal_surat: { gte: startDate, lte: endDate } },
          { tanggal_mulai: { gte: startDate, lte: endDate } },
          { AND: [{ tanggal_surat: null }, { tanggal_mulai: null }, { created_at: { gte: startDate, lte: endDate } }] },
        ],
      });
    }

    const where: any = { AND: andClauses };

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET /api/submissions error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
