import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks so vi.mock factory can reference them
const { mockSignInWithPassword, mockSignOut, mockGetSession, mockFrom } = vi.hoisted(() => ({
  mockSignInWithPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockGetSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('./../providers/api-client', () => {
  const selectFn = vi.fn();
  const eqFn = vi.fn();
  const singleFn = vi.fn();

  // Chain: from().select().eq().single()
  singleFn.mockResolvedValue({ data: { role: 'admin' }, error: null });
  eqFn.mockReturnValue({ single: singleFn });
  selectFn.mockReturnValue({ eq: eqFn });
  mockFrom.mockReturnValue({ select: selectFn });

  return {
    supabase: {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signOut: mockSignOut,
        getSession: mockGetSession,
      },
      from: mockFrom,
    },
    apiClient: {
      defaults: { baseURL: '/api' },
      interceptors: { request: { use: vi.fn() } },
    },
  };
});

// Import after mocks are set up
import { authProvider } from '../providers/auth-provider';

describe('authProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns success for admin role', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'tok123' },
          user: { id: 'u1' },
        },
        error: null,
      });

      // Reset the mock chain for this test
      const singleFn = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
      const eqFn = vi.fn().mockReturnValue({ single: singleFn });
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
      mockFrom.mockReturnValue({ select: selectFn });

      const result = await authProvider.login({ email: 'a@b.com', password: 'pass' });
      expect(result).toEqual({ success: true, redirectTo: '/' });
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'pass',
      });
    });

    it('rejects non-admin roles', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'tok123' },
          user: { id: 'u1' },
        },
        error: null,
      });

      const singleFn = vi.fn().mockResolvedValue({ data: { role: 'user' }, error: null });
      const eqFn = vi.fn().mockReturnValue({ single: singleFn });
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
      mockFrom.mockReturnValue({ select: selectFn });

      const result = await authProvider.login({ email: 'user@test.com', password: 'pass' });
      expect(result.success).toBe(false);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('returns error on Supabase failure', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authProvider.login({ email: 'a@b.com', password: 'wrong' });
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Invalid login credentials');
    });

    it('allows clinical_advisor role', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'tok' },
          user: { id: 'u2' },
        },
        error: null,
      });

      const singleFn = vi.fn().mockResolvedValue({ data: { role: 'clinical_advisor' }, error: null });
      const eqFn = vi.fn().mockReturnValue({ single: singleFn });
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
      mockFrom.mockReturnValue({ select: selectFn });

      const result = await authProvider.login({ email: 'ca@test.com', password: 'pass' });
      expect(result.success).toBe(true);
    });
  });

  describe('check', () => {
    it('returns authenticated for admin session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: 'u1' } } },
      });

      const singleFn = vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null });
      const eqFn = vi.fn().mockReturnValue({ single: singleFn });
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn });
      mockFrom.mockReturnValue({ select: selectFn });

      const result = await authProvider.check();
      expect(result.authenticated).toBe(true);
    });

    it('returns unauthenticated when no session', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      });

      const result = await authProvider.check();
      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe('/login');
    });
  });

  describe('logout', () => {
    it('signs out and redirects to login', async () => {
      mockSignOut.mockResolvedValue({ error: null });
      const result = await authProvider.logout({});
      expect(mockSignOut).toHaveBeenCalled();
      expect(result).toEqual({ success: true, redirectTo: '/login' });
    });
  });

  describe('onError', () => {
    it('triggers logout on 401', async () => {
      const result = await authProvider.onError({ statusCode: 401 });
      expect(result).toEqual({ logout: true, redirectTo: '/login' });
    });

    it('does not trigger logout on other errors', async () => {
      const result = await authProvider.onError({ statusCode: 500 });
      expect(result).toEqual({ error: { statusCode: 500 } });
    });
  });
});
