-- ぴよログの記録を保存するテーブル
-- Supabaseダッシュボードの「SQL Editor」に貼り付けて実行してください

create table if not exists piyolog_records (
  event_id text primary key,       -- ぴよログ側の記録ID（重複取得しても上書きされる）
  datetime timestamptz not null,   -- 記録の日時（UTC）
  type text not null,              -- 記録の種類（Formula, BreastFeeding など）
  payload jsonb not null,          -- ぴよログAPIが返した記録オブジェクトをそのまま保存
  fetched_at timestamptz not null default now()  -- このレコードを取得した時刻
);

create index if not exists piyolog_records_datetime_idx
  on piyolog_records (datetime);

-- 取得ログ（成功/失敗の履歴。原因調査や死活監視に使う）
create table if not exists piyolog_fetch_logs (
  id bigint generated always as identity primary key,
  status text not null,            -- 'success' | 'error'
  http_status int,
  record_count int,
  message text,
  created_at timestamptz not null default now()
);

-- 育児記録は個人情報なので、外部（アプリ側の公開キー）からは読み書きできないようにする
-- RLSを有効化し、ポリシーは作らない = anon/authenticatedは全て拒否
-- Edge Function（service_role）だけがアクセスできるよう、権限を明示的に付与する
alter table piyolog_records enable row level security;
alter table piyolog_fetch_logs enable row level security;

grant all on table piyolog_records to service_role;
grant all on table piyolog_fetch_logs to service_role;
grant usage, select on all sequences in schema public to service_role;
