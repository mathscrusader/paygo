export const BUCKET = "payment-evidence";

/**
 * Turn a full public URL into the path Supabase expects for createSignedUrl.
 * Returns null if it can’t detect the path.
 */
export function extractStoragePath(publicUrl: string): string | null {
  // Public files look like: https://xxx.supabase.co/storage/v1/object/public/payment-evidence/<PATH>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx !== -1) {
    return publicUrl.slice(idx + marker.length);
  }
  // Signed URLs look like: .../object/sign/payment-evidence/<PATH>?token=...
  const signMarker = `/storage/v1/object/sign/${BUCKET}/`;
  const idx2 = publicUrl.indexOf(signMarker);
  if (idx2 !== -1) {
    const withoutQuery = publicUrl.split("?")[0];
    return withoutQuery.slice(idx2 + signMarker.length);
  }
  // Fallback: you stored the path already (no domain in it)
  if (!publicUrl.startsWith("http")) return publicUrl;
  return null;
}
