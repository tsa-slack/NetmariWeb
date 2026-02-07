import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { supabase } from '../lib/supabase';
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  DollarSign,
  Eye,
  Tag,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import type { Database } from '../lib/database.types';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function SaleVehicleManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sale' | 'rental' | 'both'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (user && (isAdmin || isStaff)) {
      loadVehicles();
    }
  }, [user, isAdmin, isStaff, filter]);

  const loadVehicles = async () => {
    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('purpose', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', selectedVehicle.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setSelectedVehicle(null);
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('車両の削除に失敗しました');
    }
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.name?.toLowerCase().includes(searchLower) ||
      vehicle.manufacturer?.toLowerCase().includes(searchLower) ||
      vehicle.type?.toLowerCase().includes(searchLower)
    );
  });

  const getPurposeColor = (purpose: string | null) => {
    switch (purpose) {
      case 'sale':
        return 'bg-blue-100 text-blue-800';
      case 'rental':
        return 'bg-green-100 text-green-800';
      case 'both':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPurposeLabel = (purpose: string | null) => {
    switch (purpose) {
      case 'sale':
        return '販売';
      case 'rental':
        return 'レンタル';
      case 'both':
        return '販売・レンタル';
      default:
        return '未設定';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Sold':
        return 'bg-red-100 text-red-800';
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'Available':
        return '利用可能';
      case 'Sold':
        return '売却済み';
      case 'Reserved':
        return '予約済み';
      default:
        return status || '不明';
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

  if (!user || (!isAdmin && !isStaff)) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <Car className="h-10 w-10 mr-3 text-blue-600" />
              販売車両管理
            </h1>
            <p className="text-gray-600">販売用車両マスタの管理</p>
          </div>
          <Link
            to="/admin/sale-vehicles/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            車両を登録
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                用途
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="sale">販売のみ</option>
                <option value="rental">レンタルのみ</option>
                <option value="both">販売・レンタル両方</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline h-4 w-4 mr-1" />
                検索
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="車両名、メーカー、タイプで検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingVehicles ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              車両が見つかりません
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? '検索条件に一致する車両が見つかりません'
                : '車両がありません'}
            </p>
            <Link
              to="/admin/sale-vehicles/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-5 w-5 mr-2" />
              最初の車両を登録
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredVehicles.length}台の車両
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center relative">
                    {vehicle.images &&
                    Array.isArray(vehicle.images) &&
                    vehicle.images.length > 0 ? (
                      <img
                        src={(vehicle.images as string[])?.[0] || ""}
                        alt={vehicle.name || ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="h-20 w-20 text-white" />
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getPurposeColor(
                          (vehicle as any).purpose
                        )}`}
                      >
                        {getPurposeLabel((vehicle as any).purpose)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          vehicle.status
                        )}`}
                      >
                        {getStatusLabel(vehicle.status)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {vehicle.name}
                    </h3>
                    <div className="space-y-2 mb-4">
                      {vehicle.manufacturer && (
                        <p className="text-sm text-gray-600">
                          <Tag className="inline h-4 w-4 mr-1" />
                          {vehicle.manufacturer} / {vehicle.type}
                        </p>
                      )}
                      {vehicle.year && (
                        <p className="text-sm text-gray-600">年式: {vehicle.year}年</p>
                      )}
                      {vehicle.price && (
                        <p className="text-lg font-bold text-blue-600 flex items-center">
                          <DollarSign className="h-5 w-5 mr-1" />
                          ¥{Number(vehicle.price).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Link
                        to={`/vehicles/${vehicle.id}`}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        表示
                      </Link>
                      <Link
                        to={`/admin/sale-vehicles/edit/${vehicle.id}`}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center text-sm"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setDeleteModalOpen(true);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedVehicle(null);
          }}
          onConfirm={handleDelete}
          title="車両を削除"
          message={`「${selectedVehicle?.name}」を削除してもよろしいですか？この操作は取り消せません。`}
          confirmText="削除"
          cancelText="キャンセル"
        />
      </div>
    </AdminLayout>
  );
}
