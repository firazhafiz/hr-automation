"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function DeleteDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  title = "Hapus Data Rekap?",
  description = "Tindakan ini tidak dapat dibatalkan. Data rekap HR ini akan ditandai sebagai dihapus di dalam sistem dan tidak akan muncul lagi di tabel."
}: DeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto sm:mx-0">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-center sm:text-left">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center sm:text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 sm:space-x-3">
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }} 
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Menghapus..." : "Ya, Hapus Data"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
