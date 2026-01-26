import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://taanfezqrhytebmxjpzz.supabase.co';
const supabaseAnonKey = 'sb_publishable_EhGv1e-POW6cO4M0uI47ng_98yw3_U0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
