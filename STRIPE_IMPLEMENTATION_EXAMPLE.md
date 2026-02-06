# Stripe実装サンプルコード

このドキュメントでは、Netomariアプリケーションに決済機能を実装するための具体的なコード例を提供します。

## 1. Edge Function: 決済インテント作成

### supabase/functions/create-payment-intent/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentIntentRequest {
  amount: number
  rentalId: string
  userId: string
  description?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, rentalId, userId, description }: PaymentIntentRequest = await req.json()

    // 金額の検証
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: '無効な金額です' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PaymentIntentを作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // 円単位なのでそのまま
      currency: 'jpy',
      metadata: {
        rental_id: rentalId,
        user_id: userId,
      },
      description: description || `レンタル予約 #${rentalId}`,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

## 2. Edge Function: Webhook処理

### supabase/functions/stripe-webhook/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret!)

    console.log(`Received event: ${event.type}`)

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const rentalId = paymentIntent.metadata.rental_id

        // データベースを更新
        const { error } = await supabase
          .from('rentals')
          .update({
            payment_status: 'Paid',
            stripe_payment_intent_id: paymentIntent.id,
            status: 'Confirmed',
          })
          .eq('id', rentalId)

        if (error) {
          console.error('Error updating rental:', error)
          throw error
        }

        console.log(`Payment succeeded for rental ${rentalId}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const rentalId = paymentIntent.metadata.rental_id

        const { error } = await supabase
          .from('rentals')
          .update({
            payment_status: 'Failed',
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq('id', rentalId)

        if (error) {
          console.error('Error updating rental:', error)
          throw error
        }

        console.log(`Payment failed for rental ${rentalId}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        const { error } = await supabase
          .from('rentals')
          .update({
            payment_status: 'Refunded',
            status: 'Cancelled',
          })
          .eq('stripe_payment_intent_id', paymentIntentId)

        if (error) {
          console.error('Error updating rental:', error)
          throw error
        }

        console.log(`Refund processed for payment intent ${paymentIntentId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## 3. フロントエンド: 決済フォーム

### src/components/PaymentForm.tsx

```typescript
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CreditCard, Lock } from 'lucide-react'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

interface PaymentFormProps {
  amount: number
  rentalId: string
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentForm({ amount, rentalId, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardName, setCardName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. PaymentIntentを作成
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount,
            rentalId,
            userId: 'user-id', // 実際のユーザーIDを使用
            description: `レンタル予約 #${rentalId}`,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('決済の準備に失敗しました')
      }

      const { clientSecret } = await response.json()

      // 2. Stripeで決済を確定
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripeの初期化に失敗しました')
      }

      // 注: 本番環境では、Stripe Elementsを使用することを強く推奨します
      // これは簡略化されたサンプルです
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            number: cardNumber,
            exp_month: parseInt(cardExpiry.split('/')[0]),
            exp_year: parseInt('20' + cardExpiry.split('/')[1]),
            cvc: cardCvc,
          },
          billing_details: {
            name: cardName,
          },
        },
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.message || '決済に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
        <Lock className="h-5 w-5 text-blue-600 mr-2" />
        <p className="text-sm text-blue-800">
          このページは暗号化されており、安全に決済できます
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カード名義人
        </label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="TARO YAMADA"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カード番号
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
          placeholder="4242 4242 4242 4242"
          maxLength={16}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            有効期限
          </label>
          <input
            type="text"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(e.target.value)}
            placeholder="MM/YY"
            maxLength={5}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            セキュリティコード
          </label>
          <input
            type="text"
            value={cardCvc}
            onChange={(e) => setCardCvc(e.target.value)}
            placeholder="123"
            maxLength={4}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-gray-800">合計金額</span>
          <span className="text-2xl font-bold text-blue-600">
            ¥{amount.toLocaleString()}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
        >
          {loading ? (
            <>処理中...</>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              ¥{amount.toLocaleString()}を支払う
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        テストモード: テストカード番号 4242 4242 4242 4242 を使用してください
      </p>
    </form>
  )
}
```

## 4. フロントエンド: 決済ページへの統合

### src/pages/RentalConfirmationPage.tsx（修正箇所）

```typescript
// 既存のimportに追加
import PaymentForm from '../components/PaymentForm'

// 決済成功時の処理
const handlePaymentSuccess = async () => {
  try {
    // データベースに予約を作成
    const { data: rental, error: rentalError } = await supabase
      .from('rentals')
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
        total_price: currentTotal,
        payment_status: 'Processing', // Webhookで更新される
        payment_method: 'CreditCard',
        status: 'Pending',
      })
      .select()
      .single()

    if (rentalError) throw rentalError

    // 装備とアクティビティも保存...

    navigate(`/rental/complete?id=${rental.id}`)
  } catch (error) {
    console.error('Error creating rental:', error)
    setError('予約の作成に失敗しました')
  }
}

// JSX内で使用
{showPaymentForm && (
  <PaymentForm
    amount={currentTotal}
    rentalId={rentalId}
    onSuccess={handlePaymentSuccess}
    onError={(error) => setError(error)}
  />
)}
```

## 5. Stripe Elementsを使用した推奨実装

より安全でPCI準拠の実装には、Stripe Elementsを使用してください：

```typescript
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

function CheckoutForm({ amount, rentalId, onSuccess, onError }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)

    try {
      // PaymentIntentを作成
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ amount, rentalId }),
        }
      )

      const { clientSecret } = await response.json()

      // 決済を確定
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      onSuccess()
    } catch (error: any) {
      onError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
          },
        }}
      />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? '処理中...' : '支払う'}
      </button>
    </form>
  )
}

export default function PaymentPage({ amount, rentalId, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        rentalId={rentalId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}
```

## 6. テスト方法

1. Edge Functionsをデプロイ
2. 環境変数を設定
3. フロントエンドでテストカード（4242 4242 4242 4242）を使用
4. Stripe Dashboardで決済を確認
5. データベースで予約ステータスを確認

---

**重要**: このコードはサンプルです。本番環境では以下を実装してください：

- Stripe Elementsの使用（PCI準拠）
- 適切なエラーハンドリング
- ログ記録とモニタリング
- 金額の二重チェック
- 不正検知の実装
