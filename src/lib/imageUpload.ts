import { supabase } from './supabase';
import { optimizeImage } from './imageOptimize';

export interface UploadResult {
  url: string;
  path: string;
}

export const uploadImage = async (
  file: File,
  bucket: 'images' | 'vehicles' | 'avatars',
  folder?: string
): Promise<UploadResult> => {
  // アップロード前に画像を最適化（リサイズ + WebP圧縮）
  const optimizedFile = await optimizeImage(file);

  const fileExt = optimizedFile.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, optimizedFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`画像のアップロードに失敗しました: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

  return {
    url: publicUrl,
    path: uploadData.path,
  };
};

export const deleteImage = async (
  bucket: 'images' | 'vehicles' | 'avatars',
  path: string
): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`画像の削除に失敗しました: ${error.message}`);
  }
};

export const validateImageFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 5 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    return '対応していないファイル形式です。JPG、PNG、WEBP、GIFのいずれかを選択してください。';
  }

  if (file.size > maxSize) {
    return 'ファイルサイズは5MB以下にしてください。';
  }

  return null;
};
