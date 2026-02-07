# API定義書

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│  React SPA (Vite + TypeScript)                       │
│  Pages → Hooks (useQuery/useMutation) → Supabase     │
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
  → public.users レコード自動作成 (role: Members)
  → JWT トークン発行 → クライアントに保存
```

### エンドポイント

| 操作 | メソッド | 説明 |
|------|---------|------|
| 会員登録 | `supabase.auth.signUp()` | email + password + metadata |
| ログイン | `supabase.auth.signInWithPassword()` | JWT 取得 |
| ログアウト | `supabase.auth.signOut()` | |
| パスワードリセット | `supabase.auth.resetPasswordForEmail()` | |
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

## 2. REST API (PostgREST)

ベース URL: `{SUPABASE_URL}/rest/v1/{table}`

全リクエストに `Authorization: Bearer {JWT}` ヘッダーが必要。RLS がアクセス制御を担当。

### 車両

| 操作 | Supabase Client | RLS 条件 |
|------|-----------------|----------|
| 一覧取得 | `.from('vehicles').select('*')` | 全員 |
| 詳細取得 | `.from('vehicles').select('*, rental_vehicles(*)').eq('id', id)` | 全員 |
| 作成 | `.from('vehicles').insert(data)` | Admin / Staff |
| 更新 | `.from('vehicles').update(data).eq('id', id)` | Admin / Staff |
| 削除 | `.from('vehicles').delete().eq('id', id)` | Admin / Staff |

### 予約

| 操作 | Supabase Client | RLS 条件 |
|------|-----------------|----------|
| 自分の予約 | `.from('reservations').select('*, rental_vehicles(*, vehicles(*)), reservation_equipment(*, equipment(*)), reservation_activities(*, activities(*))')` | `user_id = auth.uid()` |
| 予約作成 | `.from('reservations').insert(data)` | authenticated |
| 更新 | `.from('reservations').update(data).eq('id', id)` | 自分 / Admin / Staff |
| 全予約 | 同上 | Admin / Staff |

### 体験記 (stories)

| 操作 | Supabase Client | RLS 条件 |
|------|-----------------|----------|
| 公開一覧 | `.from('stories').select('*, users(*)').eq('status', 'Published')` | 全員 |
| 作成 | `.from('stories').insert(data)` | `author_id = auth.uid()` |
| 更新 | `.from('stories').update(data).eq('id', id)` | 著者のみ |
| 削除 | `.from('stories').delete().eq('id', id)` | 著者のみ |

### Q&A

| 操作 | Supabase Client | RLS 条件 |
|------|-----------------|----------|
| 質問一覧 | `.from('questions').select('*, users(*)')` | 全員 |
| 質問作成 | `.from('questions').insert(data)` | `author_id = auth.uid()` |
| 質問更新/削除 | `.update()` / `.delete()` | 著者のみ |
| 回答作成 | `.from('answers').insert(data)` | `author_id = auth.uid()` |
| 回答更新/削除 | `.update()` / `.delete()` | 著者のみ |

### レビュー

| 操作 | Supabase Client | RLS 条件 |
|------|-----------------|----------|
| 閲覧 | `.from('reviews').select('*')` | 全員 |
| 作成 | `.from('reviews').insert(data)` | `author_id = auth.uid()` |
| 更新/削除 | `.update()` / `.delete()` | 著者 / Staff |

### 協力店

| 操作 | RLS 条件 |
|------|----------|
| 閲覧 | 全員 |
| 管理 | Admin |

### イベント

| 操作 | RLS 条件 |
|------|----------|
| 閲覧 | 全員 |
| 作成/更新/削除 | 主催者 / Admin |
| 参加登録 | authenticated |

### お問い合わせ (contacts)

| 操作 | RLS 条件 |
|------|----------|
| 送信 | 全員（auth + anon） |
| 管理 | Admin / Staff |

### システム設定

| 操作 | RLS 条件 |
|------|----------|
| 取得 | 全員 |
| 更新 | Admin のみ |

---

## 3. RPC 関数

PostgREST の RPC エンドポイント経由で呼び出す関数:

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

**環境変数（Supabase Dashboard → Edge Functions → Secrets）:**
- `STRIPE_SECRET_KEY` — `sk_test_...`

**フロントエンド:**
- `VITE_STRIPE_PUBLIC_KEY` — `pk_test_...`（`.env` に設定）

### Stripe テストカード

| カード番号 | 結果 |
|-----------|------|
| `4242 4242 4242 4242` | 成功（Visa） |
| `5555 5555 5555 4444` | 成功（Mastercard） |
| `4000 0000 0000 0002` | 拒否 |
| `4000 0000 0000 9995` | 残高不足 |

有効期限: 任意の未来 / CVC: 任意の3桁

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
| システム設定 | ✅ | ❌ | ❌ | ❌ | ❌ |

### ロールチェック関数

```sql
-- RLSポリシー内で使用
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

**最終更新**: 2026-02-07
