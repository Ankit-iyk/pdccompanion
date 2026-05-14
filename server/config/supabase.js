import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.warn('[Supabase] Missing credentials — DB features disabled. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
}

export const supabase = url && key ? createClient(url, key) : null;
