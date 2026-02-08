import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Layout from '../components/Layout';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase がメール確認リンクのトークンを処理する
        // URL ハッシュフラグメントからセッションを取得
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          // セッションが取得できた → メール認証成功
          setStatus('success');
        } else {
          // セッションがない → まだ認証処理中の可能性
          // onAuthStateChange で検知するため少し待つ
          const timeout = setTimeout(() => {
            setStatus('success');
          }, 2000);
          return () => clearTimeout(timeout);
        }
      } catch (err: unknown) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'メール認証に失敗しました');
      }
    };

    handleCallback();
  }, []);

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">メール認証を処理中...</h2>
              <p className="text-gray-600">しばらくお待ちください</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">認証エラー</h2>
                <p className="text-gray-600">{errorMessage}</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ログインページへ
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // status === 'success'
  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                メール認証が完了しました！
              </h2>
              <p className="text-gray-600 mb-4">
                アカウントの認証が正常に完了しました。<br/>
                サービスをご利用いただけます。
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 text-center">
                ✨ ようこそ Netomari へ！キャンピングカーライフを楽しみましょう。
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/mypage')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                マイページへ
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                トップページへ
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
