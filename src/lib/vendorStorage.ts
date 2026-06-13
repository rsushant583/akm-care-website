import { getSupabaseClient } from "@/lib/supabaseClient";

export interface UploadedVendorDocument {
  name: string;
  path: string;
  size: number;
  type: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function uploadVendorDocuments(
  files: File[],
  applicationId: string,
): Promise<{ documents: UploadedVendorDocument[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { documents: [], error: "Storage not configured" };
  }

  const uploaded: UploadedVendorDocument[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return { documents: uploaded, error: `${file.name} exceeds 5MB limit` };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { documents: uploaded, error: `${file.name} has unsupported file type` };
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${applicationId}/${Date.now()}-${safeName}`;

    const { error } = await client.storage.from("vendor-documents").upload(path, file, {
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      return { documents: uploaded, error: error.message };
    }

    uploaded.push({
      name: file.name,
      path,
      size: file.size,
      type: file.type,
    });
  }

  return { documents: uploaded };
}
