import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Netlify.env.get("SUPABASE_URL");
  const supabaseKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: "Like counter is not configured. Add Supabase environment variables in Netlify." }, 503);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (request.method === "GET") {
    const { data, error } = await supabase
      .from("site_likes")
      .select("count")
      .eq("id", "teamwork")
      .single();

    if (error) return json({ error: "Could not load like count." }, 500);
    return json({ count: data.count });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (body.action !== "like") {
    return json({ error: "Invalid action." }, 400);
  }

  // One atomic Postgres function avoids lost updates when many people click together.
  const { data, error } = await supabase.rpc("increment_teamwork_likes");
  if (error) return json({ error: "Could not save your like. Please try again." }, 500);

  return json({ count: data });
};
