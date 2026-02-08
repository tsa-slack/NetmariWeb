import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  Tag,
  Plus,
  Filter,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import type { Database } from '../lib/database.types';
import { useQuery, useRepository, CategoryRepository } from '../lib/data-access';
import { toast } from 'sonner';
import CategoryForm, { type CategoryFormData } from '../components/category/CategoryForm';
import CategoryTable from '../components/category/CategoryTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { handleError } from '../lib/handleError';

type Category = Database['public']['Tables']['categories']['Row'];

export default function CategoryManagementPage() {
  const { user, loading, isAdmin } = useAuth();
  const categoryRepo = useRepository(CategoryRepository);
  const [filter, setFilter] = useState<'all' | 'vehicle' | 'equipment' | 'partner' | 'contact'>('all');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
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

  // カテゴリー一覧を取得
  const { data: categories, loading: loadingCategories, refetch } = useQuery<Category[]>(
    async () => {
      if (filter !== 'all') {
        return categoryRepo.findByType(filter);
      }
      return categoryRepo.findAll({
        orderBy: { column: 'type', ascending: true },
      });
    },
    { enabled: !!(user && isAdmin) }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.key || !formData.label_ja) {
      toast.warning('必須項目を入力してください');
      return;
    }

    setShowSubmitModal(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitModal(false);
    try {
      if (editingCategory) {
        const result = await categoryRepo.update(editingCategory.id, formData);
        if (!result.success) throw result.error;
        toast.success('カテゴリーを更新しました');
      } else {
        const result = await categoryRepo.create(formData);
        if (!result.success) throw result.error;
        toast.success('カテゴリーを登録しました');
      }

      resetForm();
      refetch();
    } catch (error) {
      handleError(error, 'カテゴリーの保存に失敗しました');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      type: category.type as CategoryFormData['type'],
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
      toast.warning('システムカテゴリーは削除できません');
      return;
    }

    try {
      const result = await categoryRepo.delete(selectedCategory.id);
      if (!result.success) throw result.error;
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      refetch();
    } catch (error) {
      handleError(error, 'カテゴリーの削除に失敗しました');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
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
          <CategoryForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingCategory}
          />
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
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

        <CategoryTable
          categories={categories || []}
          loading={loadingCategories}
          onEdit={handleEdit}
          onDelete={(category) => {
            setSelectedCategory(category);
            setDeleteModalOpen(true);
          }}
          onAddNew={() => setShowForm(true)}
        />

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
        <ConfirmModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={confirmSubmit}
          title={editingCategory ? 'カテゴリーを更新しますか？' : 'カテゴリーを登録しますか？'}
          message="この内容で保存します。よろしいですか？"
          confirmText="保存する"
          cancelText="キャンセル"
          type="info"
        />
      </div>
    </AdminLayout>
  );
}
