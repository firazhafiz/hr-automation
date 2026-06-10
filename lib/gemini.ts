import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

/* ───────────────────────── Types ───────────────────────── */

export interface FieldInfo<T> {
  value: T | null;
  confidence: number;
  corrected: boolean;
  original?: string;
}

export interface TtdSlot {
  label: string;
  signed: boolean;
}

export interface ExtractedFormData {
  jenis_form: "CUTI" | "IJIN" | "SP";
  fields: {
    nik: FieldInfo<string>;
    nama_karyawan: FieldInfo<string>;
    departemen: FieldInfo<string>;
    bagian: FieldInfo<string>;
    tanggal_surat: FieldInfo<string>;   // YYYY-MM-DD
    tanggal_mulai: FieldInfo<string>;   // YYYY-MM-DD
    tanggal_selesai: FieldInfo<string>; // YYYY-MM-DD (null for SP)
    keterangan: FieldInfo<string>;      // dikarenakan (Cuti/Ijin)
    alasan: FieldInfo<string>;          // detail pelanggaran (SP)
  };
  tanda_tangan: {
    slot_1: TtdSlot;
    slot_2: TtdSlot;
    slot_3: TtdSlot;
  };
  semua_ttd_lengkap: boolean;
}

/* ───────────────────────── Main Function ───────────────────────── */

/**
 * Hybrid parsing: receives OCR text for field extraction + image buffer
 * for visual signature (TTD) detection. Single Gemini API call.
 */
export async function parseFormWithGemini(
  ocrText: string,
  imageBuffer: Buffer,
  mimeType: string,
  employeeListJson: string
): Promise<ExtractedFormData> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType: mimeType,
    },
  };

  const prompt = `
Kamu adalah parser otomatis untuk sistem rekap HR PT Toshin Prima Fine Blanking.
Kamu menerima DUA input:
1. Teks hasil OCR dari form kertas (mungkin ada typo karena tulisan tangan)
2. Gambar asli form tersebut (untuk verifikasi visual dan deteksi tanda tangan)

TEKS OCR DARI FORM:
---
${ocrText}
---

DATABASE KARYAWAN (gunakan untuk validasi dan koreksi nama/NIK):
${employeeListJson}

═══════════════════════════════════════
FORM YANG DIKENALI (hanya 2 jenis):
═══════════════════════════════════════

A) "PERMOHONAN CUTI / IJIN" (Form TPF-0808)
   - Title di form: "PT. TOSHIN PRIMA FINE BLANKING — PERMOHONAN CUTI / IJIN"
   - Field: Nama, No. Register (NIK), Bagian, Departemen
   - Checkbox: CUTI atau IJIN (salah satu tercentang)
   - "Ingin mengajukan pada tanggal ___ s/d ___"
   - "dikarenakan ___"
   - 3 TTD: Personalia, Supervisor/Manager, Pemohon

B) "SURAT PERMOHONAN PERINGATAN / PHK" (Form TPF-0811)
   - Title di form: "PT. TOSHIN PRIMA FINE-BLANKING — SURAT PERMOHONAN PERINGATAN / PHK"
   - Field: Nama, No. Reg., Bagian, Dept.
   - "Alasan: ___" (paragraf panjang detail pelanggaran)
   - 3 TTD: Personalia, Manager, Supervisor (Diajukan)

═══════════════════════════════════════
INSTRUKSI PARSING:
═══════════════════════════════════════

1. **JENIS FORM**:
   - Cari keyword di title OCR: "CUTI" atau "IJIN" → form Cuti/Ijin
   - Cari keyword: "PERINGATAN" atau "PHK" atau "SP" → form SP
   - Untuk Cuti/Ijin: cek checkbox mana yang tercentang (☑/✓/X):
     * Centang di "CUTI" → jenis_form: "CUTI"
     * Centang di "IJIN" atau "IZIN" → jenis_form: "IJIN"

2. **FORMAT TEKS (PENTING)**:
   - Nama, Bagian, dan Departemen HARUS ditulis dalam format Title Case (Huruf Kapital di awal setiap kata). Contoh: "Rafid Nur Rasyidin E", "Produksi", "Quality Control".

3. **NIK (No. Register / No. Reg.)**:
   - Bisa format angka saja ("26010356") atau campuran ("1701p0037")
   - Cocokkan dengan database karyawan jika memungkinkan
   - Jika cocok, gunakan NIK dari database

4. **NAMA KARYAWAN**:
   - Cocokkan ke database karyawan menggunakan fuzzy matching
   - Jika ada yang mirip (typo OCR), gunakan nama dari database
   - Set "corrected": true dan catat teks asli OCR di "original"

5. **BAGIAN**: Field "Bagian" pada form (contoh: "Gudang / Inventory Control", "Operator Produksi")

6. **DEPARTEMEN**: Field "Departemen" atau "Dept." (contoh: "PPIC", "Produksi")

7. **TANGGAL**:
   - Normalisasi ke format YYYY-MM-DD
   - "tanggal_surat": Biasanya ada di atas kolom pemohon / paling bawah, seperti "Surabaya, 22-05-2026". Ambil tanggalnya saja.
   - Untuk Cuti/Ijin: "tanggal_mulai" = Ingin mengajukan pada tanggal, "tanggal_selesai" = s/d
   - Untuk SP: "tanggal_mulai" = tanggal pelanggaran jika ada, atau gunakan tanggal surat, "tanggal_selesai" = null
   - Format input bisa: "11-06-2026", "05 Juni 2026", "5/6/26", dll
   - PERHATIAN: format tanggal Indonesia = DD-MM-YYYY (hari dulu, bukan bulan!)

8. **KETERANGAN** (Cuti/Ijin saja): Isi dari field "dikarenakan ___"

9. **ALASAN** (SP saja): Isi lengkap dari field "Alasan: ___", pertahankan detail pelanggaran

10. **TANDA TANGAN (TTD)** — ⚠️ GUNAKAN GAMBAR ASLI UNTUK VERIFIKASI VISUAL:
    Lihat area tanda tangan di bagian bawah form. Ada 3 kolom TTD.
    Untuk SETIAP kolom, tentukan apakah ada tanda tangan (coretan/goresan tinta) atau kosong.

    PENTING!!! Personalia / HR sering kali tanda tangan melampaui garis kotak, atau bentuknya hanya coretan kecil, lengkungan melingkar, garis tak beraturan, atau huruf sambung. JANGAN HANYA mencari tanda tangan konvensional. APA PUN jenis coretan yang ada di kotak / menimpa garis kolom tersebut HARUS DIHITUNG SEBAGAI "signed": true. 

    Untuk Cuti/Ijin:
    - slot_1: label "Personalia" → cek coretan di kotak Personalia. Seringkali berupa lingkaran/coretan melengkung yang menabrak garis tepi. Wajib teliti!
    - slot_2: label "Supervisor/Manager" → cek coretan di kotak Supervisor/Manager.
    - slot_3: label "Pemohon" → cek coretan di kotak Pemohon.

    Untuk SP:
    - slot_1: label "Personalia"
    - slot_2: label "Manager"
    - slot_3: label "Supervisor"

    "semua_ttd_lengkap": true HANYA jika ketiga slot signed = true

11. **CONFIDENCE SCORE**:
    - 0.9–1.0 = sangat yakin, tulisan jelas
    - 0.7–0.9 = cukup yakin, sedikit keraguan
    - < 0.7 = tidak yakin, perlu verifikasi manual

═══════════════════════════════════════
RESPONSE FORMAT (JSON strict):
═══════════════════════════════════════
{
  "jenis_form": "CUTI",
  "fields": {
    "nik":             { "value": "1701p0037",     "confidence": 0.90, "corrected": false },
    "nama_karyawan":   { "value": "Sukermanto",    "confidence": 0.95, "corrected": true, "original": "Sukermanto" },
    "departemen":      { "value": "Ppic",          "confidence": 0.90, "corrected": false },
    "bagian":          { "value": "Gudang / Inventory Control", "confidence": 0.85, "corrected": false },
    "tanggal_surat":   { "value": "2026-05-22",    "confidence": 0.95, "corrected": false },
    "tanggal_mulai":   { "value": "2026-06-11",    "confidence": 0.90, "corrected": false },
    "tanggal_selesai": { "value": null,            "confidence": 1.0,  "corrected": false },
    "keterangan":      { "value": "Antar istri kontrol ke RS", "confidence": 0.80, "corrected": false },
    "alasan":          { "value": null,            "confidence": 1.0,  "corrected": false }
  },
  "tanda_tangan": {
    "slot_1": { "label": "Personalia",        "signed": false },
    "slot_2": { "label": "Supervisor/Manager","signed": true },
    "slot_3": { "label": "Pemohon",           "signed": true }
  },
  "semua_ttd_lengkap": false
}
`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("=== GEMINI RAW RESPONSE ===");
    console.log(responseText);
    console.log("=== END GEMINI RESPONSE ===");

    const parsedData = JSON.parse(responseText) as ExtractedFormData;

    // Validate jenis_form
    if (!parsedData.jenis_form || !["CUTI", "IJIN", "SP"].includes(parsedData.jenis_form)) {
      parsedData.jenis_form = "CUTI"; // Safe fallback
    }

    // Recompute semua_ttd_lengkap for safety
    if (parsedData.tanda_tangan) {
      parsedData.semua_ttd_lengkap =
        parsedData.tanda_tangan.slot_1?.signed === true &&
        parsedData.tanda_tangan.slot_2?.signed === true &&
        parsedData.tanda_tangan.slot_3?.signed === true;
    } else {
      parsedData.semua_ttd_lengkap = false;
    }

    return parsedData;
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Gemini parsing failed: ${error.message || error}`);
  }
}
