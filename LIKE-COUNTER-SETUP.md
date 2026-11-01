# TEAMWORK Like Counter Setup

The page uses a Netlify Function and Supabase so every visitor sees the same global like count.

## 1. Create the Supabase database

1. Create a free Supabase project at https://supabase.com/.
2. Open **SQL Editor -> New query**.
3. Copy and run the complete SQL from `supabase/setup-likes.sql` in this repository.

## 2. Add Netlify environment variables

In Netlify, open your site:

**Site configuration -> Environment variables -> Add a variable**

Add these three variables:

- `SUPABASE_URL`: Project URL from Supabase **Project Settings -> API**.
- `SUPABASE_SERVICE_ROLE_KEY`: The **service_role** secret from Supabase **Project Settings -> API Keys**. Keep this secret private; never put it in `index.html` or commit it to GitHub.
- `LIKE_HASH_SALT`: A long random secret string used to hash visitor IPs before storing them. Do not share or commit it.

The service-role key is used only inside the Netlify server function.

## 3. Deploy

1. Push the repository changes to GitHub.
2. In Netlify, trigger **Deploys -> Trigger deploy -> Deploy site**.
3. Once the deploy finishes, open `https://teamworkjeeofficialz.netlify.app/.netlify/functions/likes`.

A JSON response such as `{"count":0}` means the endpoint is connected.

## How duplicate likes are handled

The browser remembers a like locally for a convenient button state. The server also stores a salted SHA-256 hash of the visitor IP with a unique database constraint, so refreshing or clearing local storage does not add another like from the same network. People sharing the same public IP (for example, the same Wi-Fi) share one vote. VPNs or changing networks can bypass this simple protection, so it is not a substitute for account-based voting or strong anti-abuse controls.
