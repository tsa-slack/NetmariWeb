import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ImageUpload from '../components/ImageUpload';
import { supabase } from '../lib/supabase';
import { Package, Save, ArrowLeft } from 'lucide-react';
import { useQuery } from '../lib/data-access';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

interface EquipmentFormData {
  name: string;
  category: string;
  description: string;
  price_per_day: number;
  stock_quantity: number;
  available_quantity: number;
  image_url: string;
  is_published: boolean;
  pricing_type: 'PerDay' | 'PerUnit';
}

export default function EquipmentFormPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<EquipmentFormData>({
    name: '',
    category: 'テント',
    description: '',
    price_per_day: 0,
    stock_quantity: 0,
    available_quantity: 0,
    image_url: '',
    is_published: true,
    pricing_type: 'PerDay',
  });

  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'テント',
    'タープ',
    'シュラフ',
    'マット',
    'チェア',
    'テーブル',
    'ランタン',
    'バーナー',
    'クーラーボックス',
    'その他',
  ];

  // 編集時にデータを取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { loading: loadingData } = useQuery<any>(
    async () => {
      if (!id) return { success: true, data: null };

      const { data, error } = await (supabase
        .from('equipment'))
        .select('*')
        .eq('id', id!)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          category: data.category,
          description: data.description || '',
          price_per_day: Number(data.price_per_day),
          stock_quantity: data.quantity || 0,
          available_quantity: data.available_quantity || 0,
          image_url: (Array.isArray(data.images) && data.images.length > 0) ? data.images[0] : '',
          is_published: data.status === 'Available',
          pricing_type: data.pricing_type || 'PerDay',
        });
      }

      return { success: true, data };
    },
    { enabled: !!(isEditing && user && (isAdmin || isStaff)) }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category) {
      toast.warning('必須項目を入力してください');
      return;
    }

    if (formData.available_quantity > formData.stock_quantity) {
      toast.error('在庫可能数は総在庫数を超えることはできません');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        const { error } = await (supabase

          .from('equipment'))

          .update({
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price_per_day: formData.price_per_day,
            quantity: formData.stock_quantity,
            available_quantity: formData.available_quantity,
            images: formData.image_url ? [formData.image_url] : [],
            status: formData.is_published ? 'Available' : 'Unavailable',
            pricing_type: formData.pricing_type,
          })
          .eq('id', id!);

        if (error) throw error;

        toast.success('ギヤを更新しました');
      } else {
        const { error } = await (supabase

          .from('equipment'))

          .insert({
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price_per_day: formData.price_per_day,
            quantity: formData.stock_quantity,
            available_quantity: formData.available_quantity,
            images: formData.image_url ? [formData.image_url] : [],
            status: formData.is_published ? 'Available' : 'Unavailable',
            pricing_type: formData.pricing_type,
          });

        if (error) throw error;

        toast.success('ギヤを登録しました');
      }

      navigate('/admin/equipment');
    } catch (error) {
      logger.error('Error saving equipment:', error);
      toast.error('ギヤの保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/equipment')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ギヤ管理に戻る
          </button>

          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
            <Package className="h-10 w-10 mr-3 text-blue-600" />
            {isEditing ? 'ギヤ編集' : 'ギヤ登録'}
          </h1>
          <p className="text-gray-600">
            {isEditing ? 'ギヤ情報を編集できます' : '新しいギヤを登録できます'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ギヤ名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: コールマン タフワイドドームIV"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="ギヤの詳細説明を入力してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                料金計算方法 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing_type"
                    value="PerDay"
                    checked={formData.pricing_type === 'PerDay'}
                    onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as 'PerDay' | 'PerUnit' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">日数ごと（例：テント、寝袋など）</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="pricing_type"
                    value="PerUnit"
                    checked={formData.pricing_type === 'PerUnit'}
                    onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as 'PerDay' | 'PerUnit' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">個数ごと（例：ペグ、ロープなど）</span>
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {formData.pricing_type === 'PerDay'
                  ? '料金 = 単価 × 個数 × 日数で計算されます'
                  : '料金 = 単価 × 個数で計算されます（日数は考慮されません）'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.pricing_type === 'PerDay' ? '1日あたりのレンタル料金（円）' : '1個あたりのレンタル料金（円）'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price_per_day}
                  onChange={(e) =>
                    setFormData({ ...formData, price_per_day: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  総在庫数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, stock_quantity: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在庫可能数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.available_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, available_quantity: Number(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max={formData.stock_quantity}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                現在レンタル可能な数量を入力してください
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ギヤ画像
              </label>
              <ImageUpload
                value={formData.image_url}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                bucket="images"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) =>
                  setFormData({ ...formData, is_published: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                公開する
              </label>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/admin/equipment')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              <Save className="h-5 w-5 mr-2" />
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
