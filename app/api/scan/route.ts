import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadFormImage } from "@/lib/storage";
import { performOCR } from "@/lib/vision";
import { parseFormWithGemini } from "@/lib/gemini";
import { preprocessImage } from "@/lib/image-processor";

// Helper to get raw confidence map
function getConfidenceMap(fields: Record<string, { confidence?: number }>) {
  const map: Record<string, number> = {};
  for (const [key, field] of Object.entries(fields)) {
    map[key] = field?.confidence || 1.0;
  }
  return map;
}

export async function POST(req: NextRequest) {
  // 1. Verify session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // 3. Preprocess Image
    console.log("Preprocessing image...");
    const { buffer: processedBuffer, contentType, qualityWarning } = await preprocessImage(originalBuffer);

    // 4. Upload to Supabase Storage (Async, don't block OCR if possible, but OCR.space needs URL)
    console.log("Uploading file to Supabase Storage...");
    const imageUrl = await uploadFormImage(processedBuffer, file.name, contentType);
    console.log("Uploaded successfully. Public URL:", imageUrl);

    // 5. Perform OCR using OCR.space
    console.log("Performing OCR via OCR.space...");
    const rawOcrText = await performOCR(imageUrl);
    console.log("OCR output length:", rawOcrText.length);

    if (!rawOcrText || rawOcrText.trim() === "") {
      return NextResponse.json(
        { error: "Gagal membaca teks dari gambar. Pastikan gambar cukup terang dan teks terbaca jelas." },
        { status: 422 }
      );
    }

    // 6. Get Employee Database for AI Context
    const employees = await prisma.employee.findMany({
      where: { is_active: true },
      select: { id: true, nik: true, nama: true, departemen: true, bagian: true }
    });
    const employeeListJson = JSON.stringify(employees);

    // 7. Parse OCR text + detect signatures
    console.log("Parsing OCR text & detecting signatures with Gemini 2.5 Flash Lite...");
    const parsedData = await parseFormWithGemini(rawOcrText, processedBuffer, contentType, employeeListJson);
    
    // 2. Tentukan field berdasarkan hasil OCR & DB Match
    const extractedNik = parsedData.fields.nik?.value;
    const extractedNama = parsedData.fields.nama_karyawan?.value;
    
    let finalNik = extractedNik;
    let finalNama = extractedNama;
    let finalDepartemen = parsedData.fields.departemen?.value;
    let finalBagian = parsedData.fields.bagian?.value;
    let employeeId = null;
    let employeeMatched = false;

    // --- DB CROSS-CHECK LOGIC ---
    if (extractedNik || extractedNama) {
      const normalizeStr = (s?: string | null) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      const normExtNik = normalizeStr(extractedNik);
      const normExtNama = normalizeStr(extractedNama);

      const matchedEmployee = employees.find(e => {
        const normNik = normalizeStr(e.nik);
        const normNama = normalizeStr(e.nama);
        
        // Exact match or contains for NIK
        const nikMatch = Boolean(normExtNik && normNik && (normNik === normExtNik || normNik.includes(normExtNik) || normExtNik.includes(normNik)));
        // Exact match or contains for Nama
        const namaMatch = Boolean(normExtNama && normNama && (normNama === normExtNama || normNama.includes(normExtNama) || normExtNama.includes(normNama)));
        
        return nikMatch || namaMatch;
      });

      if (matchedEmployee) {
        employeeMatched = true;
        employeeId = matchedEmployee.id;
        finalNik = matchedEmployee.nik;
        finalNama = matchedEmployee.nama;
        finalDepartemen = matchedEmployee.departemen || finalDepartemen;
        finalBagian = matchedEmployee.bagian || finalBagian;
      }
    }
    // ----------------------------

    // 3. Return data for review (Save ke DB baru dilakukan saat Submit)
    return NextResponse.json({
      success: true,
      data: {
        jenis_form: parsedData.jenis_form,
        nik: finalNik,
        nama: finalNama,
        departemen: finalDepartemen,
        bagian: finalBagian,
        employee_matched: employeeMatched,
        
        tanggal_surat: parsedData.fields.tanggal_surat?.value || "",
        tanggal_mulai: parsedData.fields.tanggal_mulai?.value || "",
        tanggal_selesai: parsedData.fields.tanggal_selesai?.value || "",
        keterangan: parsedData.fields.keterangan?.value || "",
        alasan: parsedData.fields.alasan?.value || "",
        
        tanda_tangan: parsedData.tanda_tangan,
        semua_ttd_lengkap: parsedData.semua_ttd_lengkap,
        confidence: getConfidenceMap(parsedData.fields),
        raw_ocr_text: rawOcrText,
        image_url: imageUrl,
      }
    });
  } catch (error: any) {
    console.error("Scanning pipeline error:", error);
    return NextResponse.json(
      { error: `Pemrosesan gagal: ${error.message || error}` },
      { status: 500 }
    );
  }
}
