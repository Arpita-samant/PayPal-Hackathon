import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL || 
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL || 
  (import.meta.env as any).SUPABASE_URL || 
  'https://placeholder-project.supabase.co'
);
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (import.meta.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  (import.meta.env as any).SUPABASE_PUBLISHABLE_KEY || 
  'placeholder-anon-key'
);

export const isSupabaseConfigured = Boolean(
  (
    import.meta.env.VITE_SUPABASE_URL || 
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_URL || 
    (import.meta.env as any).SUPABASE_URL
  ) && 
  (
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    (import.meta.env as any).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    (import.meta.env as any).SUPABASE_PUBLISHABLE_KEY
  ) &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGitHub() {
  if (!isSupabaseConfigured) {
    console.info("Supabase credentials pending. Simulating GitHub OAuth login.");
    return { data: { user: { id: "demo-leader", email: "leader@hackathon.dev" } }, error: null };
  }
  return await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin
    }
  });
}

export async function signOut() {
  if (!isSupabaseConfigured) return;
  return await supabase.auth.signOut();
}
