"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  UserCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { EmployeeModal } from "@/components/employees/EmployeeModal";

const PAGE_SIZE = 12;

interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  totalPages: number;
}

export default function EmployeesPage() {
  const [result, setResult] = useState<PaginatedResponse>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Data Karyawan
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 font-medium">
            {result.total} karyawan terdaftar
          </p>
        </div>
        <Button
          className="bg-[#1767AF] hover:bg-[#1356A0] rounded-full! text-white h-11 px-4 self-start sm:self-auto"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Karyawan
        </Button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Cari nama, NIK, atau departemen..."
          className="pl-9 h-11 bg-white border-slate-400 rounded-md"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="h-44 bg-white rounded-2xl border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100">
          <UserCircle2 className="w-12 h-12 text-slate-200 mb-4" />
          <p className="font-semibold text-slate-600">
            Tidak ada data karyawan
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {search
              ? `Tidak ditemukan hasil untuk "${search}"`
              : "Belum ada karyawan yang terdaftar"}
          </p>
          {!search && (
            <Button
              className="mt-5 bg-[#1767AF] hover:bg-[#1356A0] text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Karyawan
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {result.data.map((emp) => (
            <EmployeeCard key={emp.id} employee={emp} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Halaman {result.page} dari {result.totalPages} ({result.total}{" "}
            karyawan)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: result.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === result.totalPages || Math.abs(p - page) <= 1,
              )
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                  acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, i) =>
                item === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="text-slate-400 text-sm px-1"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? "default" : "outline"}
                    size="sm"
                    className={`h-9 w-9 p-0 ${page === item ? "bg-[#1767AF] text-white border-[#1767AF]" : ""}`}
                    onClick={() => setPage(item as number)}
                  >
                    {item}
                  </Button>
                ),
              )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              disabled={page >= result.totalPages}
              onClick={() => setPage((p) => Math.min(result.totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={null}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
