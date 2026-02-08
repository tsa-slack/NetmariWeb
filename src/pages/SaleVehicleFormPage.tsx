import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { Car, Save, ArrowLeft } from 'lucide-react';
import { useQuery, useRepository, VehicleRepository } from '../lib/data-access';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

interface VehicleFormData {
  name: string;
  type: string;
  manufacturer: string;
  year: number;
  price: number;
  description: string;
  purpose: 'sale' | 'rental' | 'both';
  status: string;
  images: string[];
}

export default function SaleVehicleFormPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const vehicleRepo = useRepository(VehicleRepository);

  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    type: 'キャブコン',
    manufacturer: '',
    year: new Date().getFullYear(),
    price: 0,
    description: '',
    purpose: 'sale',
    status: 'Available',
    images: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty && !submitting);

  // 編集時に車両データを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { loading: loadingData } = useQuery<any>(
    async () => {
      if (!id) return { success: true, data: null };

      const result = await vehicleRepo.findById(id);
      if (!result.success) throw result.error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = result.data as any;

      if (data) {
        setFormData({
          name: data.name || '',
          type: data.type || 'キャブコン',
          manufacturer: data.manufacturer || '',
          year: data.year || new Date().getFullYear(),
          price: Number(data.price) || 0,
          description: data.description || '',
          purpose: (data.purpose as 'sale' | 'rental' | 'both') || 'sale',
          status: data.status || 'Available',
          images: Array.isArray(data.images) ? data.images.filter((img: unknown): img is string => typeof img === 'string') : [],
        });
      }

      return { success: true, data };
    },
    { enabled: !!(isEditing && user && (isAdmin || isStaff)) }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.manufacturer) {
      toast.warning('必須項目を入力してください');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const vehicleData = {
        name: formData.name,
        type: formData.type,
        manufacturer: formData.manufacturer,
        year: formData.year,
        price: formData.price,
        description: formData.description,
        purpose: formData.purpose,
        status: formData.status,
        images: formData.images,
      };

      if (isEditing) {
        const result = await vehicleRepo.update(id!, vehicleData);
        if (!result.success) throw result.error;
        toast.success('車両を更新しました');
      } else {
        const result = await vehicleRepo.create(vehicleData);
        if (!result.success) throw result.error;
        toast.success('車両を登録しました');
      }

      navigate('/admin/sale-vehicles');
    } catch (error) {
      handleError(error, '車両の保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const addImageUrl = (url: string) => {
    setFormData({
      ...formData,
      images: [...formData.images, url],
    });
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleFormChange = () => {
    if (!isDirty) setIsDirty(true);
  };

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        title={isEditing ? '販売車両を更新しますか？' : '販売車両を登録しますか？'}
        message="この内容で保存します。よろしいですか？"
        confirmText={isEditing ? '更新する' : '登録する'}
        cancelText="キャンセル"
        type="info"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/sale-vehicles')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            販売車両管理に戻る
          </button>

          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Car className="h-10 w-10 mr-3 text-blue-600" />
            {isEditing ? '販売車両編集' : '販売車両登録'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? '販売車両情報を編集します' : '販売用車両を新規登録します'}
          </p>
        </div>

        <form onSubmit={handleSubmit} onChange={handleFormChange} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車両名<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例: キャンパー デラックス"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メーカー<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="例: トヨタ"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タイプ
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="キャブコン">キャブコン</option>
                  <option value="バンコン">バンコン</option>
                  <option value="トラックキャンパー">トラックキャンパー</option>
                  <option value="軽キャンパー">軽キャンパー</option>
                  <option value="フルコン">フルコン</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  年式
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  価格（円）
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                  min="0"
                  step="10000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用途<span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      purpose: e.target.value as 'sale' | 'rental' | 'both',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="sale">販売のみ</option>
                  <option value="rental">レンタルのみ</option>
                  <option value="both">販売・レンタル両方</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  販売のみ: 車両情報ページに表示 / レンタルのみ: レンタル検索で表示 / 両方: 両方に表示
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Available">利用可能</option>
                  <option value="Sold">売却済み</option>
                  <option value="Reserved">予約済み</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                placeholder="車両の特徴、装備、仕様など..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                車両画像
              </label>
              <div className="space-y-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <img
                      src={url}
                      alt={`車両画像 ${index + 1}`}
                      className="h-24 w-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      削除
                    </button>
                  </div>
                ))}
                <ImageUpload
                  value=""
                  onChange={addImageUrl}
                  bucket="vehicles"
                  folder="sale-vehicles"
                  label={formData.images.length === 0 ? '画像を追加' : '画像を追加'}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {isEditing ? '更新' : '登録'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/sale-vehicles')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
