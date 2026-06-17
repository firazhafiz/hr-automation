"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LayoutDashboard, ScanLine, Users, Menu } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: "Scan Form Baru",
    href: "/scan",
    icon: <ScanLine className="w-5 h-5" />,
  },
  {
    label: "Data Karyawan",
    href: "/employees",
    icon: <Users className="w-5 h-5" />,
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isOpen = true, onToggle = () => {} }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavItemClick = () => {
    const isMobile = window.innerWidth < 768;

    if (isMobile && isOpen) {
      onToggle();
    }
  };

  return (
    <>
      <aside
        className={`sticky top-0 left-0 z-40 h-screen transition-all duration-300 bg-[#0D3A61] border-r border-white/10 flex flex-col shadow-xl shrink-0 ${isOpen ? "w-64" : "w-20"}`}
      >
        {/* Header/Logo */}
        <div
          className={`h-20 flex items-center px-4 border-b border-white/10 ${isOpen ? "justify-between" : "justify-center"}`}
        >
          <div
            className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Image src="/logo/logo.png" alt="Logo" width={40} height={40} />
            </div>
            <div className="shrink-0">
              <h1 className="text-sm font-bold text-white tracking-wide">
                HRPGA
              </h1>
              <p className="text-[10px] text-white/60 font-medium">
                Toshin Prima
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors ${!isOpen ? "mx-auto" : ""}`}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavItemClick} // Ditambahkan di sini agar otomatis menutup
                className={`flex items-center rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isOpen
                    ? "w-full px-3 py-2.5 gap-3"
                    : "w-12 p-2.5 justify-center mx-auto"
                } ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <span
                  className={`transition-colors shrink-0 ${isActive ? "text-white" : "text-white/40 group-hover:text-white/80"}`}
                >
                  {item.icon}
                </span>
                {isOpen && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 px-3 py-2 justify-center">
            {isOpen && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.name || "Admin"}
                  </p>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="p-1.5 text-white/40 hover:text-[#EF3655] transition-colors rounded-lg hover:bg-[#EF3655]/10 shrink-0"
                  title="Logout"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </>
            )}
          </div>
          {!isOpen && (
            <div className="mt-2 flex justify-center">
              <button
                onClick={() => setShowLogoutModal(true)}
                className="p-2 text-white/40 hover:text-[#EF3655] transition-colors rounded-lg hover:bg-[#EF3655]/10 shrink-0"
                title="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Logout Modal */}
      {mounted &&
        showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
              <div className="w-12 h-12 rounded-full bg-[#EF3655]/10 flex items-center justify-center mb-4 mx-auto">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-[#EF3655]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
                Konfirmasi Keluar
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                Apakah Anda yakin ingin keluar dari sistem?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 cursor-pointer text-slate-700 font-medium py-2.5 rounded-full text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex-1 bg-[#EF3655] hover:bg-[#D92B45] text-white cursor-pointer font-medium py-2.5 rounded-full text-sm transition-colors"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
