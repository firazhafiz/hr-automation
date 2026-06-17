/**
 * Seed karyawan dari file Excel (.xlsx)
 * 
 * Membaca header dari baris 1:
 *   Column A: "No. ID Karyawan" → nik
 *   Column B: "Nama Lengkap"    → nama
 *   Column C: "Posisi"          → bagian
 *   Column D: "Departemen"      → departemen
 * 
 * Usage:
 *   npx tsx prisma/seed-employees.ts "path/ke/file.xlsx"
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import * as path from "path";

const prisma = new PrismaClient();

// Mapping header Excel → field database
const HEADER_MAP: Record<string, string> = {
  "No. ID Karyawan": "nik",
  "No ID Karyawan": "nik",
  "NIK": "nik",
  "Nama Lengkap": "nama",
  "Nama": "nama",
  "Posisi": "bagian",
  "Bagian": "bagian",
  "Departemen": "departemen",
  "Dept": "departemen",
};

interface EmployeeRow {
  nik: string;
  nama: string;
  bagian: string;
  departemen: string;
}

function normalizeHeader(header: string): string | null {
  const trimmed = header.trim();
  // Try exact match first
  if (HEADER_MAP[trimmed]) return HEADER_MAP[trimmed];
  // Try case-insensitive match
  const lower = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(HEADER_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }
  return null;
}

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("❌ Harap berikan path file Excel.");
    console.error("   Usage: npx tsx prisma/seed-employees.ts \"path/ke/file.xlsx\"");
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  console.log(`📂 Membaca file: ${absolutePath}\n`);

  // Read Excel file
  const workbook = XLSX.readFile(absolutePath);
  
  // Prioritaskan sheet "Automation", fallback ke sheet pertama jika tidak ada
  const targetSheetName = "Automation";
  const sheetName = workbook.SheetNames.includes(targetSheetName) 
    ? targetSheetName 
    : workbook.SheetNames[0];

  console.log(`📑 Membaca sheet: "${sheetName}"`);
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    console.error(`❌ Sheet "${sheetName}" tidak ditemukan dalam file Excel.`);
    process.exit(1);
  }

  // Convert to JSON (header dari baris 1)
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  if (rawData.length === 0) {
    console.error("❌ File Excel kosong atau tidak ada data.");
    process.exit(1);
  }

  // Detect and map headers
  const excelHeaders = Object.keys(rawData[0]);
  console.log("📋 Header terdeteksi:", excelHeaders.join(", "));

  const fieldMap: Record<string, string> = {};
  for (const header of excelHeaders) {
    const mapped = normalizeHeader(header);
    if (mapped) {
      fieldMap[header] = mapped;
      console.log(`   ✓ "${header}" → ${mapped}`);
    }
  }

  // Validate required fields
  const mappedFields = Object.values(fieldMap);
  if (!mappedFields.includes("nik") || !mappedFields.includes("nama")) {
    console.error("\n❌ Header 'No. ID Karyawan' (NIK) dan 'Nama Lengkap' (Nama) wajib ada!");
    console.error("   Header yang terdeteksi:", excelHeaders.join(", "));
    process.exit(1);
  }

  // Parse rows
  const employees: EmployeeRow[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const mapped: Record<string, string> = {};

    for (const [excelHeader, dbField] of Object.entries(fieldMap)) {
      mapped[dbField] = String(row[excelHeader] || "").trim();
    }

    // Validate required
    if (!mapped.nik || !mapped.nama) {
      skipped.push(`Baris ${i + 2}: NIK atau Nama kosong`);
      continue;
    }

    employees.push({
      nik: mapped.nik,
      nama: mapped.nama,
      bagian: mapped.bagian || "",
      departemen: mapped.departemen || "",
    });
  }

  console.log(`\n📊 Data yang akan diproses: ${employees.length} karyawan`);
  if (skipped.length > 0) {
    console.log(`⚠️  Dilewati: ${skipped.length} baris`);
    skipped.forEach((s) => console.log(`   - ${s}`));
  }

  // Upsert into database
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const emp of employees) {
    try {
      await prisma.employee.upsert({
        where: { nik: emp.nik },
        create: {
          nik: emp.nik,
          nama: emp.nama,
          bagian: emp.bagian || null,
          departemen: emp.departemen || null,
          is_active: true,
        },
        update: {
          nama: emp.nama,
          bagian: emp.bagian || null,
          departemen: emp.departemen || null,
          is_active: true,
        },
      });

      // Check if it was created or updated
      const existing = await prisma.employee.findUnique({
        where: { nik: emp.nik },
        select: { created_at: true },
      });

      // Simple heuristic: if created_at is within last 5 seconds, it's new
      const isNew = existing && (Date.now() - new Date(existing.created_at).getTime()) < 5000;
      if (isNew) created++;
      else updated++;
    } catch (err: any) {
      errors++;
      console.error(`   ❌ Error untuk NIK ${emp.nik}: ${err.message}`);
    }
  }

  console.log("\n═══════════════════════════════════");
  console.log("📊 HASIL SEEDING:");
  console.log(`   ✅ Baru dimasukkan : ${created}`);
  console.log(`   🔄 Diperbarui     : ${updated}`);
  console.log(`   ❌ Error           : ${errors}`);
  console.log(`   ⚠️  Dilewati       : ${skipped.length}`);
  console.log("═══════════════════════════════════\n");

  const totalInDb = await prisma.employee.count({ where: { is_active: true } });
  console.log(`📌 Total karyawan aktif di database: ${totalInDb}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
