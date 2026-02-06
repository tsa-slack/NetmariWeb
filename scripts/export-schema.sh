#!/bin/bash

# Netomari Database Schema Export Script
# This script exports the complete database schema from Supabase

set -e

echo "============================================"
echo "Netomari Database Schema Export"
echo "============================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "Error: Project is not linked to Supabase"
    echo "Please run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Create export directory
EXPORT_DIR="database_export_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$EXPORT_DIR"

echo "Exporting database schema..."
echo ""

# Export schema only (no data)
echo "1. Exporting schema (structure only)..."
supabase db dump --data-only=false -f "$EXPORT_DIR/schema.sql"
echo "   ✓ Schema exported to: $EXPORT_DIR/schema.sql"

# Export complete dump (schema + data)
echo "2. Exporting complete database (schema + data)..."
supabase db dump -f "$EXPORT_DIR/complete_dump.sql"
echo "   ✓ Complete dump exported to: $EXPORT_DIR/complete_dump.sql"

# Export migrations
echo "3. Exporting migrations..."
if [ -d "supabase/migrations" ]; then
    cp -r supabase/migrations "$EXPORT_DIR/migrations"
    echo "   ✓ Migrations copied to: $EXPORT_DIR/migrations"
else
    echo "   ⚠ No migrations directory found"
fi

# Create README for the export
cat > "$EXPORT_DIR/README.md" << 'EOF'
# Netomari Database Export

このディレクトリには、Netomariプロジェクトのデータベースエクスポートが含まれています。

## ファイル

- `schema.sql` - データベース構造のみ（テーブル、関数、トリガー、RLS等）
- `complete_dump.sql` - 完全なダンプ（構造+データ）
- `migrations/` - マイグレーションファイル（ある場合）

## 新しいプロジェクトへのインポート

### 方法1: Supabase CLI

```bash
# 新しいプロジェクトにリンク
supabase link --project-ref YOUR_NEW_PROJECT_REF

# スキーマをインポート
supabase db reset
psql "postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres" -f schema.sql
```

### 方法2: Supabaseダッシュボード

1. 新しいSupabaseプロジェクトのダッシュボードを開く
2. 「SQL Editor」に移動
3. `schema.sql` の内容を貼り付けて実行

## 注意事項

- `schema.sql` はデータを含みません
- `complete_dump.sql` は本番データを含む可能性があるため、取り扱いに注意してください
- パスワードや機密情報は含まれていませんが、ユーザーデータが含まれている可能性があります

## 詳細

詳細なマイグレーション手順については、プロジェクトルートの `MIGRATION_GUIDE.md` を参照してください。
EOF

echo "   ✓ README created"

echo ""
echo "============================================"
echo "Export completed successfully!"
echo "============================================"
echo ""
echo "Export directory: $EXPORT_DIR"
echo ""
echo "Next steps:"
echo "1. Review the exported files in: $EXPORT_DIR"
echo "2. Import to new project using instructions in: $EXPORT_DIR/README.md"
echo "3. Or follow detailed guide in: MIGRATION_GUIDE.md"
echo ""
