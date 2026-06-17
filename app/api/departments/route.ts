import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.employee.findMany({
      where: {
        is_active: true,
        AND: [
          { departemen: { not: null } },
          { departemen: { not: "" } }
        ]
      },
      select: {
        departemen: true,
      },
      distinct: ["departemen"],
      orderBy: {
        departemen: "asc",
      },
    });

    const list = departments.map((d) => d.departemen).filter(Boolean) as string[];
    return NextResponse.json(list);
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
