import prisma from "@/lib/prisma";

// ─────────────────────────────────────────────
// Daily Scan Rate Limiter
// Gemini 2.5 Flash free tier: 20 RPD, 5 RPM
// We set daily limit to 18 (leave 2 buffer for retries)
// ─────────────────────────────────────────────

const DAILY_SCAN_LIMIT = parseInt(process.env.DAILY_SCAN_LIMIT || "18", 10);
const RPM_LIMIT = 5; // requests per minute

/**
 * Helper: Mendapatkan awal hari ini berdasarkan Waktu Pasifik (PT) dalam UTC.
 * Quota Gemini API direset setiap tengah malam waktu PT.
 */
export function getCurrentPtMidnightUTC(): Date {
  const now = new Date();
  const ptTimeStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const utcTimeStr = now.toLocaleString("en-US", { timeZone: "UTC" });
  
  const ptTime = new Date(ptTimeStr);
  const utcTime = new Date(utcTimeStr);
  
  const offsetHours = Math.round((utcTime.getTime() - ptTime.getTime()) / (1000 * 60 * 60));
  
  return new Date(Date.UTC(ptTime.getFullYear(), ptTime.getMonth(), ptTime.getDate(), offsetHours, 0, 0));
}

export function getNextMidnightPT(): Date {
  return new Date(getCurrentPtMidnightUTC().getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Get the number of scans done today (aligned to Gemini API PT reset)
 */
async function getTodayScanCount(): Promise<number> {
  const startOfDayPT = getCurrentPtMidnightUTC();

  return prisma.scanLog.count({
    where: {
      created_at: { gte: startOfDayPT },
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
  nextResetUTC?: string;
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

  const nextResetUTC = getNextMidnightPT().toISOString();

  // Check daily limit
  if (dailyCount >= DAILY_SCAN_LIMIT) {
    return {
      allowed: false,
      reason: `Batas scan harian tercapai (${DAILY_SCAN_LIMIT} scan/hari). Coba lagi besok.`,
      dailyUsed: dailyCount,
      dailyLimit: DAILY_SCAN_LIMIT,
      nextResetUTC,
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
      nextResetUTC,
    };
  }

  return {
    allowed: true,
    dailyUsed: dailyCount,
    dailyLimit: DAILY_SCAN_LIMIT,
    nextResetUTC,
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
