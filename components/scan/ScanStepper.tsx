import { Check } from "lucide-react";

const steps = [
  { num: 1, label: "Ambil Foto" },
  { num: 2, label: "Proses" },
  { num: 3, label: "Periksa" },
] as const;

export function ScanStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.num;
        const isCurrent = currentStep === step.num;

        return (
          <div key={step.num} className="flex items-center">
            {/* Circle + Label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#1767AF] border-[#1767AF] text-white"
                    : isCurrent
                    ? "bg-white border-[#1767AF] text-[#1767AF] shadow-sm shadow-blue-100"
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.num}
              </div>
              <span
                className={`text-[11px] font-semibold transition-colors duration-300 ${
                  isCurrent ? "text-[#1767AF]" : isCompleted ? "text-slate-600" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div className="w-16 sm:w-24 mx-2 h-0.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-[#1767AF] transition-all duration-500"
                  style={{ width: isCompleted ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
