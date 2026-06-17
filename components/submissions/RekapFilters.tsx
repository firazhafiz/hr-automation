"use client";

import { Search, Download, Filter, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface RekapFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  jenisForm: string;
  onJenisFormChange: (value: string) => void;
  departemen: string;
  onDepartemenChange: (value: string) => void;
  bulan: string;
  onBulanChange: (value: string) => void;
  onExport: () => void;
  departmentsList?: string[];
}

export function RekapFilters({
  search,
  onSearchChange,
  jenisForm,
  onJenisFormChange,
  departemen,
  onDepartemenChange,
  bulan,
  onBulanChange,
  onExport,
  departmentsList = [],
}: RekapFiltersProps) {
  const now = new Date();
  const currentYear = now.getFullYear();

  return (
    <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
      {/* Row 1: Search + Export */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Cari nama atau NIK..."
            className="pl-9 h-10 bg-white border-slate-300 rounded-sm text-sm transition-colors focus-visible:ring-1 focus-visible:ring-slate-300"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-10 px-4 text-slate-600 border-slate-300 bg-white rounded-sm font-medium shrink-0 hover:bg-slate-50 transition-colors"
          onClick={onExport}
        >
          <Download className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline text-sm">Export</span>
        </Button>
      </div>

      {/* Row 2: Filter chips */}
      <div className="flex flex-wrap gap-3">
        {/* Bulan filter */}
        <div className="relative flex items-center">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            className="h-10 pl-9 text-sm border border-slate-300 rounded-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 appearance-none cursor-pointer transition-colors"
            value={bulan}
            onChange={(e) => onBulanChange(e.target.value)}
          >
            <option value="">Semua ({currentYear})</option>
            {MONTHS.map((m, mi) => {
              const val = `${currentYear}-${String(mi + 1).padStart(2, "0")}`;
              return (
                <option key={val} value={val}>
                  {m} {currentYear}
                </option>
              );
            })}
          </select>
        </div>

        {/* Jenis Form */}
        <div className="relative flex items-center">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <select
            className="h-10 pl-9 pr-8 text-sm border border-slate-300 rounded-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 appearance-none cursor-pointer transition-colors"
            value={jenisForm}
            onChange={(e) => onJenisFormChange(e.target.value)}
          >
            <option value="SEMUA">Semua Form</option>
            <option value="SP">SP / PHK</option>
            <option value="CUTI">Cuti</option>
            <option value="IJIN">Ijin</option>
          </select>
        </div>

        {/* Departemen */}
        <select
          className="h-10 px-4 pr-8 text-sm border border-slate-300 rounded-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 appearance-none cursor-pointer transition-colors"
          value={departemen}
          onChange={(e) => onDepartemenChange(e.target.value)}
        >
          <option value="SEMUA">Semua Dept</option>
          {(departmentsList.length > 0
            ? departmentsList
            : [
                "Produksi",
                "Quality Control",
                "PPIC",
                "Maintenance",
                "HRPGA",
                "Finance",
                "Engineering",
              ]
          ).map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
