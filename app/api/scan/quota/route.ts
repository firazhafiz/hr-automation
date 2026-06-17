import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getScanQuota, getNextMidnightPT } from "@/lib/scan-limiter";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quota = await getScanQuota();
    return NextResponse.json({
      success: true,
      quota: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        nextResetUTC: getNextMidnightPT().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
