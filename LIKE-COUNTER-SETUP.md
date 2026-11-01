# TEAMWORK Like Counter Setup

The page uses a Netlify Function and Supabase so every visitor sees the same global like count.

## 1. Create the Supabase database

1. Create a Supabase project at https://supabase.com/.
2. Open **SQL Editor -> New query**.
3. Copy and run the complete SQL from `supabase/setup-likes.sql` in this repository.

## 2. Add Netlify environment variables

In Netlify, open your site:

**Site configuration -> Environment variables -> Add a variable**

Add these three variables:

- `SUPABASE_URL`: Project URL from Supabase **Project Settings -> API**.
- `SUPABASE_SERVICE_ROLE_KEY`: The server-side `service_role` key from Supabase **Project Settings -> API Keys**. Keep this secret private; never put it in `index.html` or commit it to GitHub.
- `LIKE_HASH_SALT`: A long random secret string used to hash browser IDs before storing them. Do not share or commit it.

The service-role key is used only inside the Netlify server function.

## 3. Deploy

1. Push the repository changes to GitHub.
2. In Netlify, trigger **Deploys -> Trigger deploy -> Deploy site**.
3. Once the deploy finishes, open `https://teamworkjeeofficialz.netlify.app/.netlify/functions/likes`.

A JSON response such as `{"count":0}` means the endpoint is connected.

## How duplicate likes are handled

Each browser profile receives a random ID stored in local storage. The server stores only a salted SHA-256 hash of that ID, with a unique database constraint, so refreshing the page does not add another like. Different people on the same Wi-Fi can each like from their own browser. Clearing browser storage or using another browser/device can create another vote, so this lightweight setup is not strong anti-abuse protection or account-based voting.
