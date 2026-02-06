# 開発ガイド

このドキュメントは、Netomariプロジェクトの開発に必要な情報をまとめています。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [開発ワークフロー](#開発ワークフロー)
- [コーディング規約](#コーディング規約)
- [テスト](#テスト)
- [デバッグ](#デバッグ)
- [パフォーマンス最適化](#パフォーマンス最適化)
- [トラブルシューティング](#トラブルシューティング)

---

## 開発環境のセットアップ

### 必要なツール

```bash
# Node.js 18以上
node --version  # v18.x.x 以上

# npm (Node.jsに含まれる)
npm --version

# Git
git --version
```

### 推奨エディタ・拡張機能

#### Visual Studio Code

**推奨拡張機能:**
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin (Volar)
- Error Lens
- GitLens
- Auto Rename Tag
- Path Intellisense

**settings.json 例:**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*?[\"'`]([^\"'`]*).*?[\"'`]", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### プロジェクトのクローンとセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd netomariweb

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してSupabaseの情報を設定

# 開発サーバー起動
npm run dev
```

### Supabaseのセットアップ

#### 1. Supabaseプロジェクト作成

1. [supabase.com](https://supabase.com) でアカウント作成
2. 新しいプロジェクトを作成
3. リージョン選択（日本の場合は Tokyo を推奨）

#### 2. データベースマイグレーション

**方法1: ダッシュボードから実行**
1. Supabaseダッシュボードを開く
2. 「SQL Editor」を選択
3. `supabase/migrations/consolidated_schema.sql` の内容をコピー&ペースト
4. 「Run」をクリック

**方法2: CLIを使用**
```bash
# Supabase CLIのインストール
npm install -g supabase

# プロジェクトとリンク
supabase link --project-ref your-project-ref

# マイグレーション適用
supabase db push
```

#### 3. Storageのセットアップ

```bash
# Supabaseダッシュボードで以下のバケットを作成
# Storage > New bucket

# バケット名: vehicle-images
# Public: true

# バケット名: story-images
# Public: true

# バケット名: partner-images
# Public: true
```

#### 4. 環境変数の設定

```env
# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

プロジェクトのURLとキーは、Supabaseダッシュボードの「Settings > API」から取得できます。

---

## 開発ワークフロー

### ブランチ戦略

```
main (本番環境)
  ↑
develop (開発環境)
  ↑
feature/機能名 (機能開発)
bugfix/バグ名 (バグ修正)
```

### 新機能の開発フロー

```bash
# developブランチから最新を取得
git checkout develop
git pull origin develop

# 機能ブランチを作成
git checkout -b feature/new-feature-name

# 開発...
# ファイルを編集

# 変更を確認
git status
git diff

# ステージング
git add .

# コミット（コミットメッセージ規約に従う）
git commit -m "feat: 新機能の説明"

# プッシュ
git push origin feature/new-feature-name

# GitHubでプルリクエストを作成
# developブランチへマージ
```

### コミットメッセージ規約

Conventional Commits形式を使用：

```
<type>: <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードスタイル変更（機能変更なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、設定等の変更

**例:**
```bash
git commit -m "feat: 車両お気に入り機能を追加"
git commit -m "fix: レンタル予約の料金計算を修正"
git commit -m "docs: README.mdにセットアップ手順を追加"
git commit -m "refactor: 予約フォームのバリデーションロジックを改善"
```

---

## コーディング規約

### TypeScript

#### 命名規則

```typescript
// ✅ Good
// PascalCase: コンポーネント、型、インターフェース
interface UserProfile {}
type VehicleStatus = 'Available' | 'OnRent';
function VehicleCard() {}

// camelCase: 変数、関数、メソッド
const userName = 'John';
function getUserById(id: string) {}

// UPPER_SNAKE_CASE: 定数
const MAX_UPLOAD_SIZE = 5_000_000;
const API_BASE_URL = 'https://api.example.com';

// ❌ Bad
const UserName = 'John';  // PascalCaseは使わない
function GetUserById() {} // PascalCaseは使わない
const maxUploadSize = 5_000_000; // camelCaseは使わない
```

#### 型定義

```typescript
// ✅ Good - 明示的な型定義
const vehicles: Vehicle[] = [];
function fetchVehicle(id: string): Promise<Vehicle> {}

// ✅ Good - 型推論を活用
const count = vehicles.length; // number型と推論される
const names = vehicles.map(v => v.name); // string[]と推論される

// ❌ Bad - any型の使用
const data: any = await fetchData(); // 避ける

// ✅ Good - unknown型を使用して型安全に
const data: unknown = await fetchData();
if (typeof data === 'object' && data !== null) {
  // 型ガードで安全に扱う
}
```

#### 関数

```typescript
// ✅ Good - アロー関数（短い関数）
const add = (a: number, b: number) => a + b;

// ✅ Good - 通常の関数（複雑なロジック）
function calculateRentalPrice(
  days: number,
  pricePerDay: number,
  equipment: Equipment[]
): number {
  const vehiclePrice = days * pricePerDay;
  const equipmentPrice = equipment.reduce((sum, item) => {
    return sum + item.quantity * item.pricePerDay * days;
  }, 0);
  return vehiclePrice + equipmentPrice;
}

// ❌ Bad - 型定義なし
function calculate(a, b) {
  return a + b;
}
```

### React

#### コンポーネント

```typescript
// ✅ Good - 関数型コンポーネント + TypeScript
interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: (id: string) => void;
}

export function VehicleCard({ vehicle, onSelect }: VehicleCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{vehicle.name}</h3>
      <p>{vehicle.manufacturer}</p>
      {onSelect && (
        <button onClick={() => onSelect(vehicle.id)}>
          選択
        </button>
      )}
    </div>
  );
}

// ❌ Bad - 型定義なし
export function VehicleCard({ vehicle, onSelect }) {
  // ...
}
```

#### Hooks

```typescript
// ✅ Good - カスタムフック
function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchVehicles()
      .then(setVehicles)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { vehicles, loading, error };
}

// 使用例
function VehicleList() {
  const { vehicles, loading, error } = useVehicles();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {vehicles.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
```

#### State管理

```typescript
// ✅ Good - 適切なstate分割
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loading, setLoading] = useState(false);

// ❌ Bad - 過度なstate結合
const [formState, setFormState] = useState({
  email: '',
  password: '',
  loading: false,
  error: null,
  // ... たくさんのフィールド
});

// ✅ Good - 関連するstateはuseReducerで管理
const [state, dispatch] = useReducer(formReducer, initialState);
```

### Tailwind CSS

#### クラス名の順序

```tsx
// ✅ Good - 論理的な順序
<div className="
  flex items-center justify-between
  w-full max-w-4xl
  px-4 py-6
  bg-white border border-gray-200 rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">

// レイアウト → サイズ → スペーシング → 外観 → インタラクション
```

#### レスポンシブデザイン

```tsx
// ✅ Good - モバイルファースト
<div className="
  flex flex-col gap-4
  md:flex-row md:gap-6
  lg:gap-8
">

// ❌ Bad - デスクトップファースト（避ける）
<div className="
  flex-row gap-8
  md:flex-col md:gap-4
">
```

#### カスタムクラス

```tsx
// ❌ Bad - インラインスタイル
<div style={{ color: '#333', fontSize: '14px' }}>

// ✅ Good - Tailwindクラス
<div className="text-gray-700 text-sm">

// ✅ Good - カスタムクラス（必要な場合のみ）
<div className="custom-gradient">
```

### Supabase

#### クエリ

```typescript
// ✅ Good - 型安全なクエリ
const { data, error } = await supabase
  .from('vehicles')
  .select('*, rental_vehicles(*)')
  .eq('status', 'Available')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error fetching vehicles:', error);
  return;
}

// ✅ Good - maybeSingle()の使用（0または1件）
const { data: vehicle } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', vehicleId)
  .maybeSingle();

// ❌ Bad - single()の使用（0件でエラー）
const { data: vehicle } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', vehicleId)
  .single(); // データがない場合エラー
```

#### エラーハンドリング

```typescript
// ✅ Good - 適切なエラーハンドリング
async function createReservation(data: ReservationData) {
  try {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return reservation;
  } catch (error) {
    console.error('Failed to create reservation:', error);
    throw new Error('予約の作成に失敗しました');
  }
}
```

---

## テスト

### テスト戦略

現在のプロジェクトではテストは未実装ですが、以下の戦略を推奨します。

#### 単体テスト（Unit Tests）

```bash
# テストフレームワークのインストール
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

**テスト例:**
```typescript
// useVehicles.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useVehicles } from './useVehicles';

describe('useVehicles', () => {
  it('should fetch vehicles', async () => {
    const { result } = renderHook(() => useVehicles());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.vehicles).toHaveLength(3);
  });
});
```

#### 統合テスト（Integration Tests）

```typescript
// VehicleList.test.tsx
import { render, screen } from '@testing-library/react';
import { VehicleList } from './VehicleList';

describe('VehicleList', () => {
  it('should render vehicle cards', async () => {
    render(<VehicleList />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('キャンパー デラックス')).toBeInTheDocument();
    });
  });
});
```

#### E2Eテスト（End-to-End Tests）

```bash
# Playwrightのインストール
npm install --save-dev @playwright/test
```

**テスト例:**
```typescript
// e2e/rental.spec.ts
import { test, expect } from '@playwright/test';

test('rental flow', async ({ page }) => {
  await page.goto('http://localhost:5173/rental');

  // 車両選択
  await page.click('[data-testid="vehicle-1"]');

  // 日付選択
  await page.fill('[name="start_date"]', '2026-03-01');
  await page.fill('[name="end_date"]', '2026-03-03');

  // 次へ
  await page.click('text=次へ');

  // 確認
  await expect(page.locator('text=予約確認')).toBeVisible();
});
```

---

## デバッグ

### React Developer Tools

1. [React Developer Tools](https://react.dev/learn/react-developer-tools)をインストール
2. ブラウザの開発者ツールで「Components」タブを開く
3. コンポーネントツリー、props、stateを確認

### Supabase デバッグ

#### クエリのデバッグ

```typescript
// クエリの詳細をログ出力
const { data, error, status, statusText } = await supabase
  .from('vehicles')
  .select('*');

console.log('Status:', status);
console.log('Data:', data);
console.log('Error:', error);
```

#### RLSポリシーのデバッグ

```sql
-- 現在のユーザーIDを確認
SELECT auth.uid();

-- ポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'vehicles';

-- 手動でポリシーをテスト
SELECT * FROM vehicles WHERE auth.uid() = user_id;
```

### パフォーマンスデバッグ

```typescript
// パフォーマンス計測
console.time('fetchVehicles');
const vehicles = await fetchVehicles();
console.timeEnd('fetchVehicles');

// React DevToolsのProfiler
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} (${phase}): ${actualDuration}ms`);
}

<Profiler id="VehicleList" onRender={onRenderCallback}>
  <VehicleList />
</Profiler>
```

---

## パフォーマンス最適化

### 画像最適化

```typescript
// ✅ Good - 遅延読み込み
<img
  src={vehicle.images[0]}
  alt={vehicle.name}
  loading="lazy"
/>

// ✅ Good - レスポンシブ画像
<img
  srcSet={`
    ${vehicle.images[0]}?w=300 300w,
    ${vehicle.images[0]}?w=600 600w,
    ${vehicle.images[0]}?w=1200 1200w
  `}
  sizes="(max-width: 768px) 100vw, 50vw"
  src={vehicle.images[0]}
  alt={vehicle.name}
/>
```

### コンポーネント最適化

```typescript
// ✅ Good - React.memo
const VehicleCard = memo(function VehicleCard({ vehicle }: Props) {
  return <div>...</div>;
});

// ✅ Good - useMemo
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// ✅ Good - useCallback
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### バンドルサイズ最適化

```typescript
// ❌ Bad - すべてインポート
import _ from 'lodash';

// ✅ Good - 必要な関数のみインポート
import debounce from 'lodash/debounce';

// ✅ Good - 動的インポート
const AdminPage = lazy(() => import('./pages/AdminPage'));
```

---

## トラブルシューティング

### よくある問題

#### 1. Supabaseに接続できない

**症状:**
```
Failed to fetch
```

**解決策:**
1. `.env`ファイルが正しく設定されているか確認
2. Supabase URLが`VITE_`プレフィックスで始まっているか確認
3. 開発サーバーを再起動

```bash
# .envファイルを確認
cat .env

# 開発サーバーを再起動
npm run dev
```

#### 2. RLSポリシーでアクセスできない

**症状:**
```
Error: new row violates row-level security policy
```

**解決策:**
1. 認証されているか確認
2. RLSポリシーを確認
3. ユーザーの役割を確認

```typescript
// 認証状態を確認
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user);

// ユーザー情報を確認
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user?.id)
  .single();
console.log('Profile:', profile);
```

#### 3. 型エラー

**症状:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**解決策:**
```typescript
// ❌ Bad
const name: string = user?.name;

// ✅ Good - オプショナルチェイニング
const name = user?.name ?? 'Unknown';

// ✅ Good - 型ガード
if (user?.name) {
  const name: string = user.name;
}
```

#### 4. ビルドエラー

**症状:**
```
Module not found
```

**解決策:**
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install

# キャッシュをクリア
npm run build -- --force
```

### デバッグコマンド

```bash
# 型チェック
npm run typecheck

# リンターチェック
npm run lint

# 本番ビルド
npm run build

# ビルドをローカルで確認
npm run preview
```

---

## 便利なスクリプト

### package.jsonに追加

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "clean": "rm -rf dist node_modules",
    "reinstall": "npm run clean && npm install"
  }
}
```

### Git Hooks

```bash
# huskyのインストール
npm install --save-dev husky lint-staged

# Git hooksのセットアップ
npx husky install

# pre-commitフックを追加
npx husky add .husky/pre-commit "npm run lint-staged"
```

**package.jsonに追加:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## その他のリソース

### ドキュメント

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### コミュニティ

- [React Discord](https://discord.gg/react)
- [Supabase Discord](https://discord.supabase.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/reactjs)

---

**最終更新日**: 2026-02-07
