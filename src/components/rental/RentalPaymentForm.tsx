import { useEffect, useState } from 'react';
import { loadStripe, Stripe, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement } from '@stripe/stripe-js';
import {
  CreditCard,
  CheckCircle,
  Lock,
  Loader,
} from 'lucide-react';
import { logger } from '../../lib/logger';

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  method: 'CreditCard' | 'OnSite';
}

interface RentalPaymentFormProps {
  total: number;
  userEmail?: string;
  userId?: string;
  vehicleId: string;
  startDate: string;
  endDate: string;
  onConfirm: (result: PaymentResult) => void;
  onBack: () => void;
  submitting: boolean;
  error: string;
  paymentMethodSetting?: 'both' | 'card_only' | 'cash_only';
}

export default function RentalPaymentForm({
  total,
  userEmail,
  userId,
  vehicleId,
  startDate,
  endDate,
  onConfirm,
  onBack,
  submitting,
  error,
  paymentMethodSetting = 'both',
}: RentalPaymentFormProps) {
  const showCard = paymentMethodSetting === 'both' || paymentMethodSetting === 'card_only';
  const showCash = paymentMethodSetting === 'both' || paymentMethodSetting === 'cash_only';
  const defaultMethod = showCard ? 'CreditCard' : 'OnSite';
  const [paymentMethod, setPaymentMethod] = useState<'CreditCard' | 'OnSite'>(defaultMethod);
  const [cardName, setCardName] = useState('');
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [cardNumberElement, setCardNumberElement] = useState<StripeCardNumberElement | null>(null);
  const [cardExpiryElement, setCardExpiryElement] = useState<StripeCardExpiryElement | null>(null);
  const [cardCvcElement, setCardCvcElement] = useState<StripeCardCvcElement | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [localError, setLocalError] = useState('');

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
        logger.error('Stripe initialization error:', err);
        setStripeError('決済システムの初期化に失敗しました');
        setStripeLoading(false);
      }
    };

    if (paymentMethod === 'CreditCard' && !cardNumberElement) {
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
  }, [paymentMethod]);

  const validatePaymentForm = () => {
    if (paymentMethod === 'CreditCard') {
      if (stripeError) {
        setLocalError('決済システムの初期化に失敗しました。ページを再読み込みしてください。');
        return false;
      }
      if (stripeLoading) {
        setLocalError('決済システムの初期化中です。しばらくお待ちください。');
        return false;
      }
      if (!stripe || !cardNumberElement || !cardExpiryElement || !cardCvcElement) {
        setLocalError('決済システムが初期化されていません。ページを再読み込みしてください。');
        return false;
      }
      if (!cardName.trim()) {
        setLocalError('カード名義を入力してください');
        return false;
      }
    }
    setLocalError('');
    return true;
  };

  const processPayment = async () => {
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
          amount: total,
          currency: 'jpy',
          receipt_email: userEmail,
          metadata: {
            user_id: userId,
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

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
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

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed');
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

  const handleConfirmClick = async () => {
    if (!validatePaymentForm()) return;

    try {
      const result = await processPayment();
      onConfirm(result);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      setLocalError(err.message || '決済処理に失敗しました');
    }
  };

  const handleBack = () => {
    setLocalError('');
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
    onBack();
  };

  const displayError = localError || error;

  return (
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
          <div className={`grid gap-4 ${showCard && showCash ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showCard && (
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
            )}
            {showCash && (
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
            )}
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

      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{displayError}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">お支払い金額</span>
            <span className="text-2xl font-bold text-gray-900">
              ¥{total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleBack}
            disabled={submitting}
            className="flex-1 px-8 py-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
          >
            戻る
          </button>
          <button
            onClick={handleConfirmClick}
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
  );
}
