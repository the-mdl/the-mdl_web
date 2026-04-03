import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGet, mockPost, mockPatch, mockDelete, mockRequest } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockRequest: vi.fn(),
}));

vi.mock('./../providers/api-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
  apiClient: {
    defaults: { baseURL: '/api' },
    interceptors: { request: { use: vi.fn() } },
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
    request: mockRequest,
  },
}));

import { dataProvider } from '../providers/data-provider';

describe('dataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getList', () => {
    it('maps users endpoint → { data: users, total }', async () => {
      mockGet.mockResolvedValue({
        data: { users: [{ id: '1', email: 'a@b.com' }], total: 42 },
      });

      const result = await dataProvider.getList({ resource: 'users' });
      expect(result.data).toEqual([{ id: '1', email: 'a@b.com' }]);
      expect(result.total).toBe(42);
      expect(mockGet).toHaveBeenCalledWith('/admin/users', { params: {} });
    });

    it('passes page/perPage for users', async () => {
      mockGet.mockResolvedValue({ data: { users: [], total: 0 } });

      await dataProvider.getList({
        resource: 'users',
        pagination: { currentPage: 2, pageSize: 25 },
      });

      expect(mockGet).toHaveBeenCalledWith('/admin/users', {
        params: { page: 2, perPage: 25 },
      });
    });

    it('maps circles/health → { data: circles, total: length }', async () => {
      const circles = [
        { id: 'c1', name: 'Test Circle', member_count: 2, message_count: 10 },
      ];
      mockGet.mockResolvedValue({ data: { circles } });

      const result = await dataProvider.getList({ resource: 'circles' });
      expect(result.data).toEqual(circles);
      expect(result.total).toBe(1);
      expect(mockGet).toHaveBeenCalledWith('/admin/circles/health', { params: {} });
    });

    it('maps alerts → { data: alerts, total: length }', async () => {
      const alerts = [{ id: 'a1', severity: 'high' }, { id: 'a2', severity: 'low' }];
      mockGet.mockResolvedValue({ data: { alerts } });

      const result = await dataProvider.getList({ resource: 'alerts' });
      expect(result.data).toEqual(alerts);
      expect(result.total).toBe(2);
    });

    it('maps whitelist → { data: entries, total: length }', async () => {
      const entries = [{ email: 'a@b.com', added_at: '2024-01-01', notes: null }];
      mockGet.mockResolvedValue({ data: { entries } });

      const result = await dataProvider.getList({ resource: 'whitelist' });
      expect(result.data).toEqual(entries);
      expect(result.total).toBe(1);
    });

    it('maps invites → { data: invites, total: length }', async () => {
      mockGet.mockResolvedValue({
        data: { invites: [{ code: 'abc', email: 'x@y.com' }] },
      });

      const result = await dataProvider.getList({ resource: 'invites' });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('maps audits → { data: audits, total: length }', async () => {
      mockGet.mockResolvedValue({ data: { audits: [] } });
      const result = await dataProvider.getList({ resource: 'audits' });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('maps feedback → { data: feedback, total: length }', async () => {
      mockGet.mockResolvedValue({
        data: { feedback: [{ id: 'f1', status: 'new' }] },
      });
      const result = await dataProvider.getList({ resource: 'feedback' });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('maps tester-alerts → { data: alerts, total: length }', async () => {
      mockGet.mockResolvedValue({
        data: { alerts: [{ id: 'ta1', title: 'Test Alert' }] },
      });
      const result = await dataProvider.getList({ resource: 'tester-alerts' });
      expect(result.data).toEqual([{ id: 'ta1', title: 'Test Alert' }]);
      expect(result.total).toBe(1);
    });

    it('forwards filters as query params', async () => {
      mockGet.mockResolvedValue({ data: { alerts: [], total: 0 } });

      await dataProvider.getList({
        resource: 'alerts',
        filters: [{ field: 'severity', operator: 'eq', value: 'high' }],
      });

      expect(mockGet).toHaveBeenCalledWith('/admin/alerts', {
        params: { severity: 'high' },
      });
    });

    it('throws on unknown resource', async () => {
      await expect(
        dataProvider.getList({ resource: 'nonexistent' }),
      ).rejects.toThrow('Unknown resource: nonexistent');
    });
  });

  describe('getOne', () => {
    it('fetches user detail', async () => {
      const detail = { user: { id: 'u1' }, circles: [], stats: {} };
      mockGet.mockResolvedValue({ data: detail });

      const result = await dataProvider.getOne({ resource: 'users', id: 'u1' });
      expect(result.data).toEqual(detail);
      expect(mockGet).toHaveBeenCalledWith('/admin/users/u1');
    });

    it('fetches circle detail', async () => {
      mockGet.mockResolvedValue({ data: { circle: { id: 'c1' } } });

      const result = await dataProvider.getOne({ resource: 'circles', id: 'c1' });
      expect(mockGet).toHaveBeenCalledWith('/admin/circles/c1');
    });
  });

  describe('create', () => {
    it('posts to resource path', async () => {
      mockPost.mockResolvedValue({ data: { entry: { email: 'a@b.com' } } });

      await dataProvider.create({
        resource: 'whitelist',
        variables: { email: 'a@b.com' },
      });

      expect(mockPost).toHaveBeenCalledWith('/admin/whitelist', { email: 'a@b.com' });
    });
  });

  describe('update', () => {
    it('patches resource by id', async () => {
      mockPatch.mockResolvedValue({ data: { success: true } });

      await dataProvider.update({
        resource: 'alerts',
        id: 'a1',
        variables: { resolved: true },
      });

      expect(mockPatch).toHaveBeenCalledWith('/admin/alerts/a1', { resolved: true });
    });
  });

  describe('deleteOne', () => {
    it('deletes resource by id', async () => {
      mockDelete.mockResolvedValue({ data: { success: true } });

      await dataProvider.deleteOne({ resource: 'whitelist', id: 'test@x.com' });
      expect(mockDelete).toHaveBeenCalledWith('/admin/whitelist/test@x.com');
    });
  });

  describe('custom', () => {
    it('makes custom requests', async () => {
      mockRequest.mockResolvedValue({ data: { summary: [] } });

      const result = await dataProvider.custom!({
        url: '/admin/cost-summary',
        method: 'get',
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/admin/cost-summary', method: 'get' }),
      );
    });
  });

  describe('getApiUrl', () => {
    it('returns base URL', () => {
      expect(dataProvider.getApiUrl()).toBe('/api');
    });
  });
});
