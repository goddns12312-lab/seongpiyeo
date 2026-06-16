import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient<any, 'public', any> | null = null;

function initializeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing Supabase environment variables', {
      hasUrl: !!url,
      hasKey: !!key,
      url: url ? url.substring(0, 20) + '...' : 'missing',
    });
  }

  return createSupabaseClient(url!, key!);
}

export const createClient = (): SupabaseClient<any, 'public', any> => {
  if (!supabaseClient) {
    supabaseClient = initializeClient();
  }
  return supabaseClient;
};
