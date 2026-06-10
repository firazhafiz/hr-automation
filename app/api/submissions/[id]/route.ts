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
