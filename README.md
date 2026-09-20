# ぴよログ 応援デモ

ぴよログの記録（データフィード）を Supabase に保存し、LLM でキャラクター（くま・うさぎ）の応援セリフを作るデモです。

- `supabase/functions/fetch-piyolog` … ぴよログのフィードを取得して `piyolog_records` に保存し、記録を返す Edge Function
- `supabase/functions/generate-serifu` … 直近の記録を集計し、LLM（既定: `gpt-4.1-mini`）でセリフを生成する Edge Function
- `supabase/functions/generate-diary-image` … 絵日記の文章から、OpenAI の画像生成（既定: `gpt-image-1`）で子どもが描いたような挿絵を作る Edge Function。日記の枠・縦書きの文章は画面側で描く
- `sql/` … テーブル作成 SQL
- `docs/index.html` … デモページ（GitHub Pages で公開。スマホからも開けます）
- `voice/` … セリフ読み上げ用の音声サンプル

## デモページの使い方

接続先（Project URL と anon key）は `docs/config.js` に記録してあります。`anonKey` が空のままのときは、ページの「接続設定」に **Project URL**（`https://xxxx.supabase.co`）と **anon key**（Supabase の Legacy anon key）を入力して使います（入力した値は、そのブラウザの localStorage にだけ保存されます）。

## セットアップ

1. `sql/001_create_piyolog_records.sql` を Supabase の SQL Editor で実行
2. 3つの Edge Function を Supabase にデプロイ
3. Edge Functions の Secrets に設定
   - `PIYOLOG_FEED_ID` / `PIYOLOG_FEED_SECRET` … ぴよログアプリの「設定 > データフィード」で発行
   - `OPENAI_API_KEY` … OpenAI の API キー
   - 任意: `BABY_NAME`, `SERIFU_MODEL`, `DIARY_IMAGE_MODEL`, `DIARY_IMAGE_QUALITY`（絵日記の絵。既定は `gpt-image-1` / `medium`）

## 注意

- ぴよログの secret、API キーは**絶対にコミットしないでください**（`.gitignore` で `.claude/` と `.env` を除外しています）。
- Edge Function は認証なしです。このリポジトリは公開で、`docs/config.js` に anon key を載せているため、ページの URL を知った人は誰でも、記録の取得と API 料金の発生ができます。公開して使う場合は、認証と回数制限を追加してください。
