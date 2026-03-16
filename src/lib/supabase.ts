import { createClient } from '@supabase/supabase-js';
import { createLocalSupabaseClient } from './localSupabase';

const shouldUseRemoteSupabase = import.meta.env.VITE_USE_REMOTE_SUPABASE === 'true';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const hasRemoteConfig = Boolean(supabaseUrl && supabaseAnonKey);

const localClient = createLocalSupabaseClient();

export const supabase = shouldUseRemoteSupabase && hasRemoteConfig
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : localClient;

export const supabaseAdmin = shouldUseRemoteSupabase && supabaseServiceKey && supabaseUrl
  ? createClient(supabaseUrl, supabaseServiceKey)
  : localClient;
