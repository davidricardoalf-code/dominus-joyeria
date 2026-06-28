import imageCompression from 'browser-image-compression';

/**
 * Convierte CUALQUIER imagen subida (png, heic, webp, etc.) a un JPG optimizado
 * antes de guardarla en Supabase Storage. Reduce peso y normaliza el formato.
 */
export async function compressToJpg(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.8, // tamaño objetivo
    maxWidthOrHeight: 1600, // resolución máxima del lado mayor
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.82,
  };

  const compressed = await imageCompression(file, options);
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';

  return new File([compressed], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
