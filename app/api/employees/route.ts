import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12")));
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = { is_active: true };
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: "insensitive" } },
        { nik: { contains: search, mode: "insensitive" } },
        { departemen: { contains: search, mode: "insensitive" } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { nama: "asc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              submissions: {
                where: { is_deleted: false }
              }
            }
          }
        }
      }),
      prisma.employee.count({ where }),
    ]);

    // Also get SP/Cuti/Ijin counts per employee
    const employeeIds = employees.map(e => e.id);
    const summaryCounts = await prisma.formSubmission.groupBy({
      by: ["employee_id", "jenis_form"],
      where: {
        employee_id: { in: employeeIds },
        is_deleted: false,
      },
      _count: { id: true },
    });

    const summaryMap: Record<string, { sp: number; cuti: number; ijin: number }> = {};
    for (const row of summaryCounts) {
      if (!row.employee_id) continue;
      if (!summaryMap[row.employee_id]) summaryMap[row.employee_id] = { sp: 0, cuti: 0, ijin: 0 };
      if (row.jenis_form === "SP") summaryMap[row.employee_id].sp = row._count.id;
      if (row.jenis_form === "CUTI") summaryMap[row.employee_id].cuti = row._count.id;
      if (row.jenis_form === "IJIN") summaryMap[row.employee_id].ijin = row._count.id;
    }

    const enrichedEmployees = employees.map(emp => {
      const { password, ...safeEmp } = emp;
      return {
        ...safeEmp,
        summary: summaryMap[emp.id] || { sp: 0, cuti: 0, ijin: 0 },
      };
    });

    return NextResponse.json({
      data: enrichedEmployees,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { nik, nama, email, password, bagian, departemen } = body;

    if (!nik || !nama) {
      return NextResponse.json({ error: "NIK dan Nama wajib diisi" }, { status: 400 });
    }

    // Check if NIK already exists
    const existing = await prisma.employee.findUnique({ where: { nik } });
    if (existing) {
      return NextResponse.json({ error: "NIK sudah terdaftar" }, { status: 409 });
    }

    if (email) {
      const existingEmail = await prisma.employee.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
      }
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const employee = await prisma.employee.create({
      data: { 
        nik, 
        nama, 
        email: email || null,
        password: hashedPassword,
        bagian, 
        departemen, 
        is_active: true 
      },
    });

    const { password: _, ...safeEmployee } = employee;
    return NextResponse.json(safeEmployee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
