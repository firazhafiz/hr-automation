"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  MoveRight,
  AlertCircle,
} from "lucide-react";

// ─── Animated Grid Background (Light Mode) ────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base light */}
      <div className="absolute inset-0 bg-slate-50" />

      {/* Fine grid */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Coarse grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Glow sources (Adjusted for light mode) */}
      <div className="absolute top-[-20%] left-[10%] w-[700px] h-[700px] rounded-full bg-[#1356A0]/10 blur-[140px]" />
      <div className="absolute bottom-[-15%] right-[5%] w-[500px] h-[500px] rounded-full bg-[#B02040]/5 blur-[120px]" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-[#1B8AE4]/10 blur-[100px]" />

      {/* Scan line sweep */}
      <div
        className="absolute inset-0 animate-scan-line opacity-[0.5]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(23,103,175,0.15) 50%, transparent 100%)",
          backgroundSize: "100% 8px",
        }}
      />
    </div>
  );
}

// ─── Corner Bracket ─────────────────────────────────────────────────────────
function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const base = "absolute w-5 h-5 border-[#1767AF]/40";
  const corners = {
    tl: "top-0 left-0 border-t border-l",
    tr: "top-0 right-0 border-t border-r",
    bl: "bottom-0 left-0 border-b border-l",
    br: "bottom-0 right-0 border-b border-r",
  };
  return <div className={`${base} ${corners[position]}`} />;
}

// ─── Stat Item ───────────────────────────────────────────────────────────────
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500">
        {label}
      </span>
      <span className="text-sm font-mono text-slate-800 font-medium tabular-nums">
        {value}
      </span>
    </div>
  );
}

// ─── Ticker Line ─────────────────────────────────────────────────────────────
function TickerLine() {
  const items = [
    "SISTEM AKTIF",
    "PEMANTAUAN REAL-TIME",
    "AKURASI DATA 99.9%",
    "PORTAL HR",
    "PT TOSHIN PRIMA FINE BLANKING",
  ];
  const repeated = [...items, ...items];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-slate-200 bg-white/80 backdrop-blur-md flex items-center overflow-hidden">
      <div className="flex gap-12 animate-ticker whitespace-nowrap">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.2em] text-slate-500 font-medium"
          >
            <span className="w-1 h-1 rounded-full bg-[#1767AF]/60 flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError(result.error || "Email atau password tidak sesuai.");
      } else {
        const session = await getSession();
        if ((session?.user as any)?.role === "employee") {
          router.push("/portal");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Sistem sedang sibuk. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        body {
          font-family: 'Geist', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .font-mono-dm { font-family: 'DM Mono', monospace; }
        .font-serif-inst { font-family: 'Instrument Serif', serif; }
        .font-geist { font-family: 'Geist', sans-serif; }

        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-ticker { animation: ticker 28s linear infinite; }

        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan-line { animation: scanLine 8s linear infinite; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-600 { animation-delay: 600ms; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .animate-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

        /* Light mode input styles */
        .input-field {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
          font-family: 'Geist', sans-serif;
          color: rgba(15, 23, 42, 0.9); /* text-slate-900 */
        }
        .input-field:focus {
          background: rgba(23, 103, 175, 0.03);
          border-color: rgba(23, 103, 175, 0.4);
          outline: none;
        }
        .input-field::placeholder { color: rgba(15, 23, 42, 0.3); }

        .submit-btn {
          background: linear-gradient(135deg, #1767AF 0%, #1356A0 60%, #0F4A8E 100%);
          border: 1px solid rgba(23, 103, 175, 0.5);
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.08), transparent);
        }

        /* Light mode glass panel */
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .status-badge {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .focus-ring-visible:focus-visible {
          outline: 2px solid rgba(23, 103, 175, 0.6);
          outline-offset: 2px;
        }
      `}</style>

      <div className="flex min-h-screen w-full bg-slate-50 font-geist">
        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden">
          <GridBackground />

          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-10 pt-8 pb-0">
            {/* Logo + brand */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0">
                <Image
                  src="/logo/logo.png"
                  alt="Toshin Prima"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-mono-dm font-semibold text-slate-800 uppercase tracking-wide leading-none">
                  Toshin Prima Fine Blanking
                </p>
                <p className="text-xs font-mono-dm text-slate-500 tracking-[0.12em]  leading-none">
                  Indoprima Group
                </p>
              </div>
            </div>

            {/* Live time */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="font-mono-dm text-[11px] text-slate-600 font-medium tabular-nums">
                {currentTime}
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col flex-1 justify-center px-10 lg:px-14">
            {/* Tag line */}
            <div className="mb-8 inline-flex items-center gap-2.5 glass-panel rounded-full px-3.5 py-1.5 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1767AF] animate-pulse-dot" />
              <span className="font-mono-dm text-[10px] uppercase tracking-[0.18em] font-medium text-slate-600">
                Internal Access
              </span>
            </div>

            {/* Hero heading */}
            <h1 className="text-[52px] font-geist font-semibold leading-[1.05] tracking-[-0.03em] text-slate-900 mb-6">
              Smart Form Scanner
              <br />
              <span className="font-serif-inst italic font-normal text-[#1767AF]">
                HRPGA.
              </span>
            </h1>

            <div className="divider-line mb-6 w-24" />

            <p className="text-sm text-slate-600 leading-relaxed max-w-[340px]">
              Otomatisasi ekstraksi form rekap HR. Cepat, akurat, dan mengurangi
              proses entri manual harian.
            </p>

            {/* Stats row */}
            <div className="mt-10 flex items-center gap-8 glass-panel rounded-xl px-6 py-4 w-fit relative">
              <CornerBracket position="tl" />
              <CornerBracket position="tr" />
              <CornerBracket position="bl" />
              <CornerBracket position="br" />
              <StatItem label="Uptime Sistem" value="99.97%" />
              <div className="w-px h-8 bg-slate-200" />
              <StatItem label="Akurasi Data" value="99.9%" />
              <div className="w-px h-8 bg-slate-200" />
              <StatItem label="Versi Sistem" value="v2.0.4" />
            </div>

            {/* Decorative crosshair */}
            <div className="absolute bottom-24 right-10 w-16 h-16 opacity-30">
              <svg
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="16"
                  stroke="#94A3B8"
                  strokeWidth="0.5"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="8"
                  stroke="#94A3B8"
                  strokeWidth="0.5"
                />
                <circle cx="32" cy="32" r="2" fill="#94A3B8" />
                <line
                  x1="32"
                  y1="0"
                  x2="32"
                  y2="20"
                  stroke="#94A3B8"
                  strokeWidth="0.5"
                />
                <line
                  x1="32"
                  y1="44"
                  x2="32"
                  y2="64"
                  stroke="#94A3B8"
                  strokeWidth="0.5"
                />
                <line
                  x1="0"
                  y1="32"
                  x2="20"
                  y2="32"
                  stroke="#94A3B8"
                  strokeWidth="0.5"
                />
                <line
                  x1="44"
                  y1="32"
                  x2="64"
                  y2="32"
                  stroke="#94A3B8"
                  strokeWidth="0.5"
                />
              </svg>
            </div>
          </div>

          {/* Bottom ticker */}
          <TickerLine />
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────────── */}
        <div className="flex w-full flex-col justify-center lg:w-[48%] relative border-l border-slate-200 bg-white shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.02)]">
          {/* Subtle background texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(ellipse at 70% 20%, rgba(23,103,175,0.06) 0%, transparent 60%)`,
            }}
          />

          <div className="relative z-10 w-full max-w-[400px] mx-auto px-6 lg:px-0">
            {/* Mobile logo */}
            <div className="lg:hidden mb-10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-md overflow-hidden border border-slate-200 bg-white relative">
                <Image
                  src="/logo/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain p-0.5"
                />
              </div>
              <span className="font-mono-dm text-xs text-slate-800 font-semibold tracking-wide">
                TOSHIN PRIMA
              </span>
            </div>

            {/* Header */}
            <div className="mb-10 animate-fade-up">
              {/* System status */}
              <div className="flex items-center gap-2 mb-6">
                <div className="status-badge rounded-full px-2.5 py-0.5 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  <span className="font-mono-dm text-[9px] text-emerald-600 font-medium uppercase tracking-[0.15em]">
                    Sistem Online
                  </span>
                </div>
              </div>

              <h2 className="text-[28px] font-geist font-bold tracking-[-0.02em] text-slate-900 leading-tight">
                Selamat Datang
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Masuk ke portal hr internal.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="animate-fade-up delay-100">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-mono-dm font-medium uppercase tracking-[0.12em] text-slate-600 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${
                      emailFocused ? "text-[#1767AF]" : "text-slate-400"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    className="input-field focus-ring-visible block w-full pl-10 pr-4 py-3 rounded-md text-sm"
                    placeholder="nama@toshinprima.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="animate-fade-up delay-200">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-mono-dm font-medium uppercase tracking-[0.12em] text-slate-600 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${
                      passFocused ? "text-[#1767AF]" : "text-slate-400"
                    }`}
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    required
                    className="input-field focus-ring-visible block w-full pl-10 pr-11 py-3 rounded-md text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus-ring-visible transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="animate-fade-up flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit */}
              <div className="animate-fade-up delay-300 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn cursor-pointer focus-ring-visible flex w-full items-center justify-center gap-2.5 py-3.5 px-4 text-sm font-medium text-white rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="font-mono-dm text-xs tracking-[0.08em]">
                        MEMPROSES...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <MoveRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="animate-fade-up delay-400 my-8 divider-line" />

            {/* Footer */}
            <div className="animate-fade-up delay-500 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Mengalami kendala?{" "}
                <a
                  href="#"
                  className="text-slate-700 font-medium hover:text-[#1767AF] transition-colors underline-offset-2 hover:underline"
                >
                  Hubungi IT Support
                </a>
              </p>
              <p className="font-mono-dm text-[9px] text-slate-400 font-medium uppercase tracking-[0.15em]">
                v2.0
              </p>
            </div>

            <div className="animate-fade-up delay-600 mt-10 glass-panel rounded-lg p-3 flex items-center gap-2.5 bg-slate-50">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <p className="font-mono-dm text-[9px] text-slate-500 leading-relaxed uppercase tracking-[0.1em]">
                Untuk admin dan karyawan terdaftar.
              </p>
            </div>
          </div>

          {/* Bottom corner label */}
          <div className="absolute bottom-6 right-6 lg:right-8">
            <p className="font-mono-dm text-[9px] text-slate-400 font-medium tracking-[0.15em] uppercase">
              © {new Date().getFullYear()} PT Toshin Prima
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
