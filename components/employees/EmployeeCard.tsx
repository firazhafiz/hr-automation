"use client";

import Link from "next/link";
import {
  Building2,
  Briefcase,
  AlertTriangle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmployeeCardProps {
  employee: {
    id: string;
    nik: string;
    nama: string;
    bagian: string | null;
    departemen: string | null;
    is_active: boolean;
    summary?: { sp: number; cuti: number; ijin: number };
  };
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const { summary = { sp: 0, cuti: 0, ijin: 0 } } = employee;
  const total = summary.sp + summary.cuti + summary.ijin;
  const initials = employee.nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  // Color based on SP count
  const avatarBg =
    summary.sp >= 3
      ? "bg-red-100 text-red-700"
      : summary.sp >= 1
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <Link href={`/employees/${employee.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base ${avatarBg}`}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">
              {employee.nama}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {employee.nik}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors" />
        </div>

        {/* Dept + Bagian */}
        <div className="flex flex-col gap-1 mb-4 flex-1">
          {employee.departemen && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{employee.departemen}</span>
            </div>
          )}
          {employee.bagian && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{employee.bagian}</span>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="border-t border-slate-100 pt-3 flex items-center gap-2 flex-wrap">
          {summary.sp > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="w-2.5 h-2.5" />
              {summary.sp} SP
            </span>
          )}
          {summary.cuti > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              <Calendar className="w-2.5 h-2.5" />
              {summary.cuti} Cuti
            </span>
          )}
          {summary.ijin > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              <Calendar className="w-2.5 h-2.5" />
              {summary.ijin} Ijin
            </span>
          )}
          {total === 0 && (
            <span className="text-[11px] text-slate-400 italic">
              Belum ada rekap
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
