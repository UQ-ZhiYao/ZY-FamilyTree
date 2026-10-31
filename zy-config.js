/*
 * Zenith Yield — connection settings.
 * Fill in your Supabase project's URL and anon (public) key from:
 *   Supabase Dashboard → Project Settings → API
 * The anon key is meant to be public. Family data stays private because every table and
 * the photo bucket are protected by the row-level security rules in supabase/schema.sql.
 * Leave both empty to run the site with the demo family only.
 */
window.ZY_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: ''
};
