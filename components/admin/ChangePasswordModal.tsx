"use client";

import { useState } from "react";
import { X, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!isOpen) return null;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Password Baru dan Konfirmasi Password tidak cocok!");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(form.newPassword)) {
      toast.error(
        "Password Baru minimal 6 karakter dan harus mengandung kombinasi huruf dan angka!",
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah password");
        return;
      }

      toast.success("Password berhasil diubah. Silakan login kembali.");
      onClose();

      // Auto logout to force user to login with new password
      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 1500);
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-[#1767AF]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ganti Password
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ubah password akun Anda saat ini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Password Saat Ini <span className="text-red-500">*</span>
            </Label>
            <Input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              className="h-10"
              placeholder="Masukkan password saat ini"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Password Baru <span className="text-red-500">*</span>
            </Label>
            <Input
              type="password"
              required
              value={form.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              className="h-10"
              placeholder="Minimal 6 karakter terdapat huruf dan angka"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Konfirmasi Password Baru <span className="text-red-500">*</span>
            </Label>
            <Input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              className="h-10"
              placeholder="Ulangi password baru"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full! h-11"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-full! h-11 bg-[#1767AF] hover:bg-[#1356A0] text-white"
              disabled={
                loading ||
                !form.currentPassword ||
                !form.newPassword ||
                !form.confirmPassword
              }
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {loading ? "Menyimpan..." : "Simpan Password"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
