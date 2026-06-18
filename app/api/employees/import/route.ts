import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File Excel tidak ditemukan" },
        { status: 400 },
      );
    }

    // Read the file into a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse the Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON array (assuming first row is headers)
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { error: "File Excel kosong atau format tidak sesuai" },
        { status: 400 },
      );
    }

    // Map the expected headers to our schema fields
    const parsedEmployees = rawData.map((row: any) => ({
      nik: String(row["NIK"] || row["nik"] || "").trim(),
      nama: String(row["Nama Lengkap"] || row["nama"] || row["Nama"] || "").trim(),
      departemen: String(row["Departemen"] || row["departemen"] || "").trim() || null,
      bagian: String(row["Bagian"] || row["bagian"] || "").trim() || null,
    }));

    // Filter out rows without NIK or Nama
    const validRows = parsedEmployees.filter((e) => e.nik && e.nama);

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data valid yang ditemukan dalam file" },
        { status: 400 },
      );
    }

    // Check for duplicates in the database
    const existingEmployees = await prisma.employee.findMany({
      select: { nik: true, nama: true },
    });

    const duplicates: { nik: string; nama: string; reason: string }[] = [];
    const validEmployeesToInsert: any[] = [];
    
    // Hash a default password for all imported users
    const defaultPassword = await bcrypt.hash("toshin123", 10);

    // To check for duplicates within the Excel file itself
    const seenNiks = new Set<string>();

    for (const row of validRows) {
      let isDuplicate = false;

      // Check against DB
      const existsInDb = existingEmployees.find((e) => e.nik === row.nik);
      if (existsInDb) {
        duplicates.push({
          nik: row.nik,
          nama: row.nama,
          reason: "NIK sudah terdaftar",
        });
        isDuplicate = true;
      }

      // Check within Excel file
      if (seenNiks.has(row.nik)) {
        duplicates.push({
          nik: row.nik,
          nama: row.nama,
          reason: "Duplikat NIK dalam file Excel yang sama",
        });
        isDuplicate = true;
      }

      seenNiks.add(row.nik);

      if (!isDuplicate) {
        validEmployeesToInsert.push({
          nik: row.nik,
          nama: row.nama,
          departemen: row.departemen,
          bagian: row.bagian,
          password: defaultPassword,
          is_active: true,
        });
      }
    }

    if (duplicates.length > 0) {
      return NextResponse.json(
        { 
          error: "Ditemukan data duplikat", 
          duplicates 
        },
        { status: 409 },
      );
    }

    // Insert all valid rows using createMany
    const result = await prisma.employee.createMany({
      data: validEmployeesToInsert,
      skipDuplicates: true, // Just in case
    });

    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });

  } catch (error) {
    console.error("POST /api/employees/import error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
