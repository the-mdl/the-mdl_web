import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://api.the-mdl.com',
});

// Attach JWT to every outgoing request
apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
