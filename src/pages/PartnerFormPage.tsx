import { useState } from 'react';
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { useQuery, useRepository, PartnerRepository } from '../lib/data-access';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';




const PARTNER_TYPES = [
  { value: 'RVPark', label: 'RVパーク' },
  { value: 'Restaurant', label: 'レストラン' },
  { value: 'GasStation', label: 'ガソリンスタンド' },
  { value: 'Tourist', label: '観光施設' },
  { value: 'Other', label: 'その他' },
];

export default function PartnerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const partnerRepo = useRepository(PartnerRepository);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty && !submitting);

  const [name, setName] = useState('');
  const [type, setType] = useState('RVPark');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const isEdit = !!id;
  const isAdmin = profile?.role === 'Admin';

  // 編集時にパートナーデータを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { loading } = useQuery<any>(
    async () => {
      const result = await partnerRepo.findById(id!);
      if (!result.success) throw result.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;
      if (data) {
        setName(data.name);
        setType(data.type || 'RVPark');
        setDescription(data.description || '');
        setAddress(data.address || '');
        setLatitude(data.latitude?.toString() || '');
        setLongitude(data.longitude?.toString() || '');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contact = typeof data.contact === 'object' && data.contact ? data.contact as Record<string, any> : {};
        setPhone(contact.phone || '');
        setEmail(contact.email || '');
        setWebsite(contact.website || '');

        const images = Array.isArray(data.images) ? data.images : [];
        setImageUrls(images.join('\n'));
        setUploadedImages(images as string[]);
      }

      return { success: true, data };
    },
    { enabled: !!(id && isAdmin) }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.warning('協力店名を入力してください');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setSubmitting(true);

      const urlImages = imageUrls
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url);

      const allImages = [...uploadedImages, ...urlImages];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contact: Record<string, any> = {};
      if (phone) contact.phone = phone;
      if (email) contact.email = email;
      if (website) contact.website = website;

      const partnerData = {
        name: name.trim(),
        type,
        description: description.trim() || null,
        address: address.trim() || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        contact,
        images: allImages,
      };

      if (isEdit) {
        const result = await partnerRepo.update(id!, partnerData);
        if (!result.success) throw result.error;
        toast.success('協力店を更新しました');
      } else {
        const result = await partnerRepo.create(partnerData);
        if (!result.success) throw result.error;
        toast.success('協力店を作成しました');
        navigate(`/partners/${result.data.id}`);
        return;
      }

      navigate(`/partners/${id}`);
    } catch (error) {
      handleError(error, `協力店の${isEdit ? '更新' : '作成'}に失敗しました`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = () => {
    if (!isDirty) setIsDirty(true);
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/partners" replace />;
  }

  return (
    <Layout>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        title={isEdit ? '協力店を更新しますか？' : '協力店を作成しますか？'}
        message="この内容で保存します。よろしいですか？"
        confirmText={isEdit ? '更新する' : '作成する'}
        cancelText="キャンセル"
        type="info"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            to={isEdit ? `/partners/${id}` : '/admin'}
            className="text-blue-600 hover:text-blue-700"
          >
            ← {isEdit ? '協力店詳細に戻る' : '管理画面に戻る'}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {isEdit ? '協力店を編集' : '新しい協力店を追加'}
          </h1>

          <form onSubmit={handleSubmit} onChange={handleFormChange} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  協力店名 <span className="text-red-600">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  タイプ <span className="text-red-600">*</span>
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PARTNER_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  住所
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                  緯度
                </label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="例：35.6812"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                  経度
                </label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="例：139.7671"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">連絡先情報</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    電話番号
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    ウェブサイト
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像アップロード
              </label>
              {/* TODO: ImageUploadコンポーネントは単一画像用です。複数画像アップロードには別のコンポーネントが必要です */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-600">複数画像アップロード機能は実装予定です</p>
                <p className="text-sm text-gray-500 mt-2">現在は画像URLを直接入力してください</p>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                最大5枚まで画像をアップロードできます
              </p>
            </div>

            <div className="border-t pt-6">
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                または画像URL（1行に1つずつ）
              </label>
              <textarea
                id="images"
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                rows={3}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                直接URLを入力することもできます
              </p>
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '保存中...' : isEdit ? '更新する' : '作成する'}
              </button>
              <Link
                to={isEdit ? `/partners/${id}` : '/admin'}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
