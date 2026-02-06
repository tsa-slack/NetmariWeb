# Stripe統合セットアップガイド

このドキュメントでは、NetomariアプリケーションにStripe決済を統合するための手順を説明します。

## 1. Stripeアカウントの準備

### 1.1 Stripeアカウントの作成
1. [Stripe Dashboard](https://dashboard.stripe.com/register)にアクセス
2. アカウントを作成（まだの場合）
3. テスト環境（Sandbox）でテストモードに切り替え

### 1.2 APIキーの取得
1. [Stripe Dashboard](https://dashboard.stripe.com/)にログイン
2. 右上の「テストモード」トグルがONになっていることを確認
3. 左サイドバーから「開発者」→「APIキー」をクリック
4. 以下の2つのキーをコピー：
   - **公開可能キー** (Publishable key): `pk_test_...`で始まる
   - **シークレットキー** (Secret key): `sk_test_...`で始まる

## 2. 環境変数の設定

プロジェクトの`.env`ファイルに以下の環境変数を追加してください：

```bash
# Stripe設定
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 重要な注意事項
- `VITE_STRIPE_PUBLIC_KEY`：フロントエンドで使用（公開可能キー）
- `STRIPE_SECRET_KEY`：バックエンド（Edge Functions）でのみ使用（絶対に公開しないこと）

## 3. 必要なSupabase Edge Functionsの作成

Stripe決済を処理するために、以下のEdge Functionsを作成する必要があります：

### 3.1 決済処理用Edge Function
決済処理を行うためのEdge Functionを作成します。

**推奨ファイル構成：**
```
supabase/
  functions/
    create-payment-intent/
      index.ts
    confirm-payment/
      index.ts
    webhook-handler/
      index.ts (Webhookイベントを受信)
```

## 4. テスト用カード情報

Stripeテストモードでは、以下のテストカード番号を使用できます：

### 成功するテストカード
| カード番号 | 説明 |
|-----------|------|
| `4242 4242 4242 4242` | Visa（最も一般的） |
| `5555 5555 5555 4444` | Mastercard |
| `3782 822463 10005` | American Express |

### その他のテスト情報
- **有効期限**: 任意の将来の日付（例: 12/34）
- **CVC**: 任意の3桁の番号（例: 123）、AMEXの場合は4桁
- **郵便番号**: 任意の番号（例: 12345）

### 失敗をテストするカード
| カード番号 | エラー |
|-----------|--------|
| `4000 0000 0000 0002` | カードが拒否される |
| `4000 0000 0000 9995` | 残高不足 |
| `4000 0000 0000 0069` | 有効期限切れ |

## 5. データベーステーブルの確認

決済機能に必要なテーブルが既に作成されていることを確認してください：

### rentals テーブル
```sql
- id (uuid)
- user_id (uuid)
- vehicle_id (uuid)
- start_date (date)
- end_date (date)
- total_price (numeric)
- payment_status (text)
- payment_method (text)
- stripe_payment_intent_id (text) -- Stripe決済ID
- status (text)
- created_at (timestamptz)
```

### rental_equipment テーブル
```sql
- id (uuid)
- rental_id (uuid)
- equipment_id (uuid)
- quantity (integer)
- price (numeric)
```

### rental_activities テーブル
```sql
- id (uuid)
- rental_id (uuid)
- activity_id (uuid)
- activity_date (date)
- participants (integer)
- price (numeric)
```

## 6. Webhook設定（本番環境用）

本番環境では、Stripeからのイベント通知を受け取るためにWebhookを設定する必要があります。

### 6.1 Webhookエンドポイントの作成
1. Stripe Dashboardで「開発者」→「Webhook」をクリック
2. 「エンドポイントを追加」をクリック
3. エンドポイントURL: `https://your-project.supabase.co/functions/v1/webhook-handler`
4. 監視するイベント：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

### 6.2 Webhook署名シークレット
Webhookエンドポイント作成後、署名シークレット（`whsec_...`で始まる）を取得し、環境変数に追加：
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 7. フロントエンド実装の確認ポイント

### 7.1 Stripe.jsライブラリのインストール
```bash
npm install @stripe/stripe-js
```

### 7.2 決済フローの実装
1. **決済インテント作成**: Edge Functionを呼び出してPaymentIntentを作成
2. **カード情報の収集**: Stripe Elementsまたはカードフォームを使用
3. **決済の確認**: PaymentIntentを確定
4. **結果の処理**: 成功/失敗に応じた処理

## 8. セキュリティチェックリスト

- [ ] シークレットキーをフロントエンドで使用していない
- [ ] 決済処理はすべてバックエンド（Edge Functions）で実行
- [ ] カード情報を直接データベースに保存していない
- [ ] HTTPS通信を使用している
- [ ] Webhook署名を検証している
- [ ] 金額の検証をサーバー側で実施

## 9. テストシナリオ

決済機能を実装したら、以下のシナリオでテストしてください：

1. **正常な決済フロー**
   - テストカード（4242...）で決済成功を確認
   - データベースに予約レコードが作成されることを確認
   - payment_statusが'Paid'になることを確認

2. **決済失敗のハンドリング**
   - 拒否されるカード（4000 0000 0000 0002）で決済失敗を確認
   - 適切なエラーメッセージが表示されることを確認
   - データベースに不完全なレコードが残らないことを確認

3. **3Dセキュア認証**
   - カード番号: `4000 0025 0000 3155`
   - 認証フローが正しく動作することを確認

## 10. トラブルシューティング

### エラー: "Invalid API Key"
- APIキーが正しくコピーされているか確認
- テストモードのキーを使用しているか確認
- 環境変数が正しく設定されているか確認

### エラー: "Payment Intent creation failed"
- 金額が正の整数（最小単位）で指定されているか確認
- 通貨コード（JPY）が正しいか確認

### Webhookイベントが届かない
- WebhookエンドポイントURLが正しいか確認
- Edge Functionが正しくデプロイされているか確認
- Stripe Dashboardの「イベント」タブで配信状況を確認

## 11. 本番環境への移行

テスト環境で十分にテストした後、本番環境に移行する手順：

1. Stripe Dashboardで「本番モード」に切り替え
2. 本番環境のAPIキーを取得
3. `.env.production`ファイルに本番環境のキーを設定
4. Webhookエンドポイントを本番環境用に設定
5. 実際のクレジットカードで小額テストを実施

## 参考リンク

- [Stripe公式ドキュメント](https://stripe.com/docs)
- [Stripe APIリファレンス](https://stripe.com/docs/api)
- [Stripe テストカード](https://stripe.com/docs/testing)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**注意**: このドキュメントはテスト環境（Sandbox）用です。本番環境に移行する際は、セキュリティとコンプライアンスの要件を十分に確認してください。
