import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Password lama dan baru harus diisi" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    // Verify old password
    if (employee.password) {
      const isValid = await bcrypt.compare(oldPassword, employee.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
      }
    } else {
      // If no password set, we can allow setting one? But the old password would be "toshin123" maybe?
      // Actually, if there's no password in DB (e.g., legacy data), they shouldn't be able to login anyway unless it was bypassed.
      return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.employee.update({
      where: { id: employeeId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("POST /api/portal/change-password error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
