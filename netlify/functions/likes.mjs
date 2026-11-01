const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

async function hashVisitor(value, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export default async (request) => {
  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hashSalt = process.env.LIKE_HASH_SALT;

  if (!supabaseUrl || !serviceKey || !hashSalt) {
    return json({ error: "The like counter has not been configured yet." }, 503);
  }

  const apiHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  if (request.method === "GET") {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/site_likes?id=eq.teamwork&select=count`,
      { headers: apiHeaders }
    );

    if (!response.ok) {
      return json({ error: "Could not load the like count." }, 502);
    }

    const rows = await response.json();
    return json({ count: Number(rows?.[0]?.count ?? 0) });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (body?.action !== "like" || typeof body.visitorId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.visitorId)) {
    return json({ error: "Invalid visitor token." }, 400);
  }

  // Hash the random browser token with a server-only salt; no personal data is stored.
  const voterHash = await hashVisitor(body.visitorId, hashSalt);
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/increment_teamwork_likes`,
    {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ p_voter_hash: voterHash }),
    }
  );

  if (!response.ok) {
    return json({ error: "Could not save your like. Please try again." }, 502);
  }

  const result = await response.json();
  const row = Array.isArray(result) ? result[0] : result;

  return json({
    count: Number(row?.like_count ?? 0),
    alreadyLiked: row?.added === false,
  });
};
