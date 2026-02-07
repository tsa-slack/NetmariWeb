import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { loadStripe, Stripe, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement } from '@stripe/stripe-js';
import {
  Calendar,
  Car,
  Package,
  Ticket,
  CheckCircle,
  ArrowLeft,
  Loader,
  CreditCard,
  Lock,
  Mail,
  X,
  Award} from 'lucide-react';
import type { Database } from '../lib/database.types';

type RentalVehicle = Database['public']['Tables']['rental_vehicles']['Row'] & {
  vehicle?: Database['public']['Tables']['vehicles']['Row'];
};
type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  pricing_type?: string | null;
};
type Activity = Database['public']['Tables']['activities']['Row'];

export default function RentalConfirmationPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [rentalVehicle, setRentalVehicle] = useState<RentalVehicle | null>(null);
  const [equipment, setEquipment] = useState<
    Array<Equipment & { quantity: number; price: number }>
  >([]);
  const [activities, setActivities] = useState<
    Array<Activity & { date: string; participants: number; price: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'OnSite'>('CreditCard');
  const [cardName, setCardName] = useState('');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [cardNumberElement, setCardNumberElement] = useState<StripeCardNumberElement | null>(null);
  const [cardExpiryElement, setCardExpiryElement] = useState<StripeCardExpiryElement | null>(null);
  const [cardCvcElement, setCardCvcElement] = useState<StripeCardCvcElement | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reservationId, setReservationId] = useState<string>('');
  const [userRank, setUserRank] = useState<string>('Bronze');
  const [discountRate, setDiscountRate] = useState<number>(0);

  const startDate = searchParams.get('start') || '';
  const endDate = searchParams.get('end') || '';
  const days = parseInt(searchParams.get('days') || '0');
  const vehicleId = searchParams.get('vehicleId') || '';
  const vehiclePrice = parseFloat(searchParams.get('vehiclePrice') || '0');
  const equipmentParam = searchParams.get('equipment') || '[]';
  const activitiesParam = searchParams.get('activities') || '[]';

  const equipmentData = JSON.parse(equipmentParam);
  const activitiesData = JSON.parse(activitiesParam);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/rental');
      return;
    }
    if (!startDate || !endDate || !days || !vehicleId) {
      navigate('/rental');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading, startDate, endDate, days, vehicleId]);

  useEffect(() => {
    const initializeStripe = async () => {
      if (stripe && cardNumberElement) {
        return;
      }

      setStripeLoading(true);
      setStripeError('');

      try {
        const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (!stripePublicKey) {
          setStripeError('決済システムが設定されていません');
          setStripeLoading(false);
          return;
        }

        const stripeInstance = await loadStripe(stripePublicKey);
        if (!stripeInstance) {
          setStripeError('決済システムの読み込みに失敗しました');
          setStripeLoading(false);
          return;
        }

        setStripe(stripeInstance);

        const elements = stripeInstance.elements();

        const elementStyle = {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            '::placeholder': {
              color: '#9ca3af',
            },
          },
          invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
          },
        };

        const cardNumber = elements.create('cardNumber', { style: elementStyle });
        const cardExpiry = elements.create('cardExpiry', { style: elementStyle });
        const cardCvc = elements.create('cardCvc', { style: elementStyle });

        const cardNumberContainer = document.getElementById('card-number-element');
        const cardExpiryContainer = document.getElementById('card-expiry-element');
        const cardCvcContainer = document.getElementById('card-cvc-element');

        if (cardNumberContainer && cardExpiryContainer && cardCvcContainer) {
          cardNumber.mount('#card-number-element');
          cardExpiry.mount('#card-expiry-element');
          cardCvc.mount('#card-cvc-element');

          setCardNumberElement(cardNumber);
          setCardExpiryElement(cardExpiry);
          setCardCvcElement(cardCvc);
        } else {
          setStripeError('カード入力フィールドの初期化に失敗しました');
        }

        setStripeLoading(false);
      } catch (err) {
        console.error('Stripe initialization error:', err);
        setStripeError('決済システムの初期化に失敗しました');
        setStripeLoading(false);
      }
    };

    if (showPaymentForm && paymentMethod === 'CreditCard' && !cardNumberElement) {
      initializeStripe();
    }

    return () => {
      if (cardNumberElement) {
        cardNumberElement.unmount();
        setCardNumberElement(null);
      }
      if (cardExpiryElement) {
        cardExpiryElement.unmount();
        setCardExpiryElement(null);
      }
      if (cardCvcElement) {
        cardCvcElement.unmount();
        setCardCvcElement(null);
      }
    };
  }, [showPaymentForm, paymentMethod]);

  const loadData = async () => {
    try {
      const { data: vehicleData, error: vehicleError } = await (supabase

        .from('rental_vehicles') as any)

        .select('*, vehicle:vehicles(*)')
        .eq('id', vehicleId!)
        .maybeSingle();

      if (vehicleError) throw vehicleError;
      setRentalVehicle(vehicleData);

      if (equipmentData.length > 0) {
        const equipmentIds = equipmentData.map((eq: any) => eq.id);
        const { data: equipmentList, error: equipmentError } = await (supabase

          .from('equipment') as any)

          .select('*')
          .in('id', equipmentIds);

        if (equipmentError) throw equipmentError;

        const enrichedEquipment = equipmentList.map((eq: any) => {
          const eqData = equipmentData.find((e: any) => e.id === eq.id);
          return {
            ...eq,
            quantity: eqData.quantity,
            price: eqData.price,
            pricing_type: eqData.pricing_type || eq.pricing_type || 'PerDay',
          };
        });

        setEquipment(enrichedEquipment);
      }

      if (activitiesData.length > 0) {
        const activityIds = activitiesData.map((act: any) => act.id);
        const { data: activityList, error: activityError } = await (supabase

          .from('activities') as any)

          .select('*')
          .in('id', activityIds);

        if (activityError) throw activityError;

        const enrichedActivities = activityList
          .map((act: any) => {
            const actData = activitiesData.find((a: any) => a.id === act.id);
            return {
              ...act,
              date: actData.date,
              participants: actData.participants,
              price: actData.price,
            };
          })
          .sort((a: any, b: any) => a.date.localeCompare(b.date));

        setActivities(enrichedActivities);
      }

      // ユーザーのランクと割引率を取得
      if (user) {
        const { data: userData, error: userError } = await (supabase

          .from('users') as any)

          .select('rank')
          .eq('id', user.id)
          .maybeSingle();

        if (!userError && userData) {
          setUserRank(userData.rank || 'Bronze');

          // ランク設定から割引率を取得
          const { data: settings } = await (supabase

            .from('system_settings') as any)

            .select('rank_settings')
            .limit(1)
            .maybeSingle();

          if (settings && settings.rank_settings) {
            const rankConfig = settings.rank_settings.ranks[userData.rank || 'Bronze'];
            if (rankConfig) {
              setDiscountRate(rankConfig.discount_rate || 0);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

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

  const validatePaymentForm = () => {
    if (paymentMethod === 'CreditCard') {
      if (stripeError) {
        setError('決済システムの初期化に失敗しました。ページを再読み込みしてください。');
        return false;
      }
      if (stripeLoading) {
        setError('決済システムの初期化中です。しばらくお待ちください。');
        return false;
      }
      if (!stripe || !cardNumberElement || !cardExpiryElement || !cardCvcElement) {
        setError('決済システムが初期化されていません。ページを再読み込みしてください。');
        return false;
      }
      if (!cardName.trim()) {
        setError('カード名義を入力してください');
        return false;
      }
    }
    return true;
  };

  const processPayment = async () => {
    const totals = calculateTotals();

    if (paymentMethod === 'CreditCard') {
      if (!stripe || !cardNumberElement) {
        throw new Error('Stripe has not been initialized');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const paymentIntentResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: totals.total,
          currency: 'jpy',
          receipt_email: user?.email,
          metadata: {
            user_id: user?.id,
            vehicle_id: vehicleId,
            start_date: startDate,
            end_date: endDate,
          },
        }),
      });

      if (!paymentIntentResponse.ok) {
        const errorData = await paymentIntentResponse.json();
        throw new Error(errorData.error || 'Payment intent creation failed');
      }

      const { clientSecret, paymentIntentId } = await paymentIntentResponse.json();

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: cardName || 'Guest',
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment was not successful');
      }

      return {
        success: true,
        transactionId: paymentIntentId,
        method: paymentMethod,
      };
    }

    return {
      success: true,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      method: paymentMethod,
    };
  };

  const handleConfirm = async () => {
    if (!user || !rentalVehicle) return;

    if (!validatePaymentForm()) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const paymentResult = await processPayment();

      if (!paymentResult.success) {
        throw new Error('決済処理に失敗しました');
      }

      const totals = calculateTotals();

      const { data: reservation, error: reservationError } = await (supabase


        .from('reservations') as any)


        .insert({
          user_id: user.id,
          rental_vehicle_id: vehicleId,
          start_date: startDate,
          end_date: endDate,
          days,
          status: paymentMethod === 'OnSite' ? 'Pending' : 'Confirmed',
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'OnSite' ? 'Pending' : 'Completed',
          options: {
            transaction_id: paymentResult.transactionId,
            payment_date: new Date().toISOString(),
            discount: totals.discount,
            discount_rate: discountRate,
            user_rank: userRank,
          },
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      if (equipment.length > 0) {
        const equipmentInserts = equipment.map((eq: any) => {
          const pricingType = eq.pricing_type || 'PerDay';
          const subtotal = pricingType === 'PerUnit'
            ? eq.price * eq.quantity
            : eq.price * eq.quantity * days;
          return {
            reservation_id: reservation.id,
            equipment_id: eq.id,
            quantity: eq.quantity,
            days,
            price_per_day: eq.price,
            subtotal,
          };
        });

        const { error: equipmentError } = await (supabase


          .from('reservation_equipment') as any)


          .insert(equipmentInserts);

        if (equipmentError) throw equipmentError;
      }

      if (activities.length > 0) {
        const activityInserts = activities.map((act: any) => ({
          reservation_id: reservation.id,
          activity_id: act.id,
          date: act.date,
          participants: act.participants,
          price: act.price * act.participants,
        }));

        const { error: activityError } = await (supabase


          .from('reservation_activities') as any)


          .insert(activityInserts);

        if (activityError) throw activityError;
      }

      setReservationId(reservation.id);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      setError(error.message || '予約の作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
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
  const vehicle = rentalVehicle.vehicle;
  const images = vehicle?.images as string[] || [];

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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">予約内容の確認</h1>
          <p className="text-gray-600">内容をご確認の上、予約を確定してください</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">利用期間</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">利用開始日</p>
                <p className="font-semibold text-gray-800">
                  {new Date(startDate).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">返却日</p>
                <p className="font-semibold text-gray-800">
                  {new Date(endDate).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">利用日数</p>
                <p className="font-semibold text-gray-800">{days}日間</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <Car className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-800">レンタル車両</h2>
            </div>
            <div className="flex items-center">
              {images.length > 0 ? (
                <div
                  className="w-32 h-32 bg-cover bg-center rounded-lg flex-shrink-0"
                  style={{ backgroundImage: `url(${images[0]})` }}
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Car className="h-16 w-16 text-white" />
                </div>
              )}
              <div className="ml-6 flex-1">
                <h3 className="text-xl font-semibold text-gray-800">{vehicle?.name}</h3>
                {vehicle?.manufacturer && (
                  <p className="text-gray-600">{vehicle.manufacturer}</p>
                )}
                {rentalVehicle.location && (
                  <p className="text-sm text-gray-600 mt-2">場所: {rentalVehicle.location}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">¥{vehiclePrice.toLocaleString()} x {days}日</p>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{totals.vehicleTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {equipment.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Package className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">ギア・装備</h2>
              </div>
              <div className="space-y-3">
                {equipment.map((eq: any) => {
                  const pricingType = eq.pricing_type || 'PerDay';
                  const itemTotal = pricingType === 'PerUnit'
                    ? eq.price * eq.quantity
                    : eq.price * eq.quantity * days;
                  const priceLabel = pricingType === 'PerUnit' ? '/個' : '/日';

                  return (
                    <div key={eq.id} className="flex items-center justify-between py-3 border-b">
                      <div>
                        <h3 className="font-semibold text-gray-800">{eq.name}</h3>
                        <p className="text-sm text-gray-600">
                          ¥{eq.price.toLocaleString()}{priceLabel} x {eq.quantity}個
                          {pricingType === 'PerDay' && ` x ${days}日`}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">
                        ¥{itemTotal.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activities.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <Ticket className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">アクティビティ</h2>
              </div>
              <div className="space-y-3">
                {activities.map((act, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b">
                    <div>
                      <h3 className="font-semibold text-gray-800">{act.name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(act.date).toLocaleDateString('ja-JP')} - {act.participants}名
                      </p>
                    </div>
                    <p className="font-bold text-gray-800">
                      ¥{(act.price * act.participants).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">料金詳細</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>小計</span>
                <span className="font-semibold">¥{totals.subtotal.toLocaleString()}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    {userRank}会員割引（{discountRate}%）
                  </span>
                  <span className="font-semibold">-¥{totals.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>消費税（10%）</span>
                <span className="font-semibold">¥{totals.tax.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-xl font-bold text-gray-800">合計金額</span>
                <span className="text-3xl font-bold text-blue-600">
                  ¥{totals.total.toLocaleString()}
                </span>
              </div>
              {discountRate > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
                  <Award className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">
                    {userRank}会員として、レンタル料金から{discountRate}%の割引が適用されています。
                  </p>
                </div>
              )}
            </div>
          </div>

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
            <>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <Lock className="h-6 w-6 text-green-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-800">お支払い情報</h2>
                  <span className="ml-auto text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    安全な接続
                  </span>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    お支払い方法
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CreditCard')}
                      className={`p-4 border-2 rounded-lg transition ${
                        paymentMethod === 'CreditCard'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CreditCard className={`h-6 w-6 mx-auto mb-2 ${
                        paymentMethod === 'CreditCard' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <p className={`font-semibold ${
                        paymentMethod === 'CreditCard' ? 'text-blue-600' : 'text-gray-800'
                      }`}>
                        クレジットカード
                      </p>
                      <p className="text-xs text-gray-600 mt-1">即時決済</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('OnSite')}
                      className={`p-4 border-2 rounded-lg transition ${
                        paymentMethod === 'OnSite'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${
                        paymentMethod === 'OnSite' ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <p className={`font-semibold ${
                        paymentMethod === 'OnSite' ? 'text-blue-600' : 'text-gray-800'
                      }`}>
                        現地払い
                      </p>
                      <p className="text-xs text-gray-600 mt-1">受取時に支払い</p>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'CreditCard' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        カード名義
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="TARO YAMADA"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      />
                    </div>

                    {stripeLoading ? (
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center min-h-[48px]">
                        <Loader className="animate-spin h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-500">読み込み中...</span>
                      </div>
                    ) : stripeError ? (
                      <div className="w-full px-4 py-3 border border-red-300 rounded-lg bg-red-50 min-h-[48px] flex items-center">
                        <span className="text-red-600 text-sm">{stripeError}</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            カード番号
                          </label>
                          <div
                            id="card-number-element"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              有効期限
                            </label>
                            <div
                              id="card-expiry-element"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              CVC
                            </label>
                            <div
                              id="card-cvc-element"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent bg-white"
                            />
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          テストカード: 4242 4242 4242 4242 | 有効期限: 任意の将来日 | CVC: 任意の3桁
                        </p>
                      </>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-800">
                        <Lock className="inline h-4 w-4 mr-1" />
                        カード情報は暗号化されて安全に処理されます
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === 'OnSite' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">現地払いについて</h3>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                      <li>車両受取時に現金またはクレジットカードでお支払いください</li>
                      <li>予約確定後、キャンセルポリシーが適用されます</li>
                      <li>身分証明書と運転免許証をご持参ください</li>
                    </ul>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">お支払い金額</span>
                    <span className="text-2xl font-bold text-gray-900">
                      ¥{calculateTotals().total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowPaymentForm(false);
                      setError('');
                      setStripeError('');
                      if (cardNumberElement) {
                        cardNumberElement.unmount();
                        setCardNumberElement(null);
                      }
                      if (cardExpiryElement) {
                        cardExpiryElement.unmount();
                        setCardExpiryElement(null);
                      }
                      if (cardCvcElement) {
                        cardCvcElement.unmount();
                        setCardCvcElement(null);
                      }
                      setStripe(null);
                    }}
                    disabled={submitting}
                    className="flex-1 px-8 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
                  >
                    戻る
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={
                      submitting ||
                      (paymentMethod === 'CreditCard' && (stripeLoading || !!stripeError || !cardNumberElement))
                    }
                    className="flex-1 flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        {paymentMethod === 'CreditCard' ? '決済処理中...' : '処理中...'}
                      </>
                    ) : stripeLoading && paymentMethod === 'CreditCard' ? (
                      <>
                        <Loader className="animate-spin h-5 w-5 mr-2" />
                        初期化中...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        予約を確定
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                予約後は、マイページから予約内容を確認できます
              </p>
            </>
          )}
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => navigate('/my-page?tab=reservations&success=true')}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                予約が確定しました！
              </h2>
              <p className="text-gray-600">
                ご予約ありがとうございます
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">予約番号</p>
              <p className="text-xl font-bold text-gray-800 font-mono">
                {reservationId.substring(0, 8).toUpperCase()}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {paymentMethod === 'CreditCard' && user?.email && (
                <div className="flex items-start space-x-3 text-sm">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 font-medium mb-1">領収書をメールで送信</p>
                    <p className="text-gray-600">
                      {user.email} 宛に領収書が送信されます
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 text-sm">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-800 font-medium mb-1">マイページで確認</p>
                  <p className="text-gray-600">
                    予約内容の詳細はマイページからいつでも確認できます
                  </p>
                </div>
              </div>

              {paymentMethod === 'OnSite' && (
                <div className="flex items-start space-x-3 text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <Ticket className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium mb-1">現地払い</p>
                    <p className="text-yellow-700">
                      車両受取時にお支払いください
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/my-page?tab=reservations&success=true')}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
            >
              マイページで確認する
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
