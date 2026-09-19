/**
 * ぴよログ データフィードAPIの疎通・仕様確認用スクリプト（Deno想定）
 *
 * 使い方:
 *   PIYOLOG_FEED_ID=xxx PIYOLOG_FEED_SECRET=yyy deno run --allow-net --allow-env scripts/verify_feed.ts
 *
 * 参考: https://www.piyolog.com/app/piyolog/data_feed/ja/
 */

type Period = "24h" | "3d" | "7d" | "28d";

interface FeedResponse {
  schema_version: number;
  generated_at: string;
  range: { from: string; to: string };
  records: Record<string, unknown>[];
}

interface FeedErrorResponse {
  error: { code: string; message: string };
  request_id?: string;
}

const feedId = Deno.env.get("PIYOLOG_FEED_ID");
const secret = Deno.env.get("PIYOLOG_FEED_SECRET");
const period = (Deno.env.get("PIYOLOG_FEED_PERIOD") as Period) ?? "24h";

if (!feedId || !secret) {
  console.error("環境変数 PIYOLOG_FEED_ID / PIYOLOG_FEED_SECRET を設定してください。");
  Deno.exit(1);
}

const url = `https://feed.piyolog.com/v1/feed/${period}/${feedId}/${secret}`;

async function fetchFeed() {
  const res = await fetch(url, {
    headers: { "Cache-Control": "no-cache" },
  });

  console.log(`HTTP ${res.status}`);

  if (!res.ok) {
    const body = (await res.json()) as FeedErrorResponse;
    console.error("エラーレスポンス:", body);
    return;
  }

  const body = (await res.json()) as FeedResponse;

  if (body.schema_version !== 1) {
    console.warn(`未対応の schema_version: ${body.schema_version}`);
  }

  console.log("generated_at:", body.generated_at);
  console.log("range:", body.range);
  console.log("records件数:", body.records.length);

  const typeCounts = new Map<string, number>();
  for (const r of body.records) {
    const t = String(r.type);
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  console.log("種類別件数:", Object.fromEntries(typeCounts));

  console.log("先頭3件のサンプル:");
  console.log(JSON.stringify(body.records.slice(0, 3), null, 2));
}

await fetchFeed();
