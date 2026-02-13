import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { Car, ArrowRight, Users, Calendar, Tag } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { VehicleRepository, useQuery, useRepository } from '../lib/data-access';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];

export default function VehiclesPage() {
  // リポジトリインスタンスを作成
  const vehicleRepo = useRepository(VehicleRepository);

  // 販売用車両を取得
  const { data: vehicles, loading, error, refetch } = useQuery<Vehicle[]>(
    async () => vehicleRepo.findForSale(),
    { refetchOnMount: true }
  );

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorState
            message={error.message}
            onRetry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">販売車両</h1>
          <p className="text-lg md:text-xl text-gray-600">
            様々なタイプのキャンピングカーをご用意しています
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="読み込み中..." />
        ) : (vehicles?.length || 0) === 0 ? (
          <div className="bg-white rounded-xl shadow">
            <EmptyState
              icon={Car}
              title="現在、車両情報はありません"
              message="車両情報が登録されるまでお待ちください"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(vehicles || []).map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group"
              >
                {vehicle.images && Array.isArray(vehicle.images) && (vehicle.images as string[]).length > 0 ? (
                  <div className="h-80">
                    <img
                      src={(vehicle.images as string[])[0]}
                      alt={vehicle.name || '車両'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-80 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Car className="h-20 w-20 text-white" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center justify-between">
                    {vehicle.name}
                    <ArrowRight className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  {vehicle.manufacturer && (
                    <p className="text-sm text-gray-600 mb-1">{vehicle.manufacturer}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {vehicle.type && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Tag className="h-3 w-3 mr-1" />
                        {vehicle.type}
                      </span>
                    )}
                    {vehicle.year && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <Calendar className="h-3 w-3 mr-1" />
                        {vehicle.year}年式
                      </span>
                    )}
                    {(() => {
                      const specs = vehicle.specs as Record<string, unknown> | null;
                      const capacity = specs?.capacity;
                      return capacity ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Users className="h-3 w-3 mr-1" />
                          {String(capacity)}人乗り
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {vehicle.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{vehicle.description}</p>
                  )}
                  {vehicle.price && (
                    <div className="text-2xl font-bold text-blue-600">
                      ¥{vehicle.price.toLocaleString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
