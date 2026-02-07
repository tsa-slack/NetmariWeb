# データベースマイグレーション

統合マイグレーション: `20260207000000_complete_database_schema.sql`

## セットアップ

Supabase SQL エディタで上記ファイルの内容を貼り付けて実行。

```bash
# または Supabase CLI
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 詳細

- テーブル定義・ER図 → [docs/DATABASE.md](../../docs/DATABASE.md)
- API・RLS・権限 → [docs/API.md](../../docs/API.md)
