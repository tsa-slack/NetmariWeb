import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { supabase } from '../lib/supabase';
import { Car, Save, ArrowLeft } from 'lucide-react';
import { useQuery } from '../lib/data-access';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

interface VehicleFormData {
  name: string;
  manufacturer: string;
  year: number;
  type: string;
  image_url: string;
  description: string;
  location: string;
  price_per_day: number;
  status: string;
  license_plate: string;
}

export default function VehicleFormPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    manufacturer: '',
    year: new Date().getFullYear(),
    type: 'バイク',
    image_url: '',
    description: '',
    location: '',
    price_per_day: 0,
    status: 'Available',
    license_plate: '',
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

      const { data: rentalData, error: rentalError } = await (supabase
        .from('rental_vehicles'))
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('id', id!)
        .single();

      if (rentalError) throw rentalError;

      if (rentalData && rentalData.vehicle) {
        const images = rentalData.vehicle.images;
        const firstImage = Array.isArray(images) && images.length > 0 ? String(images[0]) : '';
        setFormData({
          name: rentalData.vehicle.name || '',
          manufacturer: rentalData.vehicle.manufacturer || '',
          year: rentalData.vehicle.year || new Date().getFullYear(),
          type: rentalData.vehicle.type || 'バイク',
          image_url: firstImage,
          description: rentalData.vehicle.description || '',
          location: rentalData.location || '',
          price_per_day: Number(rentalData.price_per_day),
          status: rentalData.status || 'Available',
          license_plate: rentalData.license_plate || '',
        });
      }

      return { success: true, data: rentalData };
    },
    { enabled: !!(isEditing && user && isAdmin) }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.manufacturer || !formData.location) {
      toast.warning('必須項目を入力してください');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      const vehicleImages = formData.image_url ? [formData.image_url] : [];

      if (isEditing) {
        const { data: rentalVehicle } = await (supabase

          .from('rental_vehicles'))

          .select('vehicle_id')
          .eq('id', id!)
          .single();

        if (rentalVehicle) {
          const { error: vehicleError } = await (supabase

            .from('vehicles'))

            .update({
              name: formData.name,
              manufacturer: formData.manufacturer,
              year: formData.year,
              type: formData.type,
              images: vehicleImages,
              description: formData.description,
            })
            .eq('id', rentalVehicle.vehicle_id!);

          if (vehicleError) throw vehicleError;

          const { error: rentalError } = await (supabase


            .from('rental_vehicles'))


            .update({
              location: formData.location,
              price_per_day: formData.price_per_day,
              status: formData.status,
              license_plate: formData.license_plate || null,
            })
            .eq('id', id!);

          if (rentalError) throw rentalError;
        }

        toast.success('車両を更新しました');
      } else {
        const { data: vehicleData, error: vehicleError } = await (supabase

          .from('vehicles'))

          .insert({
            name: formData.name,
            manufacturer: formData.manufacturer,
            year: formData.year,
            type: formData.type,
            images: vehicleImages,
            description: formData.description,
            purpose: 'rental',
          })
          .select()
          .single();

        if (vehicleError) throw vehicleError;

        const { error: rentalError } = await (supabase


          .from('rental_vehicles'))


          .insert({
            vehicle_id: vehicleData.id,
            location: formData.location,
            price_per_day: formData.price_per_day,
            status: formData.status,
            license_plate: formData.license_plate || null,
          });

        if (rentalError) throw rentalError;

        toast.success('車両を登録しました');
      }

      navigate('/admin/vehicles');
    } catch (error) {
      handleError(error, '車両の保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = () => {
    if (!isDirty) setIsDirty(true);
  };

  if (loading || loadingData) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmSubmit}
        title={isEditing ? '車両を更新しますか？' : '車両を登録しますか？'}
        message="この内容で保存します。よろしいですか？"
        confirmText={isEditing ? '更新する' : '登録する'}
        cancelText="キャンセル"
        type="info"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/vehicles')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            車両管理に戻る
          </button>

          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Car className="h-10 w-10 mr-3 text-purple-600" />
            {isEditing ? 'レンタル車両編集' : 'レンタル車両登録'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'レンタル車両情報を編集します' : 'レンタル用車両を新規登録します'}
          </p>
        </div>

        <form onSubmit={handleSubmit} onChange={handleFormChange} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="例: ホンダ"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  車両名<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例: CB400"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                  カテゴリー
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="バイク">バイク</option>
                  <option value="原付">原付</option>
                  <option value="自転車">自転車</option>
                  <option value="キャンピングカー">キャンピングカー</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  場所<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="例: 東京都渋谷区"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ナンバープレート
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) =>
                    setFormData({ ...formData, license_plate: e.target.value })
                  }
                  placeholder="例: 品川 300 あ 12-34"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">スタッフ・管理者のみ表示されます</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1日あたりの料金（円）
                </label>
                <input
                  type="number"
                  value={formData.price_per_day}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_per_day: parseFloat(e.target.value),
                    })
                  }
                  min="0"
                  step="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
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
                  <option value="OnRent">レンタル中</option>
                  <option value="Maintenance">メンテナンス中</option>
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
                rows={4}
                placeholder="車両の特徴や注意事項など..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <ImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              bucket="vehicles"
              folder="vehicles"
              label="車両画像"
            />

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 flex items-center justify-center"
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
                onClick={() => navigate('/admin/vehicles')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
