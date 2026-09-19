// ぴよログ データフィードを取得し、Supabaseのテーブルに保存するEdge Function
//
// このファイルの内容を、Supabaseダッシュボードの
// Edge Functions > Deploy a new function > Via Editor
// にそのまま貼り付けてデプロイします。
//
// 事前に Project Settings > Edge Functions > Secrets で以下を設定してください:
//   PIYOLOG_FEED_ID     ぴよログアプリで発行したフィードのID部分
//   PIYOLOG_FEED_SECRET ぴよログアプリで発行したフィードのsecret部分
//   PIYOLOG_FEED_PERIOD 任意。未設定なら "24h"
//
// SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY はSupabaseが自動で用意するので設定不要です。

import { createClient } from "npm:@supabase/supabase-js@2";

interface PiyoLogRecord {
  event_id: string;
  datetime: string;
  type: string;
  [key: string]: unknown;
}

interface FeedResponse {
  schema_version: number;
  generated_at: string;
  range: { from: string; to: string };
  records: PiyoLogRecord[];
}

interface FeedErrorResponse {
  error: { code: string; message: string };
  request_id?: string;
}

// ブラウザ（webデモ）から呼べるようにするCORS設定
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function respond(body: string, status = 200, contentType = "text/plain; charset=utf-8") {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": contentType },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const feedId = Deno.env.get("PIYOLOG_FEED_ID");
  const secret = Deno.env.get("PIYOLOG_FEED_SECRET");
  const period = Deno.env.get("PIYOLOG_FEED_PERIOD") ?? "24h";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (!feedId || !secret) {
    const message = "PIYOLOG_FEED_ID / PIYOLOG_FEED_SECRET が設定されていません";
    await logResult(supabase, "error", null, 0, message);
    return respond(message, 500);
  }

  const url = `https://feed.piyolog.com/v1/feed/${period}/${feedId}/${secret}`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const body = (await res.json()) as FeedErrorResponse;
      const message = `${body.error?.code ?? "unknown_error"}: ${body.error?.message ?? ""}`;
      await logResult(supabase, "error", res.status, 0, message);
      return respond(message, res.status);
    }

    const feed = (await res.json()) as FeedResponse;

    if (feed.schema_version !== 1) {
      const message = `未対応のschema_version: ${feed.schema_version}`;
      await logResult(supabase, "error", res.status, 0, message);
      return respond(message, 500);
    }

    if (feed.records.length > 0) {
      const rows = feed.records.map((r) => ({
        event_id: r.event_id,
        datetime: r.datetime,
        type: r.type,
        payload: r,
      }));

      const { error } = await supabase
        .from("piyolog_records")
        .upsert(rows, { onConflict: "event_id" });

      if (error) {
        await logResult(supabase, "error", res.status, 0, error.message);
        return respond(error.message, 500);
      }
    }

    await logResult(supabase, "success", res.status, feed.records.length, null);

    return respond(
      JSON.stringify({
        ok: true,
        record_count: feed.records.length,
        range: feed.range,
        records: feed.records,
      }),
      200,
      "application/json; charset=utf-8",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logResult(supabase, "error", null, 0, message);
    return respond(message, 500);
  }
});

async function logResult(
  supabase: ReturnType<typeof createClient>,
  status: "success" | "error",
  httpStatus: number | null,
  recordCount: number,
  message: string | null,
) {
  await supabase.from("piyolog_fetch_logs").insert({
    status,
    http_status: httpStatus,
    record_count: recordCount,
    message,
  });
}
