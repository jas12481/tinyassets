# Package Requirements for Supabase

After initializing Next.js, install the Supabase client:

```bash
npm install @supabase/supabase-js
```

Or if using yarn:

```bash
yarn add @supabase/supabase-js
```

## Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Supabase Setup Steps

1. Go to https://supabase.com and create a new project
2. Go to **SQL Editor** → New Query
3. Copy and paste the contents of `backend/schema.sql`
4. Click **Run** to execute the schema
5. Go to **Settings** → **API**
6. Copy your **Project URL** and **anon public** key to `.env.local`
7. (Optional) Copy **service_role** key for admin operations
