import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !session.user || (session.user as any).role !== "employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const employeeId = (session.user as any).employeeId;
    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan"); // format: "YYYY-MM"

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    // Build date filter
    let submissionWhere: Prisma.FormSubmissionWhereInput = { employee_id: employeeId, is_deleted: false };
    
    if (bulan) {
      const [year, month] = bulan.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      submissionWhere = {
        ...submissionWhere,
        AND: [
          {
            OR: [
              { tanggal_mulai: { gte: startDate, lte: endDate } },
              { AND: [{ tanggal_mulai: null }, { created_at: { gte: startDate, lte: endDate } }] },
            ],
          },
        ],
      };
    } else {
      // Filter by current year
      const year = new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      submissionWhere = {
        ...submissionWhere,
        AND: [
          {
            OR: [
              { tanggal_mulai: { gte: startDate, lte: endDate } },
              { AND: [{ tanggal_mulai: null }, { created_at: { gte: startDate, lte: endDate } }] },
            ],
          },
        ],
      };
    }

    const submissions = await prisma.formSubmission.findMany({
      where: submissionWhere,
      orderBy: { created_at: "desc" },
    });

    // Summary counts (for the filtered period)
    const summary = { sp: 0, cuti: 0, ijin: 0, total: 0 };
    for (const sub of submissions) {
      summary.total++;
      if (sub.jenis_form === "SP") summary.sp++;
      if (sub.jenis_form === "CUTI") summary.cuti++;
      if (sub.jenis_form === "IJIN") summary.ijin++;
    }

    // Remove password from employee object before returning
    const { password, ...safeEmployee } = employee;

    return NextResponse.json({ employee: safeEmployee, submissions, summary });
  } catch (error) {
    console.error("GET /api/portal/profile error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
