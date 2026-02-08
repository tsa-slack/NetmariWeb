import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * 汎用的なエラー表示コンポーネント
 * データ取得失敗時などに使用
 */
export default function ErrorState({
  title = 'エラーが発生しました',
  message = 'データの取得に失敗しました。再度お試しください。',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-red-50 rounded-full p-6 mb-6">
        <AlertTriangle className="h-12 w-12 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          再試行
        </button>
      )}
    </div>
  );
}
