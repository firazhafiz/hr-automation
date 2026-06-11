"use client";

import { useState } from "react";
import { X, Lock, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/portal/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengubah password");
        return;
      }

      toast.success("Password berhasil diubah");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      onClose();
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl z-10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Ubah Password</h2>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Password Lama
            </Label>
            <Input
              type="password"
              required
              value={form.oldPassword}
              onChange={(e) => setForm(p => ({ ...p, oldPassword: e.target.value }))}
              className="h-10 text-sm"
              placeholder="Masukkan password lama"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Password Baru
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.newPassword}
              onChange={(e) => setForm(p => ({ ...p, newPassword: e.target.value }))}
              className="h-10 text-sm"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Konfirmasi Password Baru
            </Label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.confirmPassword}
              onChange={(e) => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
              className="h-10 text-sm"
              placeholder="Ketik ulang password baru"
            />
          </div>
          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full h-10 bg-[#1767AF] hover:bg-[#1356A0]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan Password Baru
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
