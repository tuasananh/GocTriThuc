// ============================================================
// File Upload DTOs
// ============================================================

export interface FileDto {
  id: number;
  providerValue: string; // relative path on server
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

/** URL để serve file: /api/files/serve/{id} */
export function fileServeUrl(fileId: number): string {
  return `/api/files/serve/${fileId}`;
}
