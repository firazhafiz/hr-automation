import prisma from "@/lib/prisma";

// ─────────────────────────────────────────────
// Daily Scan Rate Limiter
// Gemini 2.5 Flash free tier: 20 RPD, 5 RPM
// We set daily limit to 18 (leave 2 buffer for retries)
// ─────────────────────────────────────────────

const DAILY_SCAN_LIMIT = parseInt(process.env.DAILY_SCAN_LIMIT || "18", 10);
const RPM_LIMIT = 5; // requests per minute

/**
 * Get the number of scans done today (in server's timezone)
 */
async function getTodayScanCount(): Promise<number> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return prisma.scanLog.count({
    where: {
      created_at: { gte: startOfDay },
    },
  });
}

/**
 * Get scans done in the last 60 seconds
 */
async function getRecentMinuteScanCount(): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

  return prisma.scanLog.count({
    where: {
      created_at: { gte: oneMinuteAgo },
    },
  });
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  dailyUsed: number;
  dailyLimit: number;
  retryAfterSeconds?: number;
}

/**
 * Check if a scan is allowed under the current rate limits.
 * Does NOT log the scan — call `logScan()` after the scan completes.
 */
export async function checkScanRateLimit(): Promise<RateLimitResult> {
  const [dailyCount, minuteCount] = await Promise.all([
    getTodayScanCount(),
    getRecentMinuteScanCount(),
  ]);

  // Check daily limit
  if (dailyCount >= DAILY_SCAN_LIMIT) {
    return {
      allowed: false,
      reason: `Batas scan harian tercapai (${DAILY_SCAN_LIMIT} scan/hari). Coba lagi besok.`,
      dailyUsed: dailyCount,
      dailyLimit: DAILY_SCAN_LIMIT,
    };
  }

  // Check RPM limit (leave 1 buffer)
  if (minuteCount >= RPM_LIMIT - 1) {
    return {
      allowed: false,
      reason: `Sistem sedang antre (Limit 4 dokumen/menit). Harap tunggu 1 menit lalu klik "Coba Ulang".`,
      dailyUsed: dailyCount,
      dailyLimit: DAILY_SCAN_LIMIT,
      retryAfterSeconds: 15,
    };
  }

  return {
    allowed: true,
    dailyUsed: dailyCount,
    dailyLimit: DAILY_SCAN_LIMIT,
  };
}

/**
 * Log a scan attempt in the database.
 */
export async function logScan(status: "success" | "error" = "success"): Promise<void> {
  await prisma.scanLog.create({
    data: { status },
  });
}

/**
 * Get remaining scan quota for today.
 */
export async function getScanQuota(): Promise<{ used: number; limit: number; remaining: number }> {
  const used = await getTodayScanCount();
  return {
    used,
    limit: DAILY_SCAN_LIMIT,
    remaining: Math.max(0, DAILY_SCAN_LIMIT - used),
  };
}
