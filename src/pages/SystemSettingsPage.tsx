import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import { Settings, Save, AlertCircle, CheckCircle, Info, Award } from 'lucide-react';
import { useQuery } from '../lib/data-access';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

interface RankConfig {
  name: string;
  min_amount: number;
  min_likes: number;
  min_posts: number;
  discount_rate: number;
}

interface RankSettings {
  ranks: {
    Bronze: RankConfig;
    Silver: RankConfig;
    Gold: RankConfig;
    Platinum: RankConfig;
  };
}

export default function SystemSettingsPage() {
  const { user, loading, isAdmin } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [rankSettings, setRankSettings] = useState<RankSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 設定データを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { loading: loadingSettings } = useQuery<any>(
    async () => {
      const { data, error } = await (supabase
        .from('system_settings'))
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);

      // ランク設定を取得
      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const settingWithRank = data.find((s: any) => s.key === 'rank_settings');
        if (settingWithRank) {
          setRankSettings(JSON.parse(settingWithRank.value));
        } else {
          const { data: rankData } = await (supabase
            .from('system_settings'))
            .select('rank_settings')
            .limit(1)
            .maybeSingle();

          if (rankData && rankData.rank_settings) {
            setRankSettings(rankData.rank_settings as RankSettings);
          }
        }
      }

      return { success: true, data: data || [] };
    },
    { enabled: !!(user && isAdmin) }
  );

  const handleToggle = (key: string) => {
    setSettings(
      settings.map((setting) =>
        setting.key === key
          ? { ...setting, value: setting.value === 'true' ? 'false' : 'true' }
          : setting
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      // 通常の設定を保存
      for (const setting of settings) {
        const { error } = await (supabase

          .from('system_settings'))

          .update({ value: setting.value })
          .eq('key', setting.key);

        if (error) throw error;
      }

      // ランク設定を保存
      if (rankSettings) {
        const { error } = await (supabase

          .from('system_settings'))

          .update({ rank_settings: rankSettings })
          .limit(1);

        if (error) throw error;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast.error('設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const updateRankConfig = (rankName: keyof RankSettings['ranks'], field: keyof RankConfig, value: number) => {
    if (!rankSettings) return;

    setRankSettings({
      ...rankSettings,
      ranks: {
        ...rankSettings.ranks,
        [rankName]: {
          ...rankSettings.ranks[rankName],
          [field]: value
        }
      }
    });
  };

  const getSettingLabel = (key: string) => {
    switch (key) {
      case 'rental_enabled':
        return 'レンタル機能';
      case 'partner_registration_enabled':
        return '協力店登録機能';
      case 'user_registration_enabled':
        return 'ユーザー登録機能';
      default:
        return key;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Settings className="h-10 w-10 mr-3 text-blue-600" />
            システム設定
          </h1>
          <p className="text-gray-600">システム全体の機能を管理</p>
        </div>

        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">設定を保存しました</span>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">重要な注意事項</p>
            <p>
              機能を無効にすると、ユーザーは該当機能にアクセスできなくなります。無効化する前に、影響を十分に確認してください。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loadingSettings ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {settings.map((setting) => (
                  <div key={setting.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {getSettingLabel(setting.key)}
                        </h3>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          最終更新:{' '}
                          {new Date(setting.updated_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <div className="ml-6">
                        <button
                          onClick={() => handleToggle(setting.key)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                            setting.value === 'true'
                              ? 'bg-blue-600'
                              : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                              setting.value === 'true'
                                ? 'translate-x-7'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <div className="text-center mt-2">
                          <span
                            className={`text-xs font-semibold ${
                              setting.value === 'true'
                                ? 'text-blue-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {setting.value === 'true' ? '有効' : '無効'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  変更は保存ボタンを押すまで反映されません
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      設定を保存
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">各機能の説明</h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2"></span>
              <span>
                <strong>レンタル機能:</strong>{' '}
                車両やギアのレンタル予約機能を制御します。無効にすると、レンタルページへのアクセスが制限されます。
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2"></span>
              <span>
                <strong>協力店登録機能:</strong>{' '}
                新規協力店の登録申請を受け付けるかどうかを制御します。
              </span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2"></span>
              <span>
                <strong>ユーザー登録機能:</strong>{' '}
                新規ユーザーの登録を受け付けるかどうかを制御します。
              </span>
            </li>
          </ul>
        </div>

        {/* ランク設定 */}
        {rankSettings && (
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <Award className="h-8 w-8 mr-3 text-yellow-600" />
                会員ランク設定
              </h2>
              <p className="text-gray-600">
                各ランクの達成条件と割引率を設定します。いずれかの条件を満たすと自動的にランクアップします。
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="divide-y">
                {Object.entries(rankSettings.ranks).map(([rankName, config]) => (
                  <div key={rankName} className="p-6">
                    <div className="flex items-center mb-4">
                      <Award
                        className={`h-6 w-6 mr-2 ${
                          rankName === 'Platinum'
                            ? 'text-gray-400'
                            : rankName === 'Gold'
                            ? 'text-yellow-500'
                            : rankName === 'Silver'
                            ? 'text-gray-300'
                            : 'text-orange-600'
                        }`}
                      />
                      <h3 className="text-xl font-bold text-gray-800">{rankName}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          累計利用金額（円）
                        </label>
                        <input
                          type="number"
                          value={config.min_amount}
                          onChange={(e) =>
                            updateRankConfig(
                              rankName as keyof RankSettings['ranks'],
                              'min_amount',
                              Number(e.target.value)
                            )
                          }
                          disabled={rankName === 'Bronze'}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          割引率（%）
                        </label>
                        <input
                          type="number"
                          value={config.discount_rate}
                          onChange={(e) =>
                            updateRankConfig(
                              rankName as keyof RankSettings['ranks'],
                              'discount_rate',
                              Number(e.target.value)
                            )
                          }
                          min="0"
                          max="100"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最小いいね獲得数
                        </label>
                        <input
                          type="number"
                          value={config.min_likes}
                          onChange={(e) =>
                            updateRankConfig(
                              rankName as keyof RankSettings['ranks'],
                              'min_likes',
                              Number(e.target.value)
                            )
                          }
                          disabled={rankName === 'Bronze'}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          最小投稿数
                        </label>
                        <input
                          type="number"
                          value={config.min_posts}
                          onChange={(e) =>
                            updateRankConfig(
                              rankName as keyof RankSettings['ranks'],
                              'min_posts',
                              Number(e.target.value)
                            )
                          }
                          disabled={rankName === 'Bronze'}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">ランクアップ条件</h4>
                  <p className="text-sm text-blue-700">
                    各ランクの「累計利用金額」「いいね獲得数」「投稿数」のいずれかを満たすと、自動的にそのランクにアップします。
                    ランクはシステムが自動で計算・更新するため、管理者が手動で変更する必要はありません。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
