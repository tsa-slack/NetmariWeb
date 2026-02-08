import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Ticket, Calendar, Users, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useQuery } from '../lib/data-access';
import { RentalFlowRepository } from '../lib/data-access/repositories';
import LoadingSpinner from '../components/LoadingSpinner';

type Activity = Database['public']['Tables']['activities']['Row'];

interface SelectedActivity {
  activity: Activity;
  date: string;
  participants: number;
}

const rentalFlowRepo = new RentalFlowRepository();

export default function RentalActivitySelectionPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);

  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const days = parseInt(searchParams.get('days') || '0');
  const vehicleId = searchParams.get('vehicleId') || '';
  const vehiclePrice = parseFloat(searchParams.get('vehiclePrice') || '0');
  const equipmentParam = searchParams.get('equipment') || '[]';

  const equipmentData = JSON.parse(equipmentParam);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/rental');
      return;
    }
    if (!startDate || !endDate || !days || !vehicleId) {
      navigate('/rental');
    }
  }, [user, authLoading, startDate, endDate, days, vehicleId]);

  // アクティビティデータを取得
  const { loading } = useQuery<Activity[]>(
    async () => {
      const result = await rentalFlowRepo.getAvailableActivities();
      if (!result.success) throw result.error;
      setActivities(result.data || []);
      return result;
    },
    { enabled: !!(user && startDate && endDate && days && vehicleId) }
  );

  const getDatesInRange = () => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
  };

  const handleAddActivity = (activity: Activity, date: string, participants: number) => {
    setSelectedActivities([
      ...selectedActivities,
      { activity, date, participants },
    ]);
  };

  const handleRemoveActivity = (index: number) => {
    setSelectedActivities(selectedActivities.filter((_, i) => i !== index));
  };

  const calculateActivityTotal = () => {
    return selectedActivities.reduce((total, { activity, participants }) => {
      const price = activity.price || 0;
      return total + price * participants;
    }, 0);
  };

  const handleContinue = () => {
    const activityData = selectedActivities.map(({ activity, date, participants }) => ({
      id: activity.id,
      date,
      participants,
      price: activity.price || 0,
    }));

    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      days: days.toString(),
      vehicleId,
      vehiclePrice: vehiclePrice.toString(),
      equipment: equipmentParam,
      activities: JSON.stringify(activityData),
    });

    navigate(`/rental/confirm?${params.toString()}`);
  };

  const vehicleTotal = vehiclePrice * days;
  const equipmentTotal = equipmentData.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, eq: any) => {
      const pricingType = eq.pricing_type || 'PerDay';
      const itemTotal = pricingType === 'PerUnit'
        ? eq.price * eq.quantity
        : eq.price * eq.quantity * days;
      return sum + itemTotal;
    },
    0
  );
  const activityTotal = calculateActivityTotal();
  const currentTotal = vehicleTotal + equipmentTotal + activityTotal;

  const availableDates = getDatesInRange();

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
          <Link
            to={`/rental/equipment?start=${startDate}&end=${endDate}&days=${days}&vehicleId=${vehicleId}&vehiclePrice=${vehiclePrice}`}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            ギア選択に戻る
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">アクティビティの選択</h1>
            <p className="text-gray-600 mb-8">体験したいアクティビティを追加してください（任意）</p>

            {selectedActivities.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">選択中のアクティビティ</h2>
                <div className="space-y-3">
                  {selectedActivities.map((selected, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded-lg p-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{selected.activity.name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(selected.date).toLocaleDateString('ja-JP')}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {selected.participants}名
                          </span>
                          <span className="font-semibold text-blue-600">
                            ¥
                            {(
                              (selected.activity.price || 0) * selected.participants
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveActivity(index)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow">
                <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">現在、利用可能なアクティビティはありません</p>
              </div>
            ) : (
              <div className="space-y-6">
                {activities.map((activity) => {
                  const images = activity.images as string[] || [];

                  return (
                    <div key={activity.id} className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-start space-x-6">
                        {images.length > 0 ? (
                          <div
                            className="w-40 h-40 bg-cover bg-center rounded-lg flex-shrink-0"
                            style={{ backgroundImage: `url(${images[0]})` }}
                          />
                        ) : (
                          <div className="w-40 h-40 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Ticket className="h-20 w-20 text-white" />
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            {activity.name}
                          </h3>
                          {activity.description && (
                            <p className="text-gray-600 mb-4">{activity.description}</p>
                          )}

                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            {activity.location && (
                              <div>
                                <span className="text-gray-600">場所: </span>
                                <span className="font-medium text-gray-800">
                                  {activity.location}
                                </span>
                              </div>
                            )}
                            {activity.duration && (
                              <div>
                                <span className="text-gray-600">所要時間: </span>
                                <span className="font-medium text-gray-800">
                                  {activity.duration}
                                </span>
                              </div>
                            )}
                            {activity.min_participants && (
                              <div>
                                <span className="text-gray-600">最少人数: </span>
                                <span className="font-medium text-gray-800">
                                  {activity.min_participants}名
                                </span>
                              </div>
                            )}
                            {activity.max_participants && (
                              <div>
                                <span className="text-gray-600">最大人数: </span>
                                <span className="font-medium text-gray-800">
                                  {activity.max_participants}名
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-2xl font-bold text-blue-600 mb-4">
                            ¥{(activity.price || 0).toLocaleString()}
                            {activity.price_type && (
                              <span className="text-sm text-gray-600 ml-2">
                                / {activity.price_type}
                              </span>
                            )}
                          </div>

                          <ActivitySelector
                            activity={activity}
                            availableDates={availableDates}
                            onAdd={handleAddActivity}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
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

                  {equipmentTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">装備レンタル</span>
                      <span className="font-semibold text-gray-800">
                        ¥{equipmentTotal.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {activityTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        アクティビティ ({selectedActivities.length}件)
                      </span>
                      <span className="font-semibold text-gray-800">
                        ¥{activityTotal.toLocaleString()}
                      </span>
                    </div>
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
                  次へ（予約確認）
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  アクティビティの選択はスキップできます
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

interface ActivitySelectorProps {
  activity: Activity;
  availableDates: string[];
  onAdd: (activity: Activity, date: string, participants: number) => void;
}

function ActivitySelector({ activity, availableDates, onAdd }: ActivitySelectorProps) {
  const [selectedDate, setSelectedDate] = useState(availableDates[0] || '');
  const [participants, setParticipants] = useState(1);

  const handleAdd = () => {
    if (selectedDate) {
      onAdd(activity, selectedDate, participants);
      setParticipants(1);
    }
  };

  const maxParticipants = activity.max_participants || 10;
  const minParticipants = activity.min_participants || 1;

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">利用日</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableDates.map((date) => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('ja-JP')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">参加人数</label>
          <input
            type="number"
            value={participants}
            onChange={(e) =>
              setParticipants(
                Math.max(minParticipants, Math.min(maxParticipants, parseInt(e.target.value) || 1))
              )
            }
            min={minParticipants}
            max={maxParticipants}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
      >
        <Plus className="h-5 w-5 mr-1" />
        追加
      </button>
    </div>
  );
}
