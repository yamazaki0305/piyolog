// 接続先（index.html と eval.html で共有）
//
// anonKey は、Supabase の「公開してよいキー」（Project Settings > API Keys > Legacy の anon）です。
// 空のままのときは、ページに「接続設定」の入力欄が出ます。
const CONFIG = {
  url: "https://wpgruxldjaybvzzlyamk.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZ3J1eGxkamF5YnZ6emx5YW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NDI2MDYsImV4cCI6MjEwNTMxODYwNn0.mMmBv1gSpAaUtS6FxomBMJ0j57NwiUdgxQK6Bj_Z3QM",
};

// 接続先。anonKey が設定済みならそれを使い、なければ fallback()（入力欄の値など）を使う
function connection(fallback) {
  return CONFIG.anonKey ? { url: CONFIG.url, key: CONFIG.anonKey } : fallback();
}
