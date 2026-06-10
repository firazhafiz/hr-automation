/**
 * OCR.space API integration — optimized for handwritten HR forms
 * Free tier: 25,000 requests/month
 * Docs: https://ocr.space/ocrapi
 */

const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY;
const OCR_SPACE_API_URL = "https://api.ocr.space/parse/image";

if (!OCR_SPACE_API_KEY) {
  console.warn("⚠️  OCR_SPACE_API_KEY tidak ditemukan di .env");
}

interface OCRSpaceResponse {
  ParsedResults?: Array<{
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string[];
  ErrorDetails?: string;
}

/**
 * Performs OCR on an image URL using OCR.space API.
 * Optimized for handwritten HR table forms (Cuti/Ijin, SP).
 *
 * @param imageUrl - Public URL of the image to process
 * @returns Extracted text from the image
 */
export async function performOCR(imageUrl: string): Promise<string> {
  if (!OCR_SPACE_API_KEY) {
    throw new Error(
      "OCR_SPACE_API_KEY tidak ditemukan. Silakan daftar di https://ocr.space/ocrapi dan masukkan API key ke file .env"
    );
  }

  try {
    const formData = new FormData();
    formData.append("url", imageUrl);
    formData.append("apikey", OCR_SPACE_API_KEY);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("isTable", "true");          // ← TABLE MODE: preserves row/column structure
    formData.append("OCREngine", "2");            // Engine 2 = best for handwriting
    formData.append("filetype", "jpg");           // Force consistent format

    const response = await fetch(OCR_SPACE_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR.space API returned status ${response.status}`);
    }

    const data: OCRSpaceResponse = await response.json();

    // Check for processing errors
    if (data.IsErroredOnProcessing) {
      const errorMsg = data.ErrorMessage?.join(", ") || data.ErrorDetails || "Unknown error";
      throw new Error(`OCR.space processing error: ${errorMsg}`);
    }

    if (data.OCRExitCode !== 1) {
      throw new Error(`OCR.space exit code ${data.OCRExitCode}: ${data.ErrorDetails || "Failed to process"}`);
    }

    // Extract text from first result
    const parsedText = data.ParsedResults?.[0]?.ParsedText || "";

    if (!parsedText || parsedText.trim() === "") {
      console.warn("OCR.space returned empty text - image might not contain readable text");
      return "";
    }

    console.log("=== RAW OCR OUTPUT ===");
    console.log(parsedText);
    console.log("=== END OCR OUTPUT ===");

    return parsedText.trim();
  } catch (error: any) {
    console.error("Error calling OCR.space API:", error);
    throw new Error(`OCR failed: ${error.message || error}`);
  }
}
