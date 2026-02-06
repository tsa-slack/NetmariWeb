# データベースマイグレーション

このディレクトリには、データベーススキーマのマイグレーションファイルが格納されます。

### 方法1: 現在のデータベースからエクスポート（推奨）

プロジェクトルートで以下のコマンドを実行：

```bash
# Supabase CLIをインストール
npm install -g supabase

# 現在のプロジェクトにリンク
supabase link --project-ref YOUR_CURRENT_PROJECT_REF

# スキーマをエクスポート
./scripts/export-schema.sh

# または手動でエクスポート
supabase db dump --data-only=false -f schema.sql
```

### 方法2: Supabase CLIでマイグレーションを生成

```bash
# ローカルSupabaseを初期化
supabase init

# リモートデータベースにリンク
supabase link --project-ref YOUR_PROJECT_REF

# リモートからマイグレーションを生成
supabase db remote commit

# 新しいプロジェクトに適用
supabase link --project-ref YOUR_NEW_PROJECT_REF
supabase db push
```

### 方法3: Supabaseダッシュボード経由

1. エクスポートしたSQLファイルを取得
2. 新しいSupabaseプロジェクトのダッシュボードを開く
3. 「SQL Editor」に移動
4. SQLファイルの内容を貼り付けて実行

## マイグレーションファイルの命名規則

Supabaseのマイグレーションファイルは以下の命名規則に従います：

```
YYYYMMDDHHMMSS_description.sql
```

例：
- `20260207000000_initial_schema.sql`
- `20260207010000_add_rank_system.sql`

## データベース構造

現在のデータベースには以下が含まれます：

- **32のテーブル** - 完全なアプリケーションデータモデル
- **RLSポリシー** - すべてのテーブルで有効
- **17の関数とトリガー** - 自動化処理
- **100以上のインデックス** - パフォーマンス最適化
- **会員ランクシステム** - 自動昇格機能

詳細は `../DATABASE_SCHEMA.md` を参照してください。

## トラブルシューティング

### マイグレーションが失敗する

```
Error: migration failed
```

**解決方法**:
1. 依存関係を確認（テーブルが正しい順序で作成されているか）
2. 既存のテーブルとの衝突を確認
3. RLSポリシーで参照される関数が先に作成されているか確認

### 重複エラー

```
ERROR: relation "users" already exists
```

**解決方法**:
- `CREATE TABLE IF NOT EXISTS` を使用
- または `supabase db reset` でデータベースをリセット

## 参考資料

- [完全なマイグレーションガイド](../../MIGRATION_GUIDE.md)
- [データベーススキーマドキュメント](../DATABASE_SCHEMA.md)
- [Supabase Migrations Documentation](https://supabase.com/docs/guides/cli/local-development#database-migrations)

---

**最終更新**: 2026-02-07
