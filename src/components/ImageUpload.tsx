import { useState, useRef } from 'react';
import { Upload, X, Loader } from 'lucide-react';
import { uploadImage, validateImageFile } from '../lib/imageUpload';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket: 'images' | 'vehicles' | 'avatars';
  folder?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  bucket,
  folder,
  label = '画像をアップロード',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);

    try {
      const result = await uploadImage(file, bucket, folder);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Upload preview"
            className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <label
            htmlFor={`file-upload-${bucket}`}
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <Loader className="h-10 w-10 text-blue-600 animate-spin mb-3" />
              ) : (
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
              )}
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">クリックしてアップロード</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP, GIF (最大5MB)</p>
            </div>
            <input
              id={`file-upload-${bucket}`}
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {uploading && (
        <div className="mt-2 text-sm text-blue-600">
          アップロード中...
        </div>
      )}
    </div>
  );
}
