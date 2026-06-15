import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadFormImage } from "@/lib/storage";
import { performOCR } from "@/lib/vision";
import { parseFormWithGemini } from "@/lib/gemini";
import { preprocessImage } from "@/lib/image-processor";
import Fuse from "fuse.js";

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

    // 2.5. Check Rate Limit
    const { checkScanRateLimit, logScan } = await import("@/lib/scan-limiter");
    const rateLimit = await checkScanRateLimit();
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.reason || "Batas scan tercapai" },
        { status: 429 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // 3. Preprocess Image
    console.log("Preprocessing image...");
    const { buffer: processedBuffer, contentType, qualityWarning } = await preprocessImage(originalBuffer);

    // 4. Upload to Supabase Storage
    console.log("Uploading file to Supabase Storage...");
    const imageUrl = await uploadFormImage(processedBuffer, file.name, contentType);
    console.log("Uploaded successfully. Public URL:", imageUrl);

    // 5. Perform OCR using OCR.space
    console.log("Performing OCR via OCR.space...");
    let rawOcrText = "";
    try {
      rawOcrText = await performOCR(imageUrl);
      console.log("OCR output length:", rawOcrText.length);
    } catch (err: any) {
      await logScan("error");
      throw err;
    }

    if (!rawOcrText || rawOcrText.trim() === "") {
      await logScan("error");
      return NextResponse.json(
        { error: "Gagal membaca teks dari gambar. Pastikan gambar cukup terang dan teks terbaca jelas." },
        { status: 422 }
      );
    }

    // 6. Parse OCR text + detect signatures with Gemini
    // SECURITY: Employee data is NOT sent to Gemini. Only the image + OCR text.
    console.log("Parsing OCR text & detecting signatures with Gemini...");
    let parsedData;
    try {
      parsedData = await parseFormWithGemini(rawOcrText, processedBuffer, contentType);
      await logScan("success"); // Log successful API usage
    } catch (err: any) {
      await logScan("error");
      throw err;
    }
    
    // 7. LOCAL employee matching (data never leaves our server)
    const extractedNik = parsedData.fields.nik?.value;
    const extractedNama = parsedData.fields.nama_karyawan?.value;
    
    let finalNik = extractedNik;
    let finalNama = extractedNama;
    let finalDepartemen = parsedData.fields.departemen?.value;
    let finalBagian = parsedData.fields.bagian?.value;
    let employeeId = null;
    let employeeMatched = false;

    if (extractedNik || extractedNama) {
      // Fetch employees ONLY for local matching (never sent externally)
      const employees = await prisma.employee.findMany({
        where: { is_active: true },
        select: { id: true, nik: true, nama: true, departemen: true, bagian: true }
      });

      // --- LAYER 1: Exact NIK match (most accurate) ---
      const normalizeStr = (s?: string | null) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      const normExtNik = normalizeStr(extractedNik);

      let matchedEmployee = normExtNik
        ? employees.find(e => {
            const normNik = normalizeStr(e.nik);
            return normNik === normExtNik || normNik.includes(normExtNik) || normExtNik.includes(normNik);
          })
        : undefined;

      // --- LAYER 2: Fuzzy match with Fuse.js (fallback for OCR typos) ---
      if (!matchedEmployee && extractedNama) {
        // We only search by name here, since NIK exact match failed
        const fuse = new Fuse(employees, {
          keys: ["nama"], // ONLY search against nama
          threshold: 0.45, // more tolerant of OCR typos (e.g., Ardlansyah vs Ardiansyah)
          includeScore: true,
          ignoreLocation: true, // find the name anywhere in the string
        });

        const results = fuse.search(extractedNama);

        if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.45) {
          matchedEmployee = results[0].item;
          console.log(`Fuzzy matched: "${extractedNama}" → "${matchedEmployee.nama}" (score: ${results[0].score})`);
        }
      }

      if (matchedEmployee) {
        employeeMatched = true;
        employeeId = matchedEmployee.id;
        finalNik = matchedEmployee.nik;
        finalNama = matchedEmployee.nama;
        finalDepartemen = matchedEmployee.departemen || finalDepartemen;
        finalBagian = matchedEmployee.bagian || finalBagian;
      }
    }

    // 8. Return data for review (Save ke DB baru dilakukan saat Submit)
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
