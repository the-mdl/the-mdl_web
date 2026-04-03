import type { AuthProvider } from '@refinedev/core';
import { supabase } from './api-client';

export const authProvider: AuthProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return {
        success: false,
        error: {
          name: 'Login Error',
          message: error?.message ?? 'Invalid credentials',
        },
      };
    }

    // Verify admin role via profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          name: 'Login Error',
          message: 'User profile not found',
        },
      };
    }

    const role = profile.role as string;
    if (role !== 'admin' && role !== 'clinical_advisor') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          name: 'Unauthorized',
          message: 'Admin or clinical advisor role required',
        },
      };
    }

    return { success: true, redirectTo: '/' };
  },

  logout: async () => {
    await supabase.auth.signOut();
    return { success: true, redirectTo: '/login' };
  },

  check: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { authenticated: false, redirectTo: '/login' };
    }

    // Verify role is still admin/clinical_advisor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = (profile?.role as string) ?? '';
    if (role !== 'admin' && role !== 'clinical_advisor') {
      await supabase.auth.signOut();
      return { authenticated: false, redirectTo: '/login', error: { name: 'Forbidden', message: 'Insufficient role' } };
    }

    return { authenticated: true };
  },

  getIdentity: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      name: (profile?.display_name as string) ?? session.user.email ?? 'Admin',
      email: session.user.email,
      role: (profile?.role as string) ?? 'unknown',
    };
  },

  onError: async (error) => {
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 401 || status === 403) {
      return { logout: true, redirectTo: '/login' };
    }
    return { error };
  },
};
