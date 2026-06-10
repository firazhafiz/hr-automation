import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase URL or Service Role Key in environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const BUCKET_NAME = "form-images";

/**
 * Uploads a form image buffer/file to Supabase Storage in the 'form-images' bucket
 * and returns the public URL.
 */
export async function uploadFormImage(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  // Ensure bucket exists
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!bucketExists) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });
    if (createError) {
      console.error("Error creating bucket:", createError);
    }
  }

  // Upload file
  const fileExtension = fileName.split(".").pop() || "jpg";
  const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(uniqueFileName, fileBuffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image to Supabase Storage: ${uploadError.message}`);
  }

  // Get Public URL
  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(uniqueFileName);

  if (!data?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded form image");
  }

  return data.publicUrl;
}
