import { FallbackProps } from 'react-error-boundary';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export function GlobalErrorBoundary({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          予期せぬエラーが発生しました
        </h1>
        
        <p className="text-gray-600 mb-6">
          申し訳ございません。アプリケーションで問題が発生しました。
          再読み込みをお試しください。
        </p>

        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-48 text-xs font-mono text-red-800">
            {(error as any).message}
          </div>
        )}

        <button
          onClick={resetErrorBoundary}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCcw className="w-4 h-4" />
          アプリケーションを再読み込み
        </button>
      </div>
    </div>
  );
}
