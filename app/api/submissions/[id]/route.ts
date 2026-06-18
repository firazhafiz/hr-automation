import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Soft delete
    const submission = await prisma.formSubmission.update({
      where: { id },
      data: { is_deleted: true },
    });

    // Decrement employee counter column
    if (submission.employee_id) {
      const counterField =
        submission.jenis_form === "SP" ? "total_sp" :
        submission.jenis_form === "CUTI" ? "total_cuti" :
        submission.jenis_form === "IJIN" ? "total_ijin" : null;
      if (counterField) {
        await prisma.employee.update({
          where: { id: submission.employee_id },
          data: { [counterField]: { decrement: 1 } },
        });
      }
    }

    // Log deletion
    await prisma.auditLog.create({
      data: {
        record_id: id,
        action: "DELETE",
        changed_by: session.user.email || "admin",
        new_data: { is_deleted: true },
      },
    });

    return NextResponse.json({ message: "Deleted successfully", submission });
  } catch (error) {
    console.error("DELETE /api/submissions/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
