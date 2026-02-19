import { createClient } from '@supabase/supabase-js';
import { publicAnonKey } from '../../utils/supabase/info';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hrwtrbrzttdaxyymeugr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || publicAnonKey;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info('Using default Supabase configuration from info.tsx');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);