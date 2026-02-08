# API定義書

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│  React SPA (Vite + TypeScript)                       │
│  Pages → Hooks (useQuery/useRepository) → Supabase   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│  Supabase Platform                                   │
│  ┌─────────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │ PostgreSQL  │ │ Auth     │ │ Edge Functions  │  │
│  │ + RLS       │ │          │ │                 │  │
│  └─────────────┘ └──────────┘ └────────┬────────┘  │
│  ┌─────────────┐ ┌──────────┐          │           │
│  │ Storage     │ │ REST API │          │           │
│  │             │ │(PostgREST)│          │           │
│  └─────────────┘ └──────────┘          │           │
└────────────────────────────────────────┼───────────┘
                                         │
┌────────────────────────────────────────▼───────────┐
│  Stripe (決済)                                      │
└────────────────────────────────────────────────────┘
```

---

## 1. 認証 (Supabase Auth)

### フロー

```
ユーザー登録 → Supabase Auth → handle_new_user() トリガー
  → public.users レコード自動作成 (role: Members, rank: Bronze)
  → JWT トークン発行 → クライアントに保存
```

### エンドポイント

| 操作 | メソッド | 説明 |
|------|---------|------|
| 会員登録 | `supabase.auth.signUp()` | email + password + metadata |
| ログイン | `supabase.auth.signInWithPassword()` | JWT 取得 |
| ログアウト | `supabase.auth.signOut()` | |
| パスワードリセット | `supabase.auth.resetPasswordForEmail()` | |
| パスワード変更 | `supabase.auth.updateUser()` | |
| ユーザー取得 | `supabase.auth.getUser()` | JWT から |

### 登録時 metadata

```typescript
supabase.auth.signUp({
  email, password,
  options: {
    data: {
      first_name, last_name,
      phone_number, postal_code,
      prefecture, city, address_line, building,
    }
  }
});
```

---

## 2. リポジトリ API（データアクセスレイヤー）

全リポジトリは `BaseRepository<T>` を継承し、以下の共通CRUDメソッドを持つ：

| メソッド | 説明 |
|---------|------|
| `findById(id)` | ID指定で1件取得 |
| `findAll()` | 全件取得 |
| `create(data)` | 新規作成 |
| `update(id, data)` | 更新 |
| `delete(id)` | 削除 |

### VehicleRepository

| メソッド | 説明 |
|---------|------|
| `findForSale()` | 販売用車両取得（purpose: sale / both） |
| `findForRental()` | レンタル用車両取得（purpose: rental / both） |
| `findByPurpose(purpose)` | 目的別車両取得 |
| `findByManufacturer(manufacturer)` | メーカー別車両検索 |
| `findAllFiltered(purposeFilter?)` | 管理用：フィルタ付き車両一覧 |
| `count()` | 車両総数 |

### RentalFlowRepository

| メソッド | 説明 |
|---------|------|
| `getAvailableVehicles(startDate?, endDate?)` | 利用可能車両取得（日付範囲で重複除外、車両JOIN付き） |
| `getAvailableEquipment()` | 利用可能装備取得 |
| `getAvailableActivities()` | 利用可能アクティビティ取得 |
| `getConfirmationData(vehicleId, equipmentIds, activityIds, userId)` | 確認ページ一括データ取得（ランク・割引含む） |
| `checkOverlap(vehicleId, startDate, endDate)` | 予約重複チェック |
| `createReservation(params)` | 予約作成（reservations + equipment + activities トランザクション） |

### ReservationRepository

| メソッド | 説明 |
|---------|------|
| `findByUser(userId)` | ユーザーの予約一覧 |
| `findByStatus(status)` | ステータス別予約 |
| `findByUserAndStatus(userId, status)` | ユーザー×ステータスで取得 |
| `findAllWithDetails()` | 管理用：関連情報JOIN付き全予約取得 |
| `getDashboardCounts()` | ダッシュボード用集計 |
| `count()` | 予約総数 |

### StoryRepository

| メソッド | 説明 |
|---------|------|
| `findPublishedWithAuthor()` | 公開済み体験記（著者情報JOIN） |
| `findByAuthor(authorId)` | 著者別体験記 |
| `findAllForManagement()` | 管理用：全体験記（著者情報付き） |
| `incrementViews(id)` | 閲覧数+1 |
| `findPublishedByLocation()` | 位置情報付き公開体験記 |

### ReviewRepository

| メソッド | 説明 |
|---------|------|
| `findByTargetWithAuthor(targetType, targetId)` | 対象別レビュー（著者JOIN） |
| `findByAuthorWithTarget(authorId)` | ユーザーの全レビュー |
| `findAllForManagement()` | 管理用：全レビュー |
| `findByReservation(reservationId)` | 予約別レビュー |
| `count()` | レビュー総数 |

### QuestionRepository

| メソッド | 説明 |
|---------|------|
| `findAllWithDetails()` | 全質問（著者・回答数JOIN） |
| `findByIdWithAnswers(id)` | 質問詳細（回答・著者JOIN） |
| `findByAuthor(authorId)` | 著者別質問 |
| `findAllForManagement()` | 管理用：全質問 |
| `incrementViews(id)` | 閲覧数+1 |
| `count()` | 質問総数 |

### その他リポジトリ

| リポジトリ | 主要メソッド |
|-----------|-------------|
| `AnnouncementRepository` | `findPublishedWithAuthor()`, `findAllSorted()` |
| `EventRepository` | `findUpcoming()`, `findByIdWithParticipants()`, `findAllForManagement()` |
| `EquipmentRepository` | `findAvailable()`, `findByCategory()` |
| `PartnerRepository` | `findAllWithCategory()` |
| `ContactRepository` | `findAllSorted()` |
| `UserRepository` | `findByEmail()`, `findAllSorted()` |
| `RentalChecklistRepository` | `findByReservation()`, `getPreparations()`, `saveChecklist()` |
| `SystemSettingsRepository` | `getAll()`, `getByKey()`, `getRankSettings()`, `getHeroSettings()`, `getFaqSettings()` |
| `ActivityRepository` | `findAvailable()` |
| `AnswerRepository` | `findByQuestion()` |
| `CategoryRepository` | `findByType()` |
| `EventParticipantRepository` | 参加登録・取り消し |
| `RouteRepository` | ルートCRUD |
| `StoryQuestionRepository` | 体験記質問CRUD |

---

## 3. RPC 関数

```typescript
// 閲覧数インクリメント
await supabase.rpc('increment_story_views', { story_id: id });
await supabase.rpc('increment_question_views', { question_id: id });

// アカウント操作
await supabase.rpc('suspend_account', { reason: '...' });
await supabase.rpc('reactivate_account');

// ランク情報
await supabase.rpc('determine_user_rank', { user_uuid: userId });
await supabase.rpc('get_rank_discount_rate', { user_rank: 'Gold' });

// ランク計算（内部利用）
await supabase.rpc('calculate_total_spent', { user_uuid: userId });
await supabase.rpc('calculate_total_likes', { user_uuid: userId });
await supabase.rpc('calculate_total_posts', { user_uuid: userId });
await supabase.rpc('update_user_rank', { user_uuid: userId });
```

---

## 4. Edge Functions

### create-payment-intent（Stripe 決済）

```
POST {SUPABASE_URL}/functions/v1/create-payment-intent
```

**リクエスト:**
```json
{
  "amount": 25000,
  "rentalId": "uuid",
  "userId": "uuid",
  "description": "キャンパー デラックス 3日間"
}
```

**レスポンス:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

**環境変数:** `STRIPE_SECRET_KEY` (Supabase Secrets), `VITE_STRIPE_PUBLIC_KEY` (.env)

### Stripe テストカード

| カード番号 | 結果 |
|-----------|------|
| `4242 4242 4242 4242` | 成功（Visa） |
| `5555 5555 5555 4444` | 成功（Mastercard） |
| `4000 0000 0000 0002` | 拒否 |
| `4000 0000 0000 9995` | 残高不足 |

---

## 5. 権限マトリクス

| 機能 | Admin | Staff | Partners | Members | Anonymous |
|------|:-----:|:-----:|:--------:|:-------:|:---------:|
| 車両閲覧 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 車両管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 予約作成 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 予約管理（全） | ✅ | ✅ | ❌ | ❌ | ❌ |
| 予約管理（自分） | ✅ | ✅ | ❌ | ✅ | ❌ |
| 体験記投稿 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 体験記閲覧 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Q&A投稿 | ✅ | ✅ | ✅ | ✅ | ❌ |
| レビュー投稿 | ✅ | ✅ | ✅ | ✅ | ❌ |
| レビュー管理（全） | ✅ | ✅ | ❌ | ❌ | ❌ |
| 協力店管理（全） | ✅ | ❌ | ❌ | ❌ | ❌ |
| 協力店管理（自店） | ✅ | ❌ | ✅ | ❌ | ❌ |
| お問い合わせ送信 | ✅ | ✅ | ✅ | ✅ | ✅ |
| お問い合わせ管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| ニュース管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| コンテンツ管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| カテゴリー管理 | ✅ | ❌ | ❌ | ❌ | ❌ |
| システム設定 | ✅ | ❌ | ❌ | ❌ | ❌ |

### ロールチェック関数

```sql
CREATE FUNCTION check_user_role(allowed_roles text[])
RETURNS boolean AS $$
  SELECT role = ANY(allowed_roles)
  FROM users WHERE id = auth.uid();
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. セキュリティ

| レイヤー | 実装 |
|---------|------|
| 通信暗号化 | HTTPS / TLS |
| 認証 | Supabase Auth (JWT) |
| 認可 | Row Level Security |
| DB制約 | NOT NULL, UNIQUE, FK, CHECK |
| XSS | React 自動エスケープ |
| SQL Injection | PostgREST パラメータ化クエリ |
| 機密情報 | 環境変数 + `.env` gitignore |

---

**最終更新**: 2026-02-08
