import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Filter,
  Save,
  X,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import type { Database } from '../lib/database.types';

type Category = Database['public']['Tables']['categories']['Row'];

interface CategoryFormData {
  type: 'vehicle' | 'equipment' | 'partner' | 'contact';
  key: string;
  label_ja: string;
  label_en: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export default function CategoryManagementPage() {
  const { user, loading, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [filter, setFilter] = useState<'all' | 'vehicle' | 'equipment' | 'partner' | 'contact'>('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState<CategoryFormData>({
    type: 'vehicle',
    key: '',
    label_ja: '',
    label_en: '',
    description: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (user && isAdmin) {
      loadCategories();
    }
  }, [user, isAdmin, filter]);

  const loadCategories = async () => {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .order('type', { ascending: true })
        .order('display_order', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.key || !formData.label_ja) {
      alert('必須項目を入力してください');
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await (supabase
          .from('categories') as any)
          .update(formData as any)
          .eq('id', editingCategory.id);

        if (error) throw error;
        alert('カテゴリーを更新しました');
      } else {
        const { error } = await (supabase
          .from('categories') as any)
          .insert(formData as any);

        if (error) throw error;
        alert('カテゴリーを登録しました');
      }

      resetForm();
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('カテゴリーの保存に失敗しました');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      type: category.type as any,
      key: category.key || '',
      label_ja: category.label_ja || '',
      label_en: category.label_en || '',
      description: category.description || '',
      display_order: category.display_order || 0,
      is_active: category.is_active ?? true,
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    if (selectedCategory.is_system) {
      alert('システムカテゴリーは削除できません');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('カテゴリーの削除に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'vehicle',
      key: '',
      label_ja: '',
      label_en: '',
      description: '',
      display_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'vehicle':
        return '車両';
      case 'equipment':
        return 'ギヤ';
      case 'partner':
        return '協力店';
      case 'contact':
        return 'お問い合わせ';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vehicle':
        return 'bg-blue-100 text-blue-800';
      case 'equipment':
        return 'bg-green-100 text-green-800';
      case 'partner':
        return 'bg-purple-100 text-purple-800';
      case 'contact':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <Tag className="h-10 w-10 mr-3 text-blue-600" />
              カテゴリー管理
            </h1>
            <p className="text-gray-600">各種エンティティのカテゴリーを管理</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            カテゴリーを追加
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCategory ? 'カテゴリー編集' : 'カテゴリー追加'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイプ<span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vehicle">車両</option>
                    <option value="equipment">ギヤ</option>
                    <option value="partner">協力店</option>
                    <option value="contact">お問い合わせ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    キー<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) =>
                      setFormData({ ...formData, key: e.target.value })
                    }
                    placeholder="例: cabcon"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ラベル（日本語）<span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.label_ja}
                    onChange={(e) =>
                      setFormData({ ...formData, label_ja: e.target.value })
                    }
                    placeholder="例: キャブコン"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ラベル（英語）
                  </label>
                  <input
                    type="text"
                    value={formData.label_en}
                    onChange={(e) =>
                      setFormData({ ...formData, label_en: e.target.value })
                    }
                    placeholder="例: Cab-over"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    表示順序
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        display_order: parseInt(e.target.value),
                      })
                    }
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    アクティブ
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    説明
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="カテゴリーの説明..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {editingCategory ? '更新' : '登録'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="vehicle">車両</option>
              <option value="equipment">ギヤ</option>
              <option value="partner">協力店</option>
              <option value="contact">お問い合わせ</option>
            </select>
          </div>
        </div>

        {loadingCategories ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              カテゴリーが見つかりません
            </h3>
            <p className="text-gray-600 mb-6">カテゴリーがありません</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              最初のカテゴリーを追加
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイプ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    キー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ラベル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    表示順
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(
                          category.type || ''
                        )}`}
                      >
                        {getTypeLabel(category.type || '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {category.label_ja}
                      </div>
                      {category.label_en && (
                        <div className="text-xs text-gray-500">
                          {category.label_en}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category.display_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_active ? 'アクティブ' : '無効'}
                      </span>
                      {category.is_system && (
                        <span className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                          システム
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {!category.is_system && (
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedCategory(null);
          }}
          onConfirm={handleDelete}
          title="カテゴリーを削除"
          message={`「${selectedCategory?.label_ja}」を削除してもよろしいですか？この操作は取り消せません。`}
          confirmText="削除"
          cancelText="キャンセル"
        />
      </div>
    </AdminLayout>
  );
}
