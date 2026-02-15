# Netomari（ネトマリ）

<div align="center">
  <h3>車中泊キャンピングカー コミュニティプラットフォーム</h3>
  <p><strong>「どこでも、寝泊まりを。」</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646cff)](https://vitejs.dev/)
</div>

---

## 概要

車中泊とキャンピングカーライフを楽しむ人々のための総合プラットフォーム。車両の販売・レンタル、体験記の共有、協力店の検索、コミュニティQ&Aなど、車中泊に必要なすべての機能を提供します。

---

## 主要機能

### 🚐 車両・レンタル
- 車両カタログ（販売・レンタル）・詳細情報・画像ギャラリー
- レンタル予約（車両＋機器＋アクティビティ）・カレンダー・料金計算
- 貸出/返却チェックリスト・機器準備トラッキング

### 📝 コミュニティ
- **体験記**: Markdown エディタ・位置情報・画像・いいね・ブックマーク
- **Q&A**: カテゴリ分類・ベストアンサー・役立った投票
- **レビュー**: 5段階評価・良い点/悪い点・画像付き
- **イベント**: オンライン/オフライン・参加登録・定員管理

### 🗺️ 協力店・ルート
- 地図検索（Leaflet）・カテゴリフィルター・お気に入り
- ルートプランニング・経由地追加・保存/共有

### 👥 ユーザー管理
- 4段階権限: Admin → Staff → Partners → Members
- 会員ランク: Bronze → Silver → Gold → Platinum（自動昇格・割引）
- プロフィール・通知設定

### 🛠️ 管理機能
- 管理ダッシュボード（15画面）・システム設定
- お問い合わせ管理・コンテンツモデレーション

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 / TypeScript 5.5 / Vite 5.4 / Tailwind CSS |
| ルーティング | React Router v7 |
| 地図 | React Leaflet (Leaflet.js) / Google Maps Places API |
| 決済 | Stripe（Edge Functions 経由） |
| バックエンド | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| セキュリティ | Row Level Security (RLS) 全テーブル |
| テスト | Vitest（28テスト） |
| コード品質 | ESLint / TypeScript strict mode |

---

## プロジェクト構成

```
src/
├── components/           # 共有コンポーネント (Header, Footer, Layout...)
├── pages/                # 55ページ
├── contexts/             # AuthContext
├── hooks/                # useSystemSettings 等
└── lib/
    ├── supabase.ts       # Supabase クライアント
    ├── database.types.ts # DB型定義（自動生成）
    ├── logger.ts         # ログユーティリティ
    └── data-access/      # 共通データアクセス層
        ├── base/         # BaseRepository, QueryBuilder, 型定義
        ├── hooks/        # useQuery, useMutation
        └── repositories/ # テーブル固有リポジトリ (14個)

supabase/
├── migrations/           # 統合マイグレーション SQL
└── functions/            # Edge Functions (Stripe 決済)

docs/
├── API.md                # API定義・認証・RLS・権限
└── DATABASE.md           # テーブル定義・関数・ER図
```

### ページ構成（55ページ）

| カテゴリ | ページ数 | 内容 |
|---------|---------|------|
| 公開 | 15 | トップ, 車両, 協力店, 体験記, Q&A, イベント, レンタル, お問い合わせ 等 |
| 認証 | 6 | ログイン, 登録, パスワードリセット, マイページ, ポータル |
| レンタルフロー | 4 | 車両選択 → 機器選択 → アクティビティ選択 → 確認 |
| 投稿・編集 | 5 | 体験記, 質問, イベント, レビュー, 協力店 |
| 管理画面 | 15 | ダッシュボード, ユーザー/車両/機器/協力店/予約 管理 等 |
| スタッフ | 3 | ダッシュボード, 貸出, 返却 |
| 協力店 | 2 | ダッシュボード, レビュー管理 |

---

## セットアップ

### 前提条件

- Node.js 18+
- Supabase アカウント（[supabase.com](https://supabase.com)）

### 手順

```bash
# 1. リポジトリクローン & 依存関係インストール
git clone <repository-url>
cd netomari
npm install

# 2. 環境変数設定
cp .env.sample .env
# .env を編集:
#   VITE_SUPABASE_URL         - Supabase プロジェクトURL
#   VITE_SUPABASE_ANON_KEY    - Supabase Anon Key
#   VITE_STRIPE_PUBLISHABLE_KEY - Stripe 公開キー（レンタル決済用）
#   VITE_GOOGLE_MAPS_API_KEY  - Google Maps API キー（施設検索用）

# 3. 開発サーバー起動
npm run dev
# → http://localhost:5173
```

### Google Maps API セットアップ

協力店・体験記の施設検索（PlaceAutocomplete）に Google Maps API を使用しています。

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. 以下の API を有効化:
   - **Maps JavaScript API**
   - **Places API**（※ Places API (New) ではなく旧版）
3. **認証情報** → API キーを作成
4. **HTTPリファラー制限**に以下を追加:
   - 開発: `http://localhost:5173/*`
   - 本番: `https://yourdomain.com/*`
5. `.env` に `VITE_GOOGLE_MAPS_API_KEY` を設定

### データベースセットアップ

Supabase SQL エディタで `supabase/migrations/20260207000000_complete_database_schema.sql` を実行。
詳細は [docs/DATABASE.md](./docs/DATABASE.md) を参照。

---

## 開発コマンド

```bash
npm run dev        # 開発サーバー
npm run build      # 本番ビルド
npm run preview    # ビルドプレビュー
npm run lint       # ESLint
npm run typecheck  # TypeScript 型チェック
npm test           # Vitest テスト
```

---

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/SYSTEM_OVERVIEW.md](./docs/SYSTEM_OVERVIEW.md) | システム概要・技術スタック・アーキテクチャ |
| [docs/SYSTEM_DETAIL.md](./docs/SYSTEM_DETAIL.md) | 全ページ・コンポーネント・DB詳細・ER図 |
| [docs/API.md](./docs/API.md) | API定義・認証・RLS・Stripe・権限マトリクス |
| [docs/DATABASE.md](./docs/DATABASE.md) | テーブル定義・関数・トリガー・ER図 |
| [docs/HANDOVER.md](./docs/HANDOVER.md) | 引継ぎドキュメント |
| [src/lib/data-access/README.md](./src/lib/data-access/README.md) | データアクセス層の使用方法 |

---

## デプロイ

### Vercel（推奨）/ Netlify

1. リポジトリをインポート
2. ビルドコマンド: `npm run build` / 公開ディレクトリ: `dist`
3. 環境変数を設定:
   ```
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
   VITE_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
   VITE_GOOGLE_MAPS_API_KEY=<your_google_maps_api_key>
   ```

---

## ライセンス

このプロジェクトは仕様書に基づいて作成されたデモアプリケーションです。

---

<div align="center">
  <p>Made with ❤️ for the camping community</p>
  <p><strong>Netomari - どこでも、寝泊まりを。</strong></p>
</div>
