import { create } from "zustand";
import { ImageFile } from "@/components/scan/ImageCapture";
import { BatchResultItem } from "@/components/scan/ProcessingState";

interface ScanState {
  step: 1 | 2 | 3;
  images: ImageFile[];
  batchResults: BatchResultItem[];
  setStep: (step: 1 | 2 | 3) => void;
  setImages: (images: ImageFile[]) => void;
  setBatchResults: (results: BatchResultItem[]) => void;
  resetScan: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  step: 1,
  images: [],
  batchResults: [],
  setStep: (step) => set({ step }),
  setImages: (images) => set({ images }),
  setBatchResults: (batchResults) => set({ batchResults }),
  resetScan: () => set({ step: 1, images: [], batchResults: [] }),
}));
