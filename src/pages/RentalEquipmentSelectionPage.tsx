import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Package, Plus, Minus, ArrowRight, ArrowLeft, Calendar } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useQuery } from '../lib/data-access';

type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  pricing_type?: string | null;
};

interface SelectedEquipment {
  equipment: Equipment;
  quantity: number;
}

const CATEGORY_NAMES: Record<string, string> = {
  Tent: 'テント',
  SleepingBag: '寝袋',
  Cooking: '調理器具',
  Outdoor: 'アウトドア用品',
  Electronics: '電子機器',
  Safety: '安全装備',
  Other: 'その他',
};

export default function RentalEquipmentSelectionPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Map<string, SelectedEquipment>>(
    new Map()
  );

  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const days = parseInt(searchParams.get('days') || '0');
  const vehicleId = searchParams.get('vehicleId') || '';
  const vehiclePrice = parseFloat(searchParams.get('vehiclePrice') || '0');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/rental');
      return;
    }
    if (!startDate || !endDate || !days || !vehicleId) {
      navigate('/rental');
    }
  }, [user, authLoading, startDate, endDate, days, vehicleId]);

  // 装備データを取得
  const { loading } = useQuery<Equipment[]>(
    async () => {
      const { data, error } = await (supabase
        .from('equipment'))
        .select('*')
        .eq('status', 'Available')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setEquipment(data || []);
      return { success: true, data: data || [] };
    },
    { enabled: !!(user && startDate && endDate && days && vehicleId) }
  );

  const handleQuantityChange = (eq: Equipment, delta: number) => {
    const current = selectedEquipment.get(eq.id);
    const currentQty = current?.quantity || 0;
    const newQty = Math.max(0, Math.min(eq.available_quantity, currentQty + delta));

    if (newQty === 0) {
      const newMap = new Map(selectedEquipment);
      newMap.delete(eq.id);
      setSelectedEquipment(newMap);
    } else {
      const newMap = new Map(selectedEquipment);
      newMap.set(eq.id, { equipment: eq, quantity: newQty });
      setSelectedEquipment(newMap);
    }
  };

  const calculateEquipmentTotal = () => {
    let total = 0;
    selectedEquipment.forEach(({ equipment, quantity }) => {
      const pricingType = equipment.pricing_type || 'PerDay';
      if (pricingType === 'PerUnit') {
        total += equipment.price_per_day * quantity;
      } else {
        total += equipment.price_per_day * quantity * days;
      }
    });
    return total;
  };

  const handleContinue = () => {
    const equipmentData = Array.from(selectedEquipment.values()).map(({ equipment, quantity }) => ({
      id: equipment.id,
      quantity,
      price: equipment.price_per_day,
      pricing_type: equipment.pricing_type || 'PerDay',
    }));

    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      days: days.toString(),
      vehicleId,
      vehiclePrice: vehiclePrice.toString(),
      equipment: JSON.stringify(equipmentData),
    });

    navigate(`/rental/activities?${params.toString()}`);
  };

  const vehicleTotal = vehiclePrice * days;
  const equipmentTotal = calculateEquipmentTotal();
  const currentTotal = vehicleTotal + equipmentTotal;

  const groupedEquipment = equipment.reduce((acc, eq) => {
    const category = eq.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(eq);
    return acc;
  }, {} as Record<string, Equipment[]>);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            to={`/rental/vehicles?start=${startDate}&end=${endDate}&days=${days}`}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            車両選択に戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">ギア・装備の選択</h1>
            <p className="text-gray-600 mb-8">必要な装備を追加してください（任意）</p>

            {equipment.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">現在、利用可能な装備はありません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEquipment).map(([category, items]) => (
                  <div key={category} className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      {CATEGORY_NAMES[category] || category}
                    </h2>
                    <div className="space-y-4">
                      {items.map((eq) => {
                        const selected = selectedEquipment.get(eq.id);
                        const selectedQty = selected?.quantity || 0;
                        const images = eq.images as string[] || [];

                        return (
                          <div
                            key={eq.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-300 transition"
                          >
                            <div className="flex items-center flex-1">
                              {images.length > 0 ? (
                                <div
                                  className="w-20 h-20 bg-cover bg-center rounded-lg flex-shrink-0"
                                  style={{ backgroundImage: `url(${images[0]})` }}
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="h-10 w-10 text-white" />
                                </div>
                              )}
                              <div className="ml-4 flex-1">
                                <h3 className="font-semibold text-gray-800">{eq.name}</h3>
                                {eq.description && (
                                  <p className="text-sm text-gray-600 mt-1">{eq.description}</p>
                                )}
                                <div className="flex items-center mt-2 space-x-4">
                                  <p className="text-sm font-semibold text-blue-600">
                                    ¥{eq.price_per_day.toLocaleString()}
                                    {(eq.pricing_type || 'PerDay') === 'PerUnit' ? '/個' : '/日'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    在庫: {eq.available_quantity}個
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 ml-4">
                              <button
                                onClick={() => handleQuantityChange(eq, -1)}
                                disabled={selectedQty === 0}
                                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Minus className="h-4 w-4 text-gray-600" />
                              </button>
                              <span className="w-8 text-center font-semibold text-gray-800">
                                {selectedQty}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(eq, 1)}
                                disabled={selectedQty >= eq.available_quantity}
                                className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Plus className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">予約内容</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {new Date(startDate).toLocaleDateString('ja-JP')} 〜{' '}
                      {new Date(endDate).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{days}日間</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">車両レンタル</span>
                    <span className="font-semibold text-gray-800">
                      ¥{vehicleTotal.toLocaleString()}
                    </span>
                  </div>

                  {selectedEquipment.size > 0 && (
                    <>
                      {Array.from(selectedEquipment.values()).map(({ equipment, quantity }) => {
                        const pricingType = equipment.pricing_type || 'PerDay';
                        const itemTotal = pricingType === 'PerUnit'
                          ? equipment.price_per_day * quantity
                          : equipment.price_per_day * quantity * days;
                        return (
                          <div key={equipment.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {equipment.name} x{quantity}
                            </span>
                            <span className="font-semibold text-gray-800">
                              ¥{itemTotal.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-800">小計</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ¥{currentTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full mt-6 flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  次へ（アクティビティ選択）
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  ギアの選択はスキップできます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
