import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ImageUpload from '../components/ImageUpload';
import { supabase } from '../lib/supabase';
import { Car, Save, ArrowLeft } from 'lucide-react';

interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  category: string;
  image_url: string;
  description: string;
  location: string;
  price_per_day: number;
  status: string;
}

export default function VehicleFormPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    category: 'バイク',
    image_url: '',
    description: '',
    location: '',
    price_per_day: 0,
    status: 'Available',
  });

  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isEditing && user && isAdmin) {
      loadVehicleData();
    }
  }, [id, user, isAdmin]);

  const loadVehicleData = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      const { data: rentalData, error: rentalError } = await (supabase

        .from('rental_vehicles') as any)

        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('id', id!)
        .single();

      if (rentalError) throw rentalError;

      if (rentalData && rentalData.vehicle) {
        setFormData({
          make: rentalData.vehicle.make,
          model: rentalData.vehicle.model,
          year: rentalData.vehicle.year,
          category: rentalData.vehicle.category,
          image_url: rentalData.vehicle.image_url || '',
          description: rentalData.vehicle.description || '',
          location: rentalData.location || '',
          price_per_day: Number(rentalData.price_per_day),
          status: rentalData.status,
        });
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('車両データの読み込みに失敗しました');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.make || !formData.model || !formData.location) {
      alert('必須項目を入力してください');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        const { data: rentalVehicle } = await (supabase

          .from('rental_vehicles') as any)

          .select('vehicle_id')
          .eq('id', id!)
          .single();

        if (rentalVehicle) {
          const { error: vehicleError } = await (supabase

            .from('vehicles') as any)

            .update({
              make: formData.make,
              model: formData.model,
              year: formData.year,
              category: formData.category,
              image_url: formData.image_url,
              description: formData.description,
            })
            .eq('id', rentalVehicle.vehicle_id);

          if (vehicleError) throw vehicleError;

          const { error: rentalError } = await (supabase


            .from('rental_vehicles') as any)


            .update({
              location: formData.location,
              price_per_day: formData.price_per_day,
              status: formData.status,
            })
            .eq('id', id!);

          if (rentalError) throw rentalError;
        }

        alert('車両を更新しました');
      } else {
        const { data: vehicleData, error: vehicleError } = await (supabase

          .from('vehicles') as any)

          .insert({
            name: `${formData.make} ${formData.model}`,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            category: formData.category,
            image_url: formData.image_url,
            description: formData.description,
            purpose: 'rental',
          })
          .select()
          .single();

        if (vehicleError) throw vehicleError;

        const { error: rentalError } = await (supabase


          .from('rental_vehicles') as any)


          .insert({
            vehicle_id: vehicleData.id,
            location: formData.location,
            price_per_day: formData.price_per_day,
            status: formData.status,
          });

        if (rentalError) throw rentalError;

        alert('車両を登録しました');
      }

      navigate('/admin/vehicles');
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('車両の保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/vehicles')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            車両管理に戻る
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Car className="h-10 w-10 mr-3 text-purple-600" />
            {isEditing ? 'レンタル車両編集' : 'レンタル車両登録'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'レンタル車両情報を編集します' : 'レンタル用車両を新規登録します'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メーカー<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData({ ...formData, make: e.target.value })
                  }
                  placeholder="例: ホンダ"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  モデル<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
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
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
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
