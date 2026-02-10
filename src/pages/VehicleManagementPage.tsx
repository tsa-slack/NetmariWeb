import { useState } from 'react';
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
  MapPin,
  DollarSign,
  Eye,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useQuery } from '../lib/data-access';
import { handleError } from '../lib/handleError';
import LoadingSpinner from '../components/LoadingSpinner';

interface RentalVehicle {
  id: string;
  license_plate: string | null;
  location: string;
  price_per_day: number;
  status: string;
  created_at: string;
  vehicle: {
    id: string;
    name: string;
    type: string;
    manufacturer: string;
    year: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images: any;
  };
}

export default function VehicleManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [filter, setFilter] = useState<
    'all' | 'Available' | 'OnRent' | 'Maintenance'
  >('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);

  // レンタル車両一覧を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vehicles, loading: loadingVehicles, refetch } = useQuery<any[]>(
    async () => {
      let query = supabase
        .from('rental_vehicles')
        .select(`
          id,
          license_plate,
          location,
          price_per_day,
          status,
          created_at,
          vehicle:vehicles(
            id,
            name,
            type,
            manufacturer,
            year,
            images
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    },
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const updateStatus = async (vehicleId: string, newStatus: string) => {
    try {
      const { error } = await (supabase

        .from('rental_vehicles'))

        .update({ status: newStatus })
        .eq('id', vehicleId);

      if (error) throw error;
      refetch();
    } catch (error) {
      handleError(error, 'ステータスの変更に失敗しました');
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    try {
      const { error } = await supabase
        .from('rental_vehicles')
        .delete()
        .eq('id', selectedVehicle.id);

      if (error) throw error;
      setDeleteModalOpen(false);
      setSelectedVehicle(null);
      refetch();
    } catch (error) {
      handleError(error, '車両の削除に失敗しました');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredVehicles = (vehicles || []).filter((vehicle: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      vehicle.vehicle.manufacturer?.toLowerCase().includes(searchLower) ||
      vehicle.vehicle.name?.toLowerCase().includes(searchLower) ||
      vehicle.vehicle.type?.toLowerCase().includes(searchLower) ||
      vehicle.location?.toLowerCase().includes(searchLower) ||
      vehicle.license_plate?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'OnRent':
        return 'bg-blue-100 text-blue-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Available':
        return '利用可能';
      case 'OnRent':
        return 'レンタル中';
      case 'Maintenance':
        return 'メンテナンス中';
      case 'Returned':
        return '返却済み';
      default:
        return status;
    }
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center">
              <Car className="h-10 w-10 mr-3 text-purple-600" />
              レンタル車両管理
            </h1>
            <p className="text-gray-600">レンタル用車両とレンタル在庫の管理</p>
          </div>
          {isAdmin && (
            <Link
              to="/admin/vehicles/new"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              新規登録
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="inline h-4 w-4 mr-1" />
                ステータス
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">すべて</option>
                <option value="Available">利用可能</option>
                <option value="OnRent">レンタル中</option>
                <option value="Maintenance">メンテナンス中</option>
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
                placeholder="車両名、メーカー、場所で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingVehicles ? (
          <LoadingSpinner size="sm" fullPage={false} />
        ) : filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Car className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              車両がありません
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? '検索条件に一致する車両が見つかりません'
                : 'まだレンタル車両が登録されていません'}
            </p>
            {isAdmin && (
              <Link
                to="/admin/vehicles/new"
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初の車両を登録
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredVehicles.length}台の車両
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => {
                const vehicleImages = vehicle.vehicle.images || [];
                const firstImage = Array.isArray(vehicleImages) && vehicleImages.length > 0 ? vehicleImages[0] : null;

                return (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                  >
                    {firstImage && (
                      <img
                        src={firstImage}
                        alt={vehicle.vehicle.name}
                        className="w-full h-48 object-cover"
                      />
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              vehicle.status
                            )}`}
                          >
                            {getStatusLabel(vehicle.status)}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {vehicle.vehicle.name}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          {vehicle.vehicle.manufacturer} • {vehicle.vehicle.year}年 • {vehicle.vehicle.type}
                        </p>
                        {vehicle.location && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {vehicle.location}
                          </p>
                        )}
                        {vehicle.license_plate && (
                          <p className="text-sm text-gray-500 flex items-center">
                            🚗 {vehicle.license_plate}
                          </p>
                        )}
                        <p className="text-lg font-bold text-purple-600 flex items-center">
                          <DollarSign className="h-5 w-5 mr-1" />
                          ¥{vehicle.price_per_day.toLocaleString()}/日
                        </p>
                      </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/vehicles/${vehicle.vehicle.id}`}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        詳細
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to={`/admin/vehicles/${vehicle.id}/edit`}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setDeleteModalOpen(true);
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {vehicle.status === 'Maintenance' && (
                      <button
                        onClick={() => updateStatus(vehicle.id, 'Available')}
                        className="w-full mt-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                      >
                        利用可能にする
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedVehicle(null);
        }}
        onConfirm={handleDelete}
        title="車両を削除"
        message={`${selectedVehicle?.vehicle.name}を削除してもよろしいですか？この操作は取り消せません。`}
      />
    </AdminLayout>
  );
}
