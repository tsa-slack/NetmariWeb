import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import { EquipmentRepository, useRepository, useQuery } from '../lib/data-access';
import { Package, Plus, Edit, Trash2, Filter, Search, DollarSign, Eye, EyeOff } from 'lucide-react';
import { handleError } from '../lib/handleError';
import LoadingSpinner from '../components/LoadingSpinner';

interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  price_per_day: number;
  stock_quantity: number;
  available_quantity: number;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export default function EquipmentManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const equipmentRepo = useRepository(EquipmentRepository);
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // ギヤ一覧を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: equipment, loading: loadingEquipment, refetch } = useQuery<any[]>(
    async () => {
      return equipmentRepo.findAllFiltered(
        filter === 'all' ? undefined : filter,
        categoryFilter === 'all' ? undefined : categoryFilter
      );
    },
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const togglePublish = async (equipmentId: string, currentStatus: boolean) => {
    try {
      const result = await equipmentRepo.update(equipmentId, { status: currentStatus ? 'inactive' : 'active' });
      if (!result.success) throw result.error;
      refetch();
    } catch (error) {
      handleError(error, '公開状態の変更に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!selectedEquipment) return;

    try {
      const result = await equipmentRepo.delete(selectedEquipment.id);
      if (!result.success) throw result.error;
      setDeleteModalOpen(false);
      setSelectedEquipment(null);
      refetch();
    } catch (error) {
      handleError(error, 'ギヤの削除に失敗しました');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredEquipment = (equipment || []).filter((item: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categories = Array.from(new Set((equipment || []).map((item: any) => item.category)));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">読み込み中...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ギヤ管理</h1>
              <p className="text-gray-600 mt-1">レンタルギヤの在庫と価格を管理</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/equipment/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-5 w-5 mr-2" />
            新規追加
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'published' | 'unpublished')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">すべて</option>
                <option value="published">公開中</option>
                <option value="unpublished">非公開</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">すべてのカテゴリ</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              合計: {filteredEquipment.length} 件
            </div>
          </div>

          {loadingEquipment ? (
            <div className="text-center py-12 text-gray-600">読み込み中...</div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              ギヤが見つかりませんでした
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ギヤ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      価格/日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      在庫
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
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {item.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ¥{item.price_per_day.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.available_quantity} / {item.stock_quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => togglePublish(item.id, item.is_published)}
                          className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${
                            item.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.is_published ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              公開中
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              非公開
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/equipment/${item.id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEquipment(item);
                              setDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedEquipment(null);
        }}
        onConfirm={handleDelete}
        title="ギヤを削除"
        message={`「${selectedEquipment?.name}」を削除してもよろしいですか？この操作は取り消せません。`}
        confirmText="削除"
        cancelText="キャンセル"
      />
    </AdminLayout>
  );
}
