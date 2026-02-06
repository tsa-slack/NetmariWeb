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

## 📖 目次

- [概要](#概要)
- [主要機能](#主要機能)
- [技術スタック](#技術スタック)
- [プロジェクト構造](#プロジェクト構造)
- [セットアップ](#セットアップ)
- [開発](#開発)
- [デプロイ](#デプロイ)
- [ドキュメント](#ドキュメント)
- [ライセンス](#ライセンス)

---

## 概要

**Netomari（ネトマリ）** は、車中泊とキャンピングカーライフを楽しむ人々のための総合プラットフォームです。車両の販売・レンタル、体験記の共有、協力店の検索、コミュニティQ&Aなど、車中泊に必要なすべての機能を一つのプラットフォームで提供します。

### ビジョン

車中泊を通じて、新しい旅のスタイルと自由なライフスタイルを提案し、コミュニティの力で豊かな体験を共有します。

### 対象ユーザー

- **キャンピングカーオーナー** - 車両情報の共有、体験記の投稿
- **これから始める人** - 車両選び、レンタル、情報収集
- **協力店オーナー** - RVパーク、レストラン、観光地などの情報発信
- **管理者・スタッフ** - プラットフォーム運営とサポート

---

## 主要機能

### 🚐 車両管理

#### 販売車両
- 車両カタログの閲覧
- 詳細な仕様・装備情報
- 画像ギャラリー
- お気に入り登録
- レビュー・評価システム

#### レンタル車両
- 在庫検索と予約
- カレンダー表示
- 料金計算（日数・オプション）
- 予約管理
- チェックイン/チェックアウト

#### レンタルオプション
- **機器レンタル**: テント、寝袋、調理器具など20種類以上
- **アクティビティ**: トレッキング、カヤック、温泉巡りなど
- **機器準備トラッキング**: スタッフ向け準備管理システム

### 📝 コミュニティ

#### 体験記（Stories）
- Markdownエディタによる記事作成
- 位置情報付き投稿
- 画像アップロード（複数枚）
- タグ付け
- いいね・ブックマーク
- 閲覧数カウント
- 質問・回答システム

#### Q&Aフォーラム（Questions）
- 質問投稿・回答
- カテゴリ別分類
- ベストアンサー機能
- 役立った投票
- 検索機能

#### レビューシステム
- 車両・協力店・アクティビティのレビュー
- 5段階評価
- 良い点・悪い点の記載
- 画像付きレビュー
- 役立った投票

### 🗺️ 協力店・ルート

#### 協力店検索
- 地図表示（Leaflet）
- カテゴリフィルター（RVパーク、レストラン、給油所、観光地）
- 詳細情報（営業時間、料金、設備）
- レビュー・評価
- お気に入り登録

#### ルートプランニング
- 出発地・目的地の設定
- 経由地の追加
- 協力店の組み込み
- ルートの保存・共有
- 公開/非公開設定

### 👥 ユーザー管理

#### 認証システム
- メール/パスワード認証（Supabase Auth）
- パスワードリセット
- プロフィール管理
- アカウント設定
- 通知設定

#### 4段階の権限管理
1. **Admin（管理者）**
   - システム全体の管理
   - ユーザー管理
   - コンテンツモデレーション
   - システム設定の変更
   - 管理ログの閲覧

2. **Staff（スタッフ）**
   - 予約管理
   - 貸出・返却処理
   - 機器準備管理
   - お問い合わせ対応
   - コンテンツ承認

3. **Partners（協力店）**
   - 自店舗情報の管理
   - レビューへの返信
   - アクティビティ管理
   - 統計情報の閲覧

4. **Members（会員）**
   - 予約・レンタル
   - 体験記投稿
   - Q&A参加
   - レビュー投稿
   - お気に入り管理

#### 会員ランクシステム
- **Bronze（初期）**: 新規登録時、割引なし
- **Silver**: 累計¥50,000以上 or いいね10以上 or 投稿3以上、5%割引
- **Gold**: 累計¥200,000以上 or いいね30以上 or 投稿10以上、10%割引
- **Platinum**: 累計¥500,000以上 or いいね100以上 or 投稿30以上、15%割引

**自動ランク更新**: 予約完了時、体験記公開時、いいね追加時に自動判定
**割引適用**: レンタル予約時にランクに応じた割引を自動適用

### 🎉 イベント管理

- イベント作成・編集
- 参加登録
- オンライン/オフライン対応
- 定員管理
- 参加者リスト

### 📢 お知らせ・通知

#### システムお知らせ
- 重要度設定（通常/重要）
- カテゴリ分類
- 公開/非公開設定

#### 通知システム
- 体験記へのコメント通知
- 予約ステータス変更通知
- Q&Aの回答通知
- システムからのお知らせ
- 通知設定のカスタマイズ

### 🛠️ 管理機能

#### スタッフ機能
- **貸出管理**: 車両状態チェック、機器準備
- **返却管理**: 返却検査、清掃確認
- **予約管理**: ステータス更新、キャンセル処理
- **お問い合わせ管理**: ステータス管理、担当者割り当て

#### マスタデータ管理
- 車両管理（販売・レンタル）
- 機器管理
- 協力店管理
- アクティビティ管理
- カテゴリ管理
- システム設定

---

## 技術スタック

### フロントエンド

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **React** | 18.3 | UIライブラリ |
| **TypeScript** | 5.5 | 型安全な開発 |
| **Vite** | 5.4 | ビルドツール |
| **React Router** | 7.13 | ルーティング |
| **Tailwind CSS** | 3.4 | スタイリング |
| **Lucide React** | 0.344 | アイコン |
| **React Leaflet** | 4.2 | 地図表示 |
| **Stripe** | 8.7 | 決済（準備中） |

### バックエンド

| 技術 | 説明 |
|------|------|
| **Supabase** | バックエンドプラットフォーム |
| **PostgreSQL** | リレーショナルデータベース（32テーブル） |
| **Row Level Security** | データアクセス制御 |
| **Supabase Auth** | 認証システム |
| **Supabase Storage** | 画像ストレージ |
| **Edge Functions** | サーバーレス関数 |

### 開発ツール

- **ESLint** - コード品質管理
- **TypeScript ESLint** - TypeScript用リンター
- **PostCSS** - CSS処理
- **Autoprefixer** - ベンダープレフィックス自動付与

---

## プロジェクト構造

```
netomari/
├── src/
│   ├── components/          # 再利用可能なコンポーネント
│   │   ├── Header.tsx      # ヘッダー（ナビゲーション）
│   │   ├── Footer.tsx      # フッター
│   │   ├── Layout.tsx      # レイアウト
│   │   ├── AdminLayout.tsx # 管理画面レイアウト
│   │   ├── StaffSidebar.tsx # スタッフサイドバー
│   │   ├── RouteMap.tsx    # ルート地図
│   │   ├── ImageUpload.tsx # 画像アップロード
│   │   └── ConfirmModal.tsx # 確認モーダル
│   │
│   ├── pages/              # ページコンポーネント（55ページ）
│   │   ├── HomePage.tsx
│   │   ├── VehiclesPage.tsx
│   │   ├── PartnersPage.tsx
│   │   ├── StoriesPage.tsx
│   │   ├── QuestionsPage.tsx
│   │   ├── RentalPage.tsx
│   │   ├── MyPage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── StaffPage.tsx
│   │   └── ... (その他45ページ)
│   │
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx # 認証コンテキスト
│   │
│   ├── hooks/              # カスタムフック
│   │   └── useSystemSettings.ts
│   │
│   ├── lib/                # ユーティリティ・設定
│   │   ├── supabase.ts     # Supabaseクライアント
│   │   ├── database.types.ts # DB型定義
│   │   └── imageUpload.ts  # 画像アップロード
│   │
│   ├── App.tsx             # ルート設定
│   ├── main.tsx            # エントリーポイント
│   └── index.css           # グローバルスタイル
│
├── supabase/
│   ├── migrations/         # データベースマイグレーション
│   │   └── consolidated_schema.sql
│   ├── functions/          # Edge Functions
│   │   └── create-payment-intent/
│   └── DATABASE_SCHEMA.md  # スキーマドキュメント
│
├── public/                 # 静的ファイル
├── .env                    # 環境変数
├── .env.example            # 環境変数テンプレート
├── vite.config.ts          # Vite設定
├── tailwind.config.js      # Tailwind設定
├── tsconfig.json           # TypeScript設定
├── package.json            # 依存関係
└── README.md              # このファイル
```

### ページ一覧

**公開ページ（15）:**
- トップ、車両一覧/詳細、協力店一覧/詳細、体験記一覧/詳細、Q&A一覧/詳細、イベント一覧/詳細、レンタル、お問い合わせ、About、プライバシーポリシー、利用規約

**認証ページ（6）:**
- ログイン、会員登録、パスワードリセット、パスワード忘れ、マイページ、ポータル

**レンタルフロー（4）:**
- 車両選択、機器選択、アクティビティ選択、確認

**投稿・編集（5）:**
- 体験記投稿/編集、質問投稿、イベント作成、レビュー投稿、協力店登録

**管理画面（15）:**
- 管理ダッシュボード、ユーザー管理、車両管理、機器管理、協力店管理、アクティビティ管理、予約管理、体験記管理、Q&A管理、レビュー管理、お問い合わせ管理、カテゴリ管理、システム設定

**スタッフ機能（3）:**
- スタッフダッシュボード、貸出処理、返却処理

**協力店機能（2）:**
- 協力店ダッシュボード、レビュー管理

---

## セットアップ

### 前提条件

- **Node.js** 18以上
- **npm** または **yarn**
- **Supabaseアカウント**（[supabase.com](https://supabase.com)で無料登録）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd netomari
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`を`.env`にコピーして、Supabaseの情報を設定します：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabaseの情報は、プロジェクトダッシュボードの「Settings > API」から取得できます。

### 4. データベースのセットアップ

Supabaseダッシュボードで「SQL Editor」を開き、`supabase/migrations/consolidated_schema.sql`の内容を実行します。

または、Supabase CLIを使用：

```bash
# Supabase CLIのインストール
npm install -g supabase

# プロジェクトとリンク
supabase link --project-ref your-project-ref

# マイグレーションの適用
supabase db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

---

## 開発

### コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# ビルドのプレビュー
npm run preview

# リンターの実行
npm run lint

# 型チェック
npm run typecheck
```

### コーディング規約

- **TypeScript Strict Mode** を使用
- **関数型コンポーネント** を優先
- **Tailwind CSS** でスタイリング
- **Row Level Security** ですべてのデータアクセスを保護
- **コンポーネントの分割** - 1ファイル200-300行を目安

### ブランチ戦略

- `main` - 本番環境
- `develop` - 開発環境
- `feature/*` - 機能開発
- `bugfix/*` - バグ修正

---

## デプロイ

### Vercel（推奨）

1. [Vercel](https://vercel.com)にログイン
2. リポジトリをインポート
3. 環境変数を設定
4. デプロイ

### Netlify

1. [Netlify](https://netlify.com)にログイン
2. リポジトリをインポート
3. ビルドコマンド: `npm run build`
4. 公開ディレクトリ: `dist`
5. 環境変数を設定
6. デプロイ

### 環境変数の設定

デプロイ先で以下の環境変数を設定：

```
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
```

---

## ドキュメント

詳細なドキュメントは以下を参照してください：

- **[DATABASE_SCHEMA.md](./supabase/DATABASE_SCHEMA.md)** - データベーススキーマの詳細
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - システムアーキテクチャ（作成予定）
- **[FEATURES.md](./FEATURES.md)** - 機能詳細仕様（作成予定）
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - 開発ガイド（作成予定）
- **[API_REFERENCE.md](./API_REFERENCE.md)** - API リファレンス（作成予定）

---

## セキュリティ

### Row Level Security (RLS)

すべてのテーブルでRLSが有効化されており、以下のポリシーで保護されています：

- 認証済みユーザーのみアクセス可能
- ユーザーは自分のデータのみ編集可能
- 管理者・スタッフは全データにアクセス可能
- 公開データは誰でも閲覧可能

### データ保護

- パスワードはSupabase Authで暗号化
- 個人情報は適切にマスキング
- 画像アップロードはSupabase Storageで管理
- XSS/CSRF対策を実装

---

## 開発状況

### 実装済み ✅

- ✅ データベーススキーマ（32テーブル）
- ✅ 認証システム（4段階権限）
- ✅ 基本レイアウト・ナビゲーション
- ✅ 全55ページの実装
- ✅ 車両管理（販売・レンタル）
- ✅ 機器レンタルシステム
- ✅ アクティビティ予約
- ✅ 協力店検索・地図表示
- ✅ 体験記投稿・閲覧
- ✅ Q&Aフォーラム
- ✅ レビューシステム
- ✅ ルートプランニング
- ✅ イベント管理
- ✅ お知らせ・通知
- ✅ お問い合わせ管理
- ✅ 管理画面
- ✅ スタッフ機能
- ✅ 協力店ダッシュボード
- ✅ 会員ランクシステム
- ✅ サンプルデータ

### 改善予定 🚧

- 🚧 画像アップロード機能の実装
- 🚧 Stripe決済統合
- 🚧 リアルタイム通知
- 🚧 メール通知
- 🚧 検索機能の強化
- 🚧 レスポンシブデザインの最適化
- 🚧 パフォーマンス最適化
- 🚧 テストカバレッジの向上
- 🚧 PWA対応
- 🚧 多言語対応

---

## コントリビューション

このプロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

## トラブルシューティング

### よくある問題

**Q: `npm install`でエラーが出る**
A: Node.jsのバージョンを確認してください（18以上が必要）

**Q: Supabaseに接続できない**
A: `.env`ファイルの`VITE_SUPABASE_URL`と`VITE_SUPABASE_ANON_KEY`が正しく設定されているか確認してください

**Q: ログインできない**
A: Supabaseダッシュボードで「Authentication」が有効になっているか確認してください

**Q: 画像がアップロードできない**
A: Supabase Storageでバケットが作成されているか確認してください

---

## ライセンス

このプロジェクトは仕様書に基づいて作成されたデモアプリケーションです。

---

## サポート

質問や問題がある場合：

- **GitHub Issues** - バグ報告や機能リクエスト
- **Discussions** - 一般的な質問や議論

---

## 謝辞

このプロジェクトは以下の素晴らしいオープンソースプロジェクトを使用しています：

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Lucide Icons](https://lucide.dev/)
- [Leaflet](https://leafletjs.com/)

---

<div align="center">
  <p>Made with ❤️ for the camping community</p>
  <p><strong>Netomari - どこでも、寝泊まりを。</strong></p>
</div>
