# NeuroCine — SaaS Studio

Current package: **v62–v63 Studio UI + Production Pack Polish**.

## Current foundation

- Google/Supabase Auth
- FREE / PRO / OWNER access model
- PRO works through own AI API keys
- OWNER uses platform API keys from Render ENV
- Cloud Projects with save/open/search/rename/duplicate/delete
- Production Pack stored in Cloud snapshot
- AI Key Vault base
- Basic OWNER Admin Panel

## Latest update

v62–v63 adds a cleaner Studio Flow panel and Production Pack polish:

```txt
01 Script → 02 Storyboard → 03 Pipeline → 04 Production Pack → 05 Export
```

See:

```txt
README_v62_63_studio_ui_production_pack_polish.md
```

## Required Render ENV

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
API_KEY_ENCRYPTION_SECRET=
NEXT_PUBLIC_SITE_URL=https://neurocine.online
ADMIN_EMAILS=dosvidosikml@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=dosvidosikml@gmail.com
```

## Deploy

```bash
npm install
npm run build
npm start
```

