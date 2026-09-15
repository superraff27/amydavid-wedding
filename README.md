# Amy & David — Dark Luxury V3

A cinematic wedding invitation built with Next.js, TypeScript, Tailwind CSS, GSAP and Lenis —
now with a real RSVP form, music toggle, navigation, a venue map, and a Supabase-backed admin
dashboard so the couple's name/date/venue can be edited without touching code.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Set up Supabase (from scratch)

The site works without Supabase (RSVPs fall back to browser localStorage, and default
Amy & David content is shown), but to unlock the real RSVP database + admin dashboard:

1. **Create a project**
   - Go to https://supabase.com → Sign up / log in → "New project".
   - Pick any name/region, set a database password (save it somewhere), wait ~2 min for it to provision.

2. **Run the schema**
   - In your Supabase project, open **SQL Editor → New query**.
   - Copy the entire contents of `supabase/schema.sql` from this project, paste it in, click **Run**.
   - This creates two tables: `wedding_settings` (editable content) and `rsvps` (guest responses), with sensible security rules already applied.

3. **Get your API keys**
   - Go to **Project Settings → API**.
   - Copy the **Project URL** and the **anon public** key.

4. **Add them to the app**
   - Copy `.env.local.example` to `.env.local`.
   - Paste in the URL and anon key:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
     ```
   - Restart `npm run dev` after saving.

5. **Create your admin login**
   - In Supabase, go to **Authentication → Users → Add user**.
   - Enter your email + a password. This is what you'll use to log into `/admin`.
   - (Skip email confirmation, or confirm it manually — either works for a single admin.)

6. **Log in**
   - Visit `/admin/login`, sign in with the user you just created.
   - You'll land on `/admin`, where you can:
     - edit couple names, wedding date/time, tagline, venue name/address, and the Google Maps search query — changes appear on the live site immediately, no redeploy needed.
     - see every RSVP submitted (name, attending yes/no, guest count, message) with totals, and delete test entries.

## Turning this into a reusable template

Because all the couple-specific content now lives in the `wedding_settings` table instead of
hardcoded in the page, reusing this for a different couple is just:

1. Create a fresh Supabase project (or reuse one, update the single row) and re-run `supabase/schema.sql`.
2. Update the row via the `/admin` dashboard — no code changes.
3. Swap the photos in `public/images/`.
4. (Optional) Drop a music file at `public/audio/song.mp3` for the music toggle.

## Notes
- Without Supabase configured, RSVP submissions are saved to `localStorage` on the guest's own
  browser (key `amy-david-rsvp`) purely so the form is testable in development — set up Supabase
  before sending real invites so responses land in the database and admin dashboard.
- The supplied wedding images are wired into `public/images/`. Replace them there when the final
  couple photos are available.
