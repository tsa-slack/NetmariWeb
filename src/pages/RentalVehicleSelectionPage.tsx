import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Car, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useQuery } from '../lib/data-access';
import { RentalFlowRepository } from '../lib/data-access/repositories';
import LoadingSpinner from '../components/LoadingSpinner';

type RentalVehicle = Database['public']['Tables']['rental_vehicles']['Row'] & {
  vehicle?: Database['public']['Tables']['vehicles']['Row'] | null;
};

const rentalFlowRepo = new RentalFlowRepository();

export default function RentalVehicleSelectionPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [rentalVehicles, setRentalVehicles] = useState<RentalVehicle[]>([]);

  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const days = parseInt(searchParams.get('days') || '0');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/rental');
      return;
    }
    if (!startDate || !endDate || !days) {
      navigate('/rental');
    }
  }, [startDate, endDate, user, authLoading]);

  // レンタル車両データを取得
  const { loading } = useQuery<RentalVehicle[]>(
    async () => {
      const result = await rentalFlowRepo.getAvailableVehicles(startDate, endDate);
      if (!result.success) throw result.error;
      setRentalVehicles(result.data || []);
      return result;
    },
    { enabled: !!(user && startDate && endDate && days) }
  );

  const handleSelectVehicle = (rentalVehicleId: string, pricePerDay: number) => {
    if (!user) {
      navigate('/login?redirect=/rental/vehicles');
      return;
    }

    navigate(
      `/rental/equipment?start=${startDate}&end=${endDate}&days=${days}&vehicleId=${rentalVehicleId}&vehiclePrice=${pricePerDay}`
    );
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/rental" className="text-blue-600 hover:text-blue-700 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            日付選択に戻る
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">レンタル車両の選択</h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-gray-700">
                  利用開始日: {new Date(startDate).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-gray-700">
                  返却日: {new Date(endDate).toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div>
                <span className="font-semibold text-blue-800">{days}日間</span>
              </div>
            </div>
          </div>
        </div>

        {rentalVehicles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">現在、利用可能な車両がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rentalVehicles.map((rentalVehicle) => {
              const vehicle = rentalVehicle.vehicle;
              const totalPrice = rentalVehicle.price_per_day * days;
              const images = vehicle?.images as string[] || [];

              return (
                <div
                  key={rentalVehicle.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  {images.length > 0 ? (
                    <div
                      className="h-48 bg-cover bg-center"
                      style={{ backgroundImage: `url(${images[0]})` }}
                    />
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Car className="h-20 w-20 text-white" />
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {vehicle?.name || 'Unknown Vehicle'}
                    </h3>
                    {vehicle?.manufacturer && (
                      <p className="text-sm text-gray-600 mb-2">{vehicle.manufacturer}</p>
                    )}
                    {rentalVehicle.location && (
                      <p className="text-sm text-gray-600 mb-4">場所: {rentalVehicle.location}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">1日あたり</span>
                        <span className="font-semibold text-gray-800">
                          ¥{rentalVehicle.price_per_day.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{days}日間</span>
                        <span className="font-semibold text-gray-800">
                          x {days}
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between">
                        <span className="font-semibold text-gray-800">合計</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ¥{totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleSelectVehicle(rentalVehicle.id, rentalVehicle.price_per_day)
                      }
                      className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      この車両を選択
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
