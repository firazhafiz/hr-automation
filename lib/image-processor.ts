import sharp from "sharp";

/**
 * Preprocesses an image buffer to improve OCR accuracy for handwriting.
 * Balanced approach: enhance without over-processing.
 * 
 * - Auto-rotate based on EXIF
 * - Resize to optimal size
 * - Moderate contrast enhancement
 * - Light sharpening
 * - High-quality JPEG output
 */
export async function preprocessImage(
  inputBuffer: Buffer
): Promise<{ buffer: Buffer; contentType: string; qualityWarning: string | null }> {
  // Balanced pipeline - don't over-process
  const pipeline = sharp(inputBuffer)
    .rotate() // auto-rotate from EXIF
    .resize({
      width: 2200, // Good balance between detail and file size
      height: 3000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .normalize() // Standard histogram normalization
    .sharpen({ sigma: 1.2 }) // Moderate sharpening for text
    .jpeg({ quality: 92 }); // High quality without bloat

  const buffer = await pipeline.toBuffer();

  // Quality check
  const stats = await sharp(inputBuffer).rotate().stats();
  const avgBrightness = (stats.channels[0].mean + (stats.channels[1]?.mean ?? stats.channels[0].mean)) / 2;

  let qualityWarning: string | null = null;
  if (avgBrightness < 40) {
    qualityWarning = "Gambar terlalu gelap. Hasil OCR mungkin kurang akurat. Coba foto ulang dengan pencahayaan lebih baik.";
  } else if (avgBrightness > 220) {
    qualityWarning = "Gambar terlalu terang (backlit). Hasil OCR mungkin kurang akurat. Coba foto ulang tanpa cahaya dari belakang.";
  }

  return {
    buffer,
    contentType: "image/jpeg",
    qualityWarning,
  };
}
