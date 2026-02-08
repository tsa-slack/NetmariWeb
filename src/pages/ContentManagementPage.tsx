import { useState, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { SystemSettingsRepository, useQuery } from '../lib/data-access';
import { uploadImage, validateImageFile } from '../lib/imageUpload';
import { handleError } from '../lib/handleError';
import {
  Save,
  CheckCircle,
  Image as ImageIcon,
  Upload,
  Trash2,
  FileText,
  Type,
  Plus,
  HelpCircle,
} from 'lucide-react';

export default function ContentManagementPage() {
  const { user, loading, isAdmin } = useAuth();
  const settingsRepo = useMemo(() => new SystemSettingsRepository(), []);

  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [rentalIntroTitle, setRentalIntroTitle] = useState('');
  const [rentalIntroDescription, setRentalIntroDescription] = useState('');
  const [faqItems, setFaqItems] = useState<{ question: string; answer: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // コンテンツ設定を取得
  const { loading: loadingSettings } = useQuery<Record<string, string>>(
    async () => {
      const result = await settingsRepo.getContentSettings();
      if (!result.success) throw result.error;

      const data = result.data;
      setHeroImageUrl(data.hero_image_url || '');
      setHeroTitle(data.hero_title || '');
      setHeroSubtitle(data.hero_subtitle || '');
      setRentalIntroTitle(data.rental_intro_title || '');
      setRentalIntroDescription(data.rental_intro_description || '');

      // FAQ項目をパース
      try {
        const faq = data.faq_items ? JSON.parse(data.faq_items) : [];
        setFaqItems(faq);
      } catch {
        setFaqItems([]);
      }

      return result;
    },
    { enabled: !!(user && isAdmin) }
  );

  // 画像アップロード
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      handleError(new Error(validationError), validationError);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file, 'images', 'hero');
      setHeroImageUrl(result.url);
    } catch (error) {
      handleError(error, 'ヒーロー画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 画像削除
  const handleImageRemove = () => {
    setHeroImageUrl('');
  };

  // 保存
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const result = await settingsRepo.saveContentSettings({
        hero_image_url: heroImageUrl,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        rental_intro_title: rentalIntroTitle,
        rental_intro_description: rentalIntroDescription,
        faq_items: JSON.stringify(faqItems),
      });

      if (!result.success) throw result.error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      handleError(error, 'コンテンツ設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
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
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <FileText className="h-10 w-10 mr-3 text-blue-600" />
            コンテンツ管理
          </h1>
          <p className="text-gray-600">ホームページとレンタル紹介のコンテンツを管理します</p>
        </div>

        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-green-800">コンテンツを保存しました</span>
          </div>
        )}

        {loadingSettings ? (
          <LoadingSpinner size="sm" fullPage={false} />
        ) : (
          <>
            {/* ヒーロー設定 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <ImageIcon className="h-6 w-6 mr-2" />
                  ホームページ ヒーロー設定
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  トップページのメインビジュアルとテキストを管理します
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* ヒーロー画像 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    ヒーロー画像
                  </label>

                  {heroImageUrl ? (
                    <div className="relative group">
                      <div className="relative h-56 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={heroImageUrl}
                          alt="ヒーロー画像プレビュー"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition flex items-center"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              変更
                            </button>
                            <button
                              type="button"
                              onClick={handleImageRemove}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition flex items-center"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-56 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                          <p className="text-gray-600">アップロード中...</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 text-gray-400 mb-3" />
                          <p className="text-gray-600 font-medium">クリックして画像をアップロード</p>
                          <p className="text-sm text-gray-400 mt-1">JPG, PNG, WEBP, GIF（5MB以下）</p>
                        </>
                      )}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    画像を設定しない場合はグラデーション背景が表示されます
                  </p>
                </div>

                {/* ヒーロータイトル */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Type className="h-4 w-4 mr-1.5 text-gray-500" />
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="どこでも、寝泊まりを。"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* ヒーローサブタイトル */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Type className="h-4 w-4 mr-1.5 text-gray-500" />
                    サブタイトル
                  </label>
                  <input
                    type="text"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder="車中泊に特化したキャンピングカーコミュニティサービス"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* レンタル紹介コンテンツ */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-teal-600">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  レンタル紹介コンテンツ
                </h2>
                <p className="text-cyan-100 text-sm mt-1">
                  未ログインユーザーに表示されるレンタル紹介ページのテキストを管理します
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* レンタル紹介タイトル */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Type className="h-4 w-4 mr-1.5 text-gray-500" />
                    紹介タイトル
                  </label>
                  <input
                    type="text"
                    value={rentalIntroTitle}
                    onChange={(e) => setRentalIntroTitle(e.target.value)}
                    placeholder="車中泊レンタルの魅力"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>

                {/* レンタル紹介説明文 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <FileText className="h-4 w-4 mr-1.5 text-gray-500" />
                    紹介文
                  </label>
                  <textarea
                    value={rentalIntroDescription}
                    onChange={(e) => setRentalIntroDescription(e.target.value)}
                    rows={4}
                    placeholder="キャンピングカーでの車中泊は自由な旅の始まり。好きな場所で、好きな時間に、特別な体験を。"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                </div>
              </div>
            </div>

            {/* FAQ管理 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <HelpCircle className="h-6 w-6 mr-2" />
                  FAQ管理
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  ホームページに表示される「よくあるご質問」を管理します
                </p>
              </div>

              <div className="p-6 space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative group">
                    <button
                      type="button"
                      onClick={() => {
                        setFaqItems(faqItems.filter((_, i) => i !== index));
                      }}
                      className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                      title="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        質問
                      </label>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const updated = [...faqItems];
                          updated[index] = { ...updated[index], question: e.target.value };
                          setFaqItems(updated);
                        }}
                        placeholder="質問を入力"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        回答
                      </label>
                      <textarea
                        value={item.answer}
                        onChange={(e) => {
                          const updated = [...faqItems];
                          updated[index] = { ...updated[index], answer: e.target.value };
                          setFaqItems(updated);
                        }}
                        rows={2}
                        placeholder="回答を入力"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y text-sm"
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFaqItems([...faqItems, { question: '', answer: '' }])}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition flex items-center justify-center font-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  FAQ項目を追加
                </button>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-lg hover:shadow-xl"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    コンテンツを保存
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
