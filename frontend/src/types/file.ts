// ============================================================
// File Upload DTOs
// ============================================================

export interface FileDto {
  id: string;
  providerValue: string; // relative path on server
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

/** URL để serve file: /api/files/serve/{id} */
export function fileServeUrl(fileId: string): string {
  return `/api/files/serve/${fileId}`;
}
