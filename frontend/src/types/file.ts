// ============================================================
// File Upload DTOs
// ============================================================

export interface FileDto {
  id: string;
  filename: string;
  url: string;
}

/** URL để serve file: /api/files/serve/{id} */
export function fileServeUrl(fileId: string): string {
  return `/api/files/serve/${fileId}`;
}
