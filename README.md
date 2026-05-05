# PPMB Web Archive

Read-only Next.js frontend for the archived PPMB forum data stored in Supabase.

## Environment

Create `ppmb-web/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dcxdvaykpjijhvxylovy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

If you want server-side reads with a private key instead, add:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy to Vercel

1. Import the `ppmb-web` folder as a Vercel project.
2. Add the same Supabase environment variables in Vercel.
3. Deploy.

### Vercel settings

- Framework preset: `Next.js`
- Root directory: `ppmb-web`
- Build command: `npm run build`
- Install command: `npm install`

### Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY`

If you want to keep the site strictly public and read-only, the best setup is:
- use `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- keep RLS off for these archive tables, or add read-only public policies later

If you want tighter control later:
- turn RLS on
- add public `select` policies only for `channels`, `threads`, `posts`, and any search view you expose
- switch the app to server-side reads with `SUPABASE_SERVICE_ROLE_KEY`

The app includes:
- forum index
- forum thread pages
- paginated thread pages
- lightweight archive search by thread title and username
- read-only rendering for BBCode-style post bodies
