import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/employees/:id — profil + riwayat form + summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan"); // format: "YYYY-MM"
    const tahun = searchParams.get("tahun"); // format: "YYYY"
    const jenisForm = searchParams.get("jenisForm"); // format: "CUTI", "IJIN", "SP", or "SEMUA"

    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    let submissionWhere: Prisma.FormSubmissionWhereInput = { 
      employee_id: id, 
      is_deleted: false 
    };

    if (jenisForm && jenisForm !== "SEMUA") {
      submissionWhere.jenis_form = jenisForm as any;
    }

    if (bulan) {
      const [year, month] = bulan.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      submissionWhere = {
        ...submissionWhere,
        AND: [
          {
            OR: [
              { tanggal_surat: { gte: startDate, lte: endDate } },
              { tanggal_mulai: { gte: startDate, lte: endDate } },
              { AND: [{ tanggal_surat: null }, { tanggal_mulai: null }, { created_at: { gte: startDate, lte: endDate } }] },
            ],
          },
        ],
      };
    } else if (tahun) {
      const year = Number(tahun);
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      submissionWhere = {
        ...submissionWhere,
        AND: [
          {
            OR: [
              { tanggal_surat: { gte: startDate, lte: endDate } },
              { tanggal_mulai: { gte: startDate, lte: endDate } },
              { AND: [{ tanggal_surat: null }, { tanggal_mulai: null }, { created_at: { gte: startDate, lte: endDate } }] },
            ],
          },
        ],
      };
    }

    const submissions = await prisma.formSubmission.findMany({
      where: submissionWhere,
      orderBy: { created_at: "desc" },
    });

    // Summary counts from denormalized counter columns (all time)
    const summary = {
      sp: employee.total_sp,
      cuti: employee.total_cuti,
      ijin: employee.total_ijin,
      total: employee.total_sp + employee.total_cuti + employee.total_ijin,
    };

    return NextResponse.json({ employee, submissions, summary });
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/employees/:id — update karyawan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { nik, nama, email, password, bagian, departemen, is_active } = body;

    const currentEmployee = await prisma.employee.findUnique({ where: { id } });
    if (!currentEmployee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    // Check if NIK conflicts with another employee
    if (nik) {
      const existing = await prisma.employee.findFirst({
        where: { nik, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json({ error: "NIK sudah digunakan karyawan lain" }, { status: 409 });
      }
    }

    if (email) {
      const existingEmail = await prisma.employee.findFirst({
        where: { email, NOT: { id } },
      });
      if (existingEmail) {
        return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
      }
    }

    const dataToUpdate: Prisma.EmployeeUpdateInput = { nik, nama, email: email || null, bagian, departemen, is_active };

    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    } else if (email && !currentEmployee.password) {
      // Auto-generate default password if adding email for the first time
      dataToUpdate.password = await bcrypt.hash("toshin123", 10);
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: dataToUpdate,
    });

    const { password: _, ...safeEmployee } = employee;
    return NextResponse.json(safeEmployee);
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/employees/:id — soft delete (nonaktifkan)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    await prisma.employee.update({
      where: { id },
      data: { is_active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
