"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Plus,
  Search,
  UserCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeModal } from "@/components/employees/EmployeeModal";

const PAGE_SIZE = 12;

interface PaginatedResponse {
  data: any[];
  total: number;
  page: number;
  totalPages: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedUrl, setDebouncedUrl] = useState("");

  // Debounced search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1); // Reset page on new search
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Construct URL for SWR
  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    setDebouncedUrl(`/api/employees?${params.toString()}`);
  }, [page, search]);

  const { data: rawData, isLoading, mutate } = useSWR(
    debouncedUrl || null,
    fetcher,
    { fallbackData: { data: [], total: 0, page: 1, totalPages: 1 } }
  );

  const result: PaginatedResponse = rawData;

  const handleSuccess = () => {
    mutate();
  };

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
          className="pl-9 h-11 bg-white border-slate-300 rounded-md transition-colors focus-visible:ring-1 focus-visible:ring-slate-300"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {/* Grid / Table */}
      {isLoading && result.data.length === 0 ? (
        <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex flex-col">
            {/* Table Header Skeleton */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-4 gap-4">
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse" />
            </div>
            {/* Table Body Skeletons */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex p-4 gap-4 border-b border-slate-50">
                <div className="h-10 bg-slate-100 rounded w-1/4 animate-pulse" />
                <div className="h-10 bg-slate-100 rounded w-1/4 animate-pulse" />
                <div className="h-10 bg-slate-100 rounded w-1/4 animate-pulse" />
                <div className="h-10 bg-slate-100 rounded w-1/4 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : result.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-slate-200">
          <UserCircle2 className="w-12 h-12 text-slate-200 mb-4" />
          <p className="font-semibold text-slate-600">
            Tidak ada data karyawan
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {search
              ? `Tidak ditemukan hasil untuk "${search}"`
              : "Belum ada karyawan yang terdaftar"}
          </p>
        </div>
      ) : (
        <EmployeeTable employees={result.data} />
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
        onSuccess={handleSuccess}
      />
    </div>
  );
}
