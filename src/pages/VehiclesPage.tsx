import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Car, ArrowRight } from 'lucide-react';
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold mb-2">エラーが発生しました</h2>
            <p className="text-red-700 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              再試行
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">車両情報</h1>
          <p className="text-xl text-gray-600">
            様々なタイプのキャンピングカーをご用意しています
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (vehicles?.length || 0) === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">現在、車両情報はありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(vehicles || []).map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group"
              >
                <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Car className="h-20 w-20 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center justify-between">
                    {vehicle.name}
                    <ArrowRight className="h-5 w-5 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
                  </h3>
                  {vehicle.manufacturer && (
                    <p className="text-sm text-gray-600 mb-2">{vehicle.manufacturer}</p>
                  )}
                  {vehicle.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{vehicle.description}</p>
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
