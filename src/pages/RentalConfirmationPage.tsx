import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useQuery } from '../lib/data-access';
import { RentalFlowRepository } from '../lib/data-access/repositories';
import {
  Car,
  ArrowLeft,
  CreditCard,
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { logger } from '../lib/logger';
import RentalOrderSummary from '../components/rental/RentalOrderSummary';
import RentalPaymentForm, { type PaymentResult } from '../components/rental/RentalPaymentForm';
import ReservationSuccessModal from '../components/rental/ReservationSuccessModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSystemSettings } from '../hooks/useSystemSettings';

type RentalVehicle = Database['public']['Tables']['rental_vehicles']['Row'] & {
  vehicle?: Database['public']['Tables']['vehicles']['Row'] | null;
};
type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  pricing_type?: string | null;
};
type Activity = Database['public']['Tables']['activities']['Row'];

// URLクエリパラメータから解析されるJSON型
interface EquipmentParam {
  id: string;
  quantity: number;
  price: number;
  pricing_type?: string;
}

interface ActivityParam {
  id: string;
  date: string;
  participants: number;
  price: number;
}

const rentalFlowRepo = new RentalFlowRepository();

export default function RentalConfirmationPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { settings } = useSystemSettings();
  const [searchParams] = useSearchParams();
  const [rentalVehicle, setRentalVehicle] = useState<RentalVehicle | null>(null);
  const [equipment, setEquipment] = useState<
    Array<Equipment & { quantity: number; price: number }>
  >([]);
  const [activities, setActivities] = useState<
    Array<Activity & { date: string; participants: number; price: number }>
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reservationId, setReservationId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'OnSite'>('CreditCard');
  const [userRank, setUserRank] = useState<string>('Bronze');
  const [discountRate, setDiscountRate] = useState<number>(0);

  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const days = parseInt(searchParams.get('days') || '0');
  const vehicleId = searchParams.get('vehicleId') || '';
  const vehiclePrice = parseFloat(searchParams.get('vehiclePrice') || '0');
  const equipmentParam = searchParams.get('equipment') || '[]';
  const activitiesParam = searchParams.get('activities') || '[]';

  const equipmentData: EquipmentParam[] = JSON.parse(equipmentParam);
  const activitiesData: ActivityParam[] = JSON.parse(activitiesParam);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/rental');
      return;
    }
    if (!startDate || !endDate || !days || !vehicleId) {
      navigate('/rental');
    }
  }, [user, authLoading, startDate, endDate, days, vehicleId]);

  // 予約データを一括取得
  const { loading } = useQuery<RentalVehicle | null>(
    async () => {
      const equipmentIds = equipmentData.map((eq) => eq.id);
      const activityIds = activitiesData.map((act) => act.id);

      const result = await rentalFlowRepo.getConfirmationData(
        vehicleId,
        equipmentIds,
        activityIds,
        user!.id
      );

      if (!result.success) throw result.error;

      setRentalVehicle(result.data.vehicle);
      setUserRank(result.data.userRank);
      setDiscountRate(result.data.discountRate);

      if (result.data.equipment.length > 0) {
        const enrichedEquipment = result.data.equipment.map((eq) => {
          const eqData = equipmentData.find((e) => e.id === eq.id);
          return {
            ...eq,
            quantity: eqData?.quantity ?? 0,
            price: eqData?.price ?? 0,
            pricing_type: eqData?.pricing_type || eq.pricing_type || 'PerDay',
          };
        });
        setEquipment(enrichedEquipment);
      }

      if (result.data.activities.length > 0) {
        const enrichedActivities = result.data.activities
          .map((act) => {
            const actData = activitiesData.find((a) => a.id === act.id);
            return {
              ...act,
              date: actData?.date ?? '',
              participants: actData?.participants ?? 0,
              price: actData?.price ?? 0,
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date));
        setActivities(enrichedActivities);
      }

      return { success: true, data: result.data.vehicle };
    },
    { enabled: !!(user && startDate && endDate && days && vehicleId) }
  );

  const calculateTotals = () => {
    const vehicleTotal = vehiclePrice * days;
    const equipmentTotal = equipment.reduce(
      (sum, eq) => {
        const pricingType = eq.pricing_type || 'PerDay';
        const itemTotal = pricingType === 'PerUnit'
          ? eq.price * eq.quantity
          : eq.price * eq.quantity * days;
        return sum + itemTotal;
      },
      0
    );
    const activityTotal = activities.reduce(
      (sum, act) => sum + act.price * act.participants,
      0
    );
    const subtotal = vehicleTotal + equipmentTotal + activityTotal;

    // ランク割引を適用（レンタル料金のみ）
    const discount = discountRate > 0 ? Math.floor(vehicleTotal * (discountRate / 100)) : 0;
    const subtotalAfterDiscount = subtotal - discount;

    const tax = Math.floor(subtotalAfterDiscount * 0.1);
    const total = subtotalAfterDiscount + tax;

    return { vehicleTotal, equipmentTotal, activityTotal, subtotal, discount, subtotalAfterDiscount, tax, total };
  };

  const handlePaymentConfirm = async (paymentResult: PaymentResult) => {
    if (!user || !rentalVehicle) return;

    setSubmitting(true);
    setError('');

    try {
      // 既存予約との重複チェック
      const overlapResult = await rentalFlowRepo.checkOverlap(vehicleId, startDate, endDate);
      if (!overlapResult.success) throw overlapResult.error;

      if (overlapResult.data) {
        throw new Error('この車両は選択された期間に既に予約されています。別の日程をお選びください。');
      }

      if (!paymentResult.success) {
        throw new Error('決済処理に失敗しました');
      }

      const totals = calculateTotals();

      const equipmentInserts = equipment.map((eq) => {
        const pricingType = eq.pricing_type || 'PerDay';
        const subtotal = pricingType === 'PerUnit'
          ? eq.price * eq.quantity
          : eq.price * eq.quantity * days;
        return {
          equipmentId: eq.id,
          quantity: eq.quantity,
          days,
          pricePerDay: eq.price,
          subtotal,
        };
      });

      const activityInserts = activities.map((act) => ({
        activityId: act.id,
        date: act.date,
        participants: act.participants,
        price: act.price * act.participants,
      }));

      const reservationResult = await rentalFlowRepo.createReservation({
        userId: user.id,
        rentalVehicleId: vehicleId,
        startDate,
        endDate,
        days,
        status: paymentResult.method === 'OnSite' ? 'Pending' : 'Confirmed',
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: paymentResult.method,
        paymentStatus: paymentResult.method === 'OnSite' ? 'Pending' : 'Completed',
        options: {
          transaction_id: paymentResult.transactionId,
          payment_date: new Date().toISOString(),
          discount: totals.discount,
          discount_rate: discountRate,
          user_rank: userRank,
        },
        equipment: equipmentInserts,
        activities: activityInserts,
      });

      if (!reservationResult.success) throw reservationResult.error;

      setPaymentMethod(paymentResult.method);
      setReservationId(reservationResult.data.id);
      setShowSuccessModal(true);
    } catch (error: unknown) {
      logger.error('Error creating reservation:', error);
      setError(error instanceof Error ? error.message : '予約の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!rentalVehicle) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">車両情報が見つかりません</p>
            <Link
              to="/rental"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              最初から始める
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const totals = calculateTotals();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            to={`/rental/activities?start=${startDate}&end=${endDate}&days=${days}&vehicleId=${vehicleId}&vehiclePrice=${vehiclePrice}&equipment=${equipmentParam}`}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            アクティビティ選択に戻る
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">予約内容の確認</h1>
          <p className="text-gray-600">内容をご確認の上、予約を確定してください</p>
        </div>

        <div className="space-y-6">
          <RentalOrderSummary
            startDate={startDate}
            endDate={endDate}
            days={days}
            vehiclePrice={vehiclePrice}
            rentalVehicle={rentalVehicle}
            equipment={equipment}
            activities={activities}
            totals={totals}
            userRank={userRank}
            discountRate={discountRate}
          />

          {!showPaymentForm ? (
            <div className="flex space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-8 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                戻る
              </button>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="flex-1 flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                お支払いに進む
              </button>
            </div>
          ) : (
            <RentalPaymentForm
              total={totals.total}
              userEmail={user?.email}
              userId={user?.id}
              vehicleId={vehicleId}
              startDate={startDate}
              endDate={endDate}
              onConfirm={handlePaymentConfirm}
              onBack={() => {
                setShowPaymentForm(false);
                setError('');
              }}
              submitting={submitting}
              error={error}
              paymentMethodSetting={settings.payment_method}
            />
          )}
        </div>
      </div>

      <ReservationSuccessModal
        isOpen={showSuccessModal}
        reservationId={reservationId}
        paymentMethod={paymentMethod}
        userEmail={user?.email}
      />
    </Layout>
  );
}
