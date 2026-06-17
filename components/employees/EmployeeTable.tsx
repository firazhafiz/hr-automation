"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Calendar } from "lucide-react";

interface Employee {
  id: string;
  nik: string;
  nama: string;
  bagian: string | null;
  departemen: string | null;
  is_active: boolean;
  summary?: { sp: number; cuti: number; ijin: number };
}

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const router = useRouter();

  if (employees.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 sticky left-0 z-10 bg-slate-50 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                Nama Karyawan
              </th>
              <th className="px-4 py-3 border-r border-slate-100">NIK</th>
              <th className="px-4 py-3 border-r border-slate-100">Posisi</th>
              <th className="px-4 py-3 border-r border-slate-100">
                Departemen
              </th>
              <th className="px-4 py-3 border-r border-slate-100 text-center">
                SP
              </th>
              <th className="px-4 py-3 border-r border-slate-100 text-center">
                Cuti
              </th>
              <th className="px-4 py-3 text-center">Izin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => {
              const sum = emp.summary || { sp: 0, cuti: 0, ijin: 0 };

              return (
                <tr
                  key={emp.id}
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] transition-colors">
                    {emp.nama}
                  </td>
                  <td className="px-4 py-3 text-slate-500 border-r border-slate-100 font-mono">
                    {emp.nik}
                  </td>
                  <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                    {emp.bagian || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 border-r border-slate-100">
                    {emp.departemen || "-"}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    {sum.sp > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                        {sum.sp}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center">
                    {sum.cuti > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        {sum.cuti}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {sum.ijin > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        {sum.ijin}
                      </span>
                    ) : (
                      <span className="text-slate-300">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
