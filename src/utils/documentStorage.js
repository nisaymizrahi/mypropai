export const DOCUMENT_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

export const formatStorageBytes = (bytes) => {
  const safeBytes = Number(bytes || 0);

  if (safeBytes >= 1024 * 1024 * 1024) {
    return `${(safeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  if (safeBytes >= 1024 * 1024) {
    return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (safeBytes >= 1024) {
    return `${(safeBytes / 1024).toFixed(1)} KB`;
  }

  return `${safeBytes} B`;
};
