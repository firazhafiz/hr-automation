import { create } from "zustand";
import { toast } from "sonner";
import { ImageFile } from "@/components/scan/ImageCapture";

export type ItemStatus = "pending" | "processing" | "success" | "error";

export interface BatchResultItem {
  imageFile: ImageFile;
  status: ItemStatus;
  data?: any;
  error?: string;
}

interface ScanState {
  step: 1 | 2 | 3;
  images: ImageFile[];
  batchResults: BatchResultItem[];
  currentIndex: number;
  isProcessing: boolean;
  isFinished: boolean;
  isRetrying: boolean;
  isCancelled: boolean;

  setStep: (step: 1 | 2 | 3) => void;
  setImages: (images: ImageFile[]) => void;
  setBatchResults: (results: BatchResultItem[]) => void;
  updateBatchResult: (index: number, update: Partial<BatchResultItem>) => void;
  resetScan: () => void;
  cancelProcessing: () => void;

  startProcessing: () => Promise<void>;
  retryFailed: () => Promise<void>;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
};

export const useScanStore = create<ScanState>((set, get) => ({
  step: 1,
  images: [],
  batchResults: [],
  currentIndex: 0,
  isProcessing: false,
  isFinished: false,
  isRetrying: false,
  isCancelled: false,

  setStep: (step) => set({ step }),

  setImages: (images) => {
    set({
      images,
      batchResults: images.map((img) => ({
        imageFile: img,
        status: "pending",
      })),
      isProcessing: false,
      isFinished: false,
      isRetrying: false,
      isCancelled: false,
      currentIndex: 0,
    });
  },

  setBatchResults: (batchResults) => set({ batchResults }),

  updateBatchResult: (index, update) =>
    set((state) => ({
      batchResults: state.batchResults.map((r, i) =>
        i === index ? { ...r, ...update } : r,
      ),
    })),

  resetScan: () =>
    set({
      step: 1,
      images: [],
      batchResults: [],
      currentIndex: 0,
      isProcessing: false,
      isFinished: false,
      isRetrying: false,
      isCancelled: false,
    }),

  cancelProcessing: () => {
    set({ isCancelled: true, isProcessing: false, isRetrying: false });
  },

  startProcessing: async () => {
    const state = get();
    if (state.isProcessing || state.images.length === 0 || state.isFinished) return;

    set({ isProcessing: true, isFinished: false, isCancelled: false });

    for (let i = 0; i < get().images.length; i++) {
      if (get().isCancelled) break;

      // Skip already successful ones (in case of re-entry)
      if (get().batchResults[i]?.status === "success") continue;

      set({ currentIndex: i });
      get().updateBatchResult(i, { status: "processing", error: undefined });

      const img = get().images[i];
      try {
        const file = dataURLtoFile(img.src, img.name);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/scan", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: `HTTP ${res.status}` }));
          let errorMsg = err.error || "Gagal memproses gambar";

          if (err.rateLimit?.retryAfterSeconds) {
            errorMsg = `Sistem sibuk. Tunggu ${err.rateLimit.retryAfterSeconds} detik.`;
          } else if (
            err.rateLimit?.nextResetUTC &&
            !err.rateLimit.allowed &&
            err.rateLimit.dailyUsed >= err.rateLimit.dailyLimit
          ) {
            errorMsg = "Batas harian tercapai. Coba lagi besok.";
          }

          throw new Error(errorMsg);
        }

        const result = await res.json();
        get().updateBatchResult(i, { status: "success", data: result.data });
      } catch (err: any) {
        const errorMsg = err.message || "Terjadi kesalahan";
        get().updateBatchResult(i, { status: "error", error: errorMsg });
      }

      // Delay between requests
      if (i < get().images.length - 1 && !get().isCancelled) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    if (!get().isCancelled) {
      set({ isFinished: true });
    }
    set({ isProcessing: false });
  },

  retryFailed: async () => {
    const state = get();
    if (state.isRetrying || state.isProcessing) return;

    set({ isRetrying: true, isCancelled: false });

    const failedIndices = get()
      .batchResults.map((r, i) => (r.status === "error" ? i : -1))
      .filter((i) => i >= 0);

    for (const idx of failedIndices) {
      if (get().isCancelled) break;

      set({ currentIndex: idx });
      get().updateBatchResult(idx, { status: "processing", error: undefined });

      const img = get().images[idx];
      try {
        const file = dataURLtoFile(img.src, img.name);
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/scan", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res
            .json()
            .catch(() => ({ error: `HTTP ${res.status}` }));
          let errorMsg = err.error || "Gagal memproses gambar";
          throw new Error(errorMsg);
        }

        const result = await res.json();
        get().updateBatchResult(idx, { status: "success", data: result.data });
      } catch (err: any) {
        const errorMsg = err.message || "Terjadi kesalahan";
        get().updateBatchResult(idx, { status: "error", error: errorMsg });
      }

      if (
        idx !== failedIndices[failedIndices.length - 1] &&
        !get().isCancelled
      ) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    set({ isRetrying: false });
    // If all succeed, isFinished should still be true, but we could update it
    const allSuccess = get().batchResults.every(r => r.status === "success");
    if (allSuccess) {
        set({ isFinished: true });
    }
  },
}));
