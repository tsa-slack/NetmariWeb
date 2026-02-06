# システムアーキテクチャ

このドキュメントは、Netomariプラットフォームの技術アーキテクチャについて説明します。

## 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [フロントエンド設計](#フロントエンド設計)
- [バックエンド設計](#バックエンド設計)
- [データフロー](#データフロー)
- [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [スケーラビリティ](#スケーラビリティ)

---

## アーキテクチャ概要

Netomariは、モダンなJamstackアーキテクチャを採用したフルスタックWebアプリケーションです。

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    React SPA                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │  Pages   │  │Components│  │  Context/Hooks   │   │  │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Platform                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ PostgreSQL   │  │ Auth Service │  │  Edge Functions  │  │
│  │  + RLS       │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Storage    │  │  Realtime    │  │   REST API       │  │
│  │              │  │              │  │   (PostgREST)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    外部サービス                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Stripe    │  │ Email Service│  │  Cloudflare CDN  │  │
│  │   (決済)     │  │  (通知)      │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 技術スタック概要

| レイヤー | 技術 | 役割 |
|---------|------|------|
| **プレゼンテーション** | React 18, TypeScript | ユーザーインターフェース |
| **スタイリング** | Tailwind CSS | デザインシステム |
| **状態管理** | React Context, Hooks | アプリケーション状態 |
| **ルーティング** | React Router v7 | SPAナビゲーション |
| **ビルド** | Vite | 開発環境・本番ビルド |
| **データベース** | PostgreSQL (Supabase) | データ永続化 |
| **認証** | Supabase Auth | ユーザー認証 |
| **API** | PostgREST (Supabase) | RESTful API |
| **ストレージ** | Supabase Storage | ファイルストレージ |
| **リアルタイム** | Supabase Realtime | WebSocket通信 |
| **サーバーレス** | Edge Functions | バックエンド処理 |

---

## フロントエンド設計

### コンポーネント階層

```
App
├── AuthContext (認証状態管理)
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── UserMenu
│   │   └── NotificationBell
│   └── Footer
│       ├── SiteMap
│       └── SocialLinks
│
├── Pages
│   ├── Public Pages
│   │   ├── HomePage
│   │   ├── VehiclesPage
│   │   │   └── VehicleCard
│   │   ├── PartnersPage
│   │   │   ├── PartnerCard
│   │   │   └── RouteMap (Leaflet)
│   │   └── StoriesPage
│   │       └── StoryCard
│   │
│   ├── Auth Pages
│   │   ├── LoginPage
│   │   ├── RegisterPage
│   │   └── ForgotPasswordPage
│   │
│   ├── User Pages
│   │   ├── MyPage
│   │   │   ├── ProfileSection
│   │   │   ├── ReservationsSection
│   │   │   └── FavoritesSection
│   │   └── RentalPage
│   │       ├── VehicleSelection
│   │       ├── EquipmentSelection
│   │       └── ActivitySelection
│   │
│   ├── Admin Pages
│   │   ├── AdminLayout
│   │   │   └── Sidebar
│   │   ├── UserManagement
│   │   ├── VehicleManagement
│   │   └── SystemSettings
│   │
│   └── Staff Pages
│       ├── StaffSidebar
│       ├── CheckoutPage
│       └── ReturnPage
│
└── Shared Components
    ├── ImageUpload
    ├── ConfirmModal
    ├── LoadingSpinner
    └── ErrorBoundary
```

### 状態管理戦略

#### 1. グローバル状態（React Context）

```typescript
// AuthContext.tsx
interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
}
```

**使用箇所:**
- ユーザー認証情報
- ユーザー権限
- ログイン状態

#### 2. ローカル状態（useState, useReducer）

**使用箇所:**
- フォーム入力値
- UI状態（モーダル表示/非表示）
- ページ固有の一時データ

#### 3. サーバー状態（Supabase）

**使用箇所:**
- データベースからのデータ取得
- リアルタイムデータ同期
- ファイルアップロード

### ルーティング設計

```typescript
// App.tsx
<Routes>
  {/* 公開ルート */}
  <Route path="/" element={<HomePage />} />
  <Route path="/vehicles" element={<VehiclesPage />} />
  <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
  <Route path="/partners" element={<PartnersPage />} />
  <Route path="/stories" element={<StoriesPage />} />

  {/* 認証必須ルート */}
  <Route path="/my" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
  <Route path="/rental" element={<ProtectedRoute><RentalPage /></ProtectedRoute>} />

  {/* 管理者専用ルート */}
  <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

  {/* スタッフ専用ルート */}
  <Route path="/staff/*" element={<StaffRoute><StaffPage /></StaffRoute>} />
</Routes>
```

### コンポーネント設計パターン

#### Container/Presentational パターン

```typescript
// Container Component
function VehicleListContainer() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  return <VehicleList vehicles={vehicles} loading={loading} />;
}

// Presentational Component
function VehicleList({ vehicles, loading }) {
  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {vehicles.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
```

#### Custom Hooks パターン

```typescript
// useSystemSettings.ts
function useSystemSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, updateSetting };
}
```

---

## バックエンド設計

### データベース設計

詳細は [DATABASE_SCHEMA.md](./supabase/DATABASE_SCHEMA.md) を参照。

#### テーブル関係図（主要部分）

```
users
  ├─1──n─→ stories
  ├─1──n─→ reservations
  │         ├─1──n─→ reservation_equipment
  │         └─1──n─→ reservation_activities
  ├─1──n─→ reviews
  ├─1──n─→ questions
  └─1──n─→ answers

vehicles
  ├─1──n─→ rental_vehicles
  │         └─1──n─→ reservations
  └─1──n─→ reviews

partners
  ├─1──n─→ reviews
  ├─1──n─→ route_stops
  └─1──n─→ partner_favorites

equipment
  └─1──n─→ reservation_equipment

activities
  ├─1──n─→ reservation_activities
  └─1──n─→ reviews
```

### Row Level Security (RLS) ポリシー

#### ポリシー設計原則

1. **デフォルト拒否**: RLS有効化後、ポリシーで明示的に許可されない限りアクセス不可
2. **最小権限**: 必要最小限のアクセス権限のみ付与
3. **役割ベース**: Admin > Staff > Partners > Members の階層
4. **所有権チェック**: 自分のデータのみアクセス可能

#### ポリシー例

```sql
-- ユーザーは自分の予約のみ閲覧可能
CREATE POLICY "Users can read own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR check_user_role(ARRAY['Admin', 'Staff']));

-- 公開されたストーリーは誰でも閲覧可能
CREATE POLICY "Anyone can read published stories"
  ON stories FOR SELECT
  TO authenticated, anon
  USING (status = 'Published' OR author_id = auth.uid());
```

### Edge Functions

#### 決済処理

```typescript
// create-payment-intent/index.ts
import Stripe from 'npm:stripe';

Deno.serve(async (req: Request) => {
  const { amount, currency } = await req.json();

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
  });

  return new Response(JSON.stringify(paymentIntent));
});
```

### API設計

#### RESTful エンドポイント（PostgREST）

| メソッド | エンドポイント | 説明 |
|---------|--------------|------|
| GET | `/vehicles` | 車両一覧取得 |
| GET | `/vehicles?id=eq.{id}` | 特定車両取得 |
| POST | `/reservations` | 予約作成 |
| PATCH | `/reservations?id=eq.{id}` | 予約更新 |
| DELETE | `/reservations?id=eq.{id}` | 予約削除 |

#### クエリ例

```typescript
// 車両一覧を取得（レンタル用、利用可能のみ）
const { data: vehicles } = await supabase
  .from('vehicles')
  .select('*, rental_vehicles(*)')
  .eq('purpose', 'rental')
  .eq('rental_vehicles.status', 'Available');

// 予約と関連データを取得
const { data: reservation } = await supabase
  .from('reservations')
  .select(`
    *,
    rental_vehicles (
      *,
      vehicles (*)
    ),
    reservation_equipment (
      *,
      equipment (*)
    )
  `)
  .eq('id', reservationId)
  .single();
```

---

## データフロー

### 予約フロー

```
1. ユーザー操作
   ↓
2. フロントエンド (React)
   - 車両選択
   - 機器選択
   - アクティビティ選択
   - 料金計算
   ↓
3. 予約送信
   - POST /reservations
   ↓
4. Supabase
   - データ検証
   - RLSポリシーチェック
   - トランザクション実行
   ↓
5. データベーストリガー
   - equipment_preparations レコード作成
   - 在庫数更新
   ↓
6. レスポンス返却
   ↓
7. UI更新
   - 予約確認画面表示
   - 通知作成
```

### 認証フロー

```
1. ユーザー登録
   ↓
2. Supabase Auth
   - メール/パスワード検証
   - auth.users レコード作成
   ↓
3. データベーストリガー (handle_new_user)
   - public.users レコード自動作成
   - デフォルト権限設定 (Members)
   ↓
4. JWTトークン発行
   ↓
5. クライアントにトークン保存
   ↓
6. 認証済みリクエスト
   - Authorization ヘッダーにトークン付与
   - RLSポリシーで auth.uid() が利用可能
```

---

## セキュリティアーキテクチャ

### 多層防御戦略

```
┌─────────────────────────────────────┐
│  1. クライアント側検証              │
│  - 入力値バリデーション             │
│  - XSS対策                          │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  2. HTTPS/TLS暗号化                 │
│  - すべての通信を暗号化             │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  3. 認証レイヤー (Supabase Auth)    │
│  - JWT検証                          │
│  - セッション管理                   │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  4. 認可レイヤー (RLS)              │
│  - 権限チェック                     │
│  - データアクセス制御               │
└─────────────────────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  5. データベース制約                │
│  - NOT NULL, UNIQUE, CHECK制約      │
│  - 外部キー制約                     │
└─────────────────────────────────────┘
```

### 権限管理

#### 役割と権限マトリクス

| 機能 | Admin | Staff | Partners | Members | Anonymous |
|-----|-------|-------|----------|---------|-----------|
| 車両閲覧 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 車両管理 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 予約作成 | ✅ | ✅ | ❌ | ✅ | ❌ |
| 予約管理（全て） | ✅ | ✅ | ❌ | ❌ | ❌ |
| 予約管理（自分） | ✅ | ✅ | ❌ | ✅ | ❌ |
| ストーリー投稿 | ✅ | ✅ | ✅ | ✅ | ❌ |
| ストーリー閲覧 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 協力店管理（全て） | ✅ | ❌ | ❌ | ❌ | ❌ |
| 協力店管理（自店） | ✅ | ❌ | ✅ | ❌ | ❌ |
| システム設定 | ✅ | ❌ | ❌ | ❌ | ❌ |

### セキュリティベストプラクティス

1. **パスワード管理**
   - Supabase Authでハッシュ化・暗号化
   - パスワードリセット機能
   - 強力なパスワードポリシー推奨

2. **XSS対策**
   - Reactの自動エスケープ
   - `dangerouslySetInnerHTML`の使用禁止
   - Content Security Policy (CSP)

3. **CSRF対策**
   - SameSite Cookie設定
   - トークンベース認証

4. **SQLインジェクション対策**
   - パラメータ化クエリ（PostgRESTが自動処理）
   - RLSによる追加保護

5. **機密情報管理**
   - 環境変数での管理
   - `.env`ファイルをgitignore
   - サーバー側でのみ機密情報使用

---

## パフォーマンス最適化

### フロントエンド最適化

#### 1. コード分割（Code Splitting）

```typescript
// 動的インポート
const AdminPage = lazy(() => import('./pages/AdminPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));

// ルート別分割
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/admin/*" element={<AdminPage />} />
    <Route path="/staff/*" element={<StaffPage />} />
  </Routes>
</Suspense>
```

#### 2. 画像最適化

- WebP形式の使用
- 遅延読み込み（Lazy Loading）
- レスポンシブ画像
- Supabase Storageの画像変換機能

#### 3. キャッシング戦略

```typescript
// Service Worker
// ネットワーク優先、フォールバックでキャッシュ
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
```

### バックエンド最適化

#### 1. データベースインデックス

- 頻繁に検索されるカラムにインデックス
- 外部キーにインデックス
- 複合インデックスの活用

```sql
-- 例: 予約検索の最適化
CREATE INDEX idx_reservations_user_status
  ON reservations(user_id, status);
```

#### 2. クエリ最適化

```typescript
// ❌ N+1クエリ問題
for (const story of stories) {
  const author = await supabase
    .from('users')
    .select('*')
    .eq('id', story.author_id)
    .single();
}

// ✅ JOIN使用
const { data: stories } = await supabase
  .from('stories')
  .select('*, users(*)');
```

#### 3. リアルタイム機能の最適化

```typescript
// 必要な変更のみサブスクライブ
supabase
  .channel('reservations')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'reservations',
      filter: `user_id=eq.${userId}`,
    },
    handleReservationChange
  )
  .subscribe();
```

---

## スケーラビリティ

### 水平スケーリング戦略

#### フロントエンド

```
                    Load Balancer
                         |
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    CDN Node 1       CDN Node 2       CDN Node 3
    (Tokyo)          (US West)        (Europe)
```

- **Vercel/Netlify**: 自動グローバルCDN配信
- **静的アセット**: エッジロケーションでキャッシュ
- **動的コンテンツ**: リージョン別配信

#### バックエンド（Supabase）

```
                    Supabase
                         |
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    Database         Edge Functions    Storage
   (Primary)         (Distributed)    (S3-like)
        |
    ┌───┴───┐
    ↓       ↓
 Read      Read
Replica  Replica
```

- **データベース**: PostgreSQLの読み取りレプリカ
- **Edge Functions**: グローバルに分散
- **Storage**: オブジェクトストレージ

### キャパシティプランニング

#### 想定トラフィック

| 指標 | 初期（〜1,000ユーザー） | 成長期（〜10,000ユーザー） | 成熟期（100,000+ユーザー） |
|-----|---------------------|----------------------|------------------------|
| DAU | 200 | 2,000 | 20,000 |
| リクエスト/秒 | 10 | 100 | 1,000 |
| データベース容量 | 5GB | 50GB | 500GB |
| ストレージ | 10GB | 100GB | 1TB |

#### スケーリング戦略

1. **Phase 1: 初期（〜1,000ユーザー）**
   - Supabase Free/Pro プラン
   - 単一リージョン
   - 基本的なキャッシング

2. **Phase 2: 成長期（〜10,000ユーザー）**
   - Supabase Team プラン
   - 読み取りレプリカ追加
   - CDNの積極活用
   - データベースインデックス最適化

3. **Phase 3: 成熟期（100,000+ユーザー）**
   - Supabase Enterprise プラン
   - マルチリージョン配置
   - マイクロサービス化検討
   - 専用インフラ検討

---

## モニタリング・ロギング

### メトリクス収集

```typescript
// パフォーマンス計測
const startTime = performance.now();
await fetchData();
const endTime = performance.now();
console.log(`Fetch time: ${endTime - startTime}ms`);

// エラートラッキング
try {
  await criticalOperation();
} catch (error) {
  logError(error, { context: 'criticalOperation' });
}
```

### 監視項目

- **アプリケーション**: エラー率、レスポンスタイム
- **データベース**: クエリパフォーマンス、接続数
- **インフラ**: CPU、メモリ、ネットワーク
- **ビジネス**: ユーザー登録数、予約数、コンバージョン率

---

## 今後の拡張

### Phase 1（短期）
- [ ] 画像アップロード機能の完全実装
- [ ] Stripe決済統合
- [ ] メール通知システム
- [ ] パフォーマンスモニタリング

### Phase 2（中期）
- [ ] モバイルアプリ（React Native）
- [ ] PWA対応
- [ ] オフライン機能
- [ ] プッシュ通知

### Phase 3（長期）
- [ ] AI推薦システム
- [ ] 多言語対応
- [ ] マイクロサービス化
- [ ] GraphQL API

---

**最終更新日**: 2026-02-07
