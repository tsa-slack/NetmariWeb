import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SystemSettingsRepository, useQuery } from '../lib/data-access';

export default function RentalPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // リポジトリインスタンスを作成
  const settingsRepo = new SystemSettingsRepository();

  // レンタル有効状態を取得
  const { data: rentalEnabledValue, loading: checkingSettings } = useQuery<string | null>(
    async () => settingsRepo.findByKey('rental_enabled'),
    { enabled: true }
  );

  const rentalEnabled = rentalEnabledValue === 'true';

  // ユーザー認証チェック
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=/rental');
    }
  }, [loading, user, navigate]);

  if (loading || checkingSettings) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (!rentalEnabled) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              レンタル機能は現在利用できません
            </h1>
            <p className="text-gray-600 mb-8">
              申し訳ございませんが、レンタル機能は一時的にご利用いただけません。
              <br />
              詳しくはお問い合わせください。
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                トップページへ
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                お問い合わせ
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('利用開始日と返却日を選択してください');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setError('返却日は利用開始日より後の日付を選択してください');
      return;
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    navigate(`/rental/vehicles?start=${startDate}&end=${endDate}&days=${days}`);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">レンタル予約</h1>
          <p className="text-xl text-gray-600">
            利用期間を選択してください
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  利用開始日
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={today}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  返却日
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || today}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {startDate && endDate && new Date(startDate) < new Date(endDate) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  利用期間:{' '}
                  {Math.ceil(
                    (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}
                  日間
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-semibold"
            >
              利用可能な車両を検索
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ご利用の流れ</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">利用期間の選択</p>
                  <p className="text-sm text-gray-600">利用開始日と返却日を選択します</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">車両の選択</p>
                  <p className="text-sm text-gray-600">利用可能な車両から選択します</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">ギア・装備の選択</p>
                  <p className="text-sm text-gray-600">必要な装備を追加できます（任意）</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">アクティビティの選択</p>
                  <p className="text-sm text-gray-600">体験したいアクティビティを選択できます（任意）</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  5
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-medium">予約の確定</p>
                  <p className="text-sm text-gray-600">内容を確認して予約を完了します</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
