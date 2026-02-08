import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullPage?: boolean;
}

/**
 * 汎用ローディングスピナー
 * @param size - スピナーサイズ (sm: 24px, md: 40px, lg: 56px)
 * @param message - 表示メッセージ（「読み込み中...」等）
 * @param fullPage - true の場合、ビューポート全体をカバー（デフォルト true）
 */
export default function LoadingSpinner({
  size = 'md',
  message,
  fullPage = true,
}: LoadingSpinnerProps) {
  const sizeMap = { sm: 24, md: 40, lg: 56 };
  const iconSize = sizeMap[size];

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        size={iconSize}
        className="animate-spin text-blue-600"
      />
      {message && (
        <p className="text-gray-500 text-sm">{message}</p>
      )}
    </div>
  );

  if (!fullPage) {
    return <div className="flex justify-center py-8">{spinner}</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      {spinner}
    </div>
  );
}
