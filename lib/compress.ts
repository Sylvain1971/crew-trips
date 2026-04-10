import imageCompression from 'browser-image-compression'

export async function compressPhoto(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 1, maxWidthOrHeight: 1920,
      useWebWorker: true, fileType: 'image/jpeg', initialQuality: 0.82,
    })
  } catch { return file }
}

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b/1024).toFixed(0)} KB`
  if (b < 1073741824) return `${(b/1048576).toFixed(1)} MB`
  return `${(b/1073741824).toFixed(2)} GB`
}

export function storagePct(used: number, limit: number) {
  return Math.min(100, Math.round((used/limit)*100))
}
