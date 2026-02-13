import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  Star,
  Eye,
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import type { Database } from '../lib/database.types';
import {
  PartnerRepository,
  useQuery,
  useRepository,
} from '../lib/data-access';
import { handleError } from '../lib/handleError';
import LoadingSpinner from '../components/LoadingSpinner';

type Partner = Database['public']['Tables']['partners']['Row'];

const PARTNER_TYPES = [
  { value: 'all', label: 'すべて' },
  { value: 'RVPark', label: 'RVパーク' },
  { value: 'Restaurant', label: 'レストラン' },
  { value: 'GasStation', label: 'ガソリンスタンド' },
  { value: 'Tourist', label: '観光施設' },
  { value: 'Other', label: 'その他' },
];

export default function PartnerManagementPage() {
  const { user, loading, isAdmin, isStaff } = useAuth();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // リポジトリインスタンス
  const partnerRepo = useRepository(PartnerRepository);

  // 協力店一覧を取得
  const { data: partners, loading: loadingPartners, refetch } = useQuery<Partner[]>(
    async () => partnerRepo.findAll(),
    { enabled: !!(user && (isAdmin || isStaff)) }
  );

  const handleDelete = async () => {
    if (!selectedPartner) return;

    try {
      const result = await partnerRepo.delete(selectedPartner.id);
      if (!result.success) throw result.error;
      setDeleteModalOpen(false);
      setSelectedPartner(null);
      refetch();
    } catch (error) {
      handleError(error, '協力店の削除に失敗しました');
    }
  };

  const filteredPartners = (partners || []).filter((partner) => {
    if (filter !== 'all' && partner.type !== filter) return false;

    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      partner.name.toLowerCase().includes(searchLower) ||
      partner.description?.toLowerCase().includes(searchLower) ||
      partner.address?.toLowerCase().includes(searchLower)
    );
  });

  const getTypeLabel = (type: string) => {
    const partnerType = PARTNER_TYPES.find((t) => t.value === type);
    return partnerType ? partnerType.label : type;
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
              <MapPin className="h-10 w-10 mr-3 text-green-600" />
              協力店管理
            </h1>
            <p className="text-gray-600">協力店の登録・管理</p>
          </div>
          {isAdmin && (
            <Link
              to="/admin/partners/new"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
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
                タイプ
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PARTNER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
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
                placeholder="名前、説明、住所で検索..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {loadingPartners ? (
          <LoadingSpinner size="sm" fullPage={false} />
        ) : filteredPartners.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              協力店がありません
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filter !== 'all'
                ? '検索条件に一致する協力店が見つかりません'
                : 'まだ協力店が登録されていません'}
            </p>
            {isAdmin && (
              <Link
                to="/admin/partners/new"
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="h-5 w-5 mr-2" />
                最初の協力店を登録
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {filteredPartners.length}件の協力店
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {Array.isArray(partner.images) && partner.images.length > 0 ? (
                    <div
                      className="w-full h-56 bg-cover bg-center"
                      style={{ backgroundImage: `url(${partner.images[0]})` }}
                    />
                  ) : (
                    <div className="w-full h-56 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <MapPin className="h-16 w-16 text-white opacity-50" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {getTypeLabel(partner.type || "")}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {partner.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      {partner.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {partner.description}
                        </p>
                      )}
                      {partner.address && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {partner.address}
                        </p>
                      )}
                      {partner.rating !== null && (
                        <p className="text-sm font-semibold text-yellow-600 flex items-center">
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          {partner.rating.toFixed(1)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/partners/${partner.id}`}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center justify-center text-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        詳細
                      </Link>

                      {isAdmin && (
                        <>
                          <Link
                            to={`/admin/partners/${partner.id}/edit`}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => {
                              setSelectedPartner(partner);
                              setDeleteModalOpen(true);
                            }}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPartner(null);
        }}
        onConfirm={handleDelete}
        title="協力店を削除"
        message={`${selectedPartner?.name}を削除してもよろしいですか？この操作は取り消せません。`}
      />
    </AdminLayout>
  );
}
