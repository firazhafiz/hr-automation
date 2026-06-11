"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-geist">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-md overflow-hidden bg-white border border-slate-100 p-0.5">
              <Image src="/logo/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-800 tracking-wide leading-tight">
                Portal Karyawan
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                Toshin Prima
              </p>
            </div>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {session?.user?.name || "Karyawan"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Access Granted
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1767AF]/10 flex items-center justify-center text-[#1767AF] text-xs font-bold border border-[#1767AF]/20">
              {session?.user?.name?.[0]?.toUpperCase() || "K"}
            </div>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group flex items-center gap-2"
              title="Keluar"
            >
              <span className="text-xs font-medium hidden sm:inline group-hover:text-red-500 transition-colors">Keluar</span>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
