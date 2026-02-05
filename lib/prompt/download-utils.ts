/**
 * File download utilities for client-side exports
 * Eliminates duplicate download logic across VEO components
 */

/**
 * Downloads data as a JSON file
 * @param data Data to be JSON stringified and downloaded
 * @param filename Name of the downloaded file (should end in .json)
 */
export function downloadJson(data: unknown, filename: string): void {
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");
}

/**
 * Downloads content as a text file
 * @param content Text content to download
 * @param filename Name of the downloaded file (should end in .txt)
 */
export function downloadText(content: string, filename: string): void {
  downloadFile(content, filename, "text/plain");
}

/**
 * Downloads content as a file with specified MIME type
 * @param content File content as string
 * @param filename Name of the downloaded file
 * @param mimeType MIME type of the file (e.g., "application/json", "text/plain")
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  // Better cleanup pattern - append, click, remove
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Clean up the object URL
  URL.revokeObjectURL(url);
}
