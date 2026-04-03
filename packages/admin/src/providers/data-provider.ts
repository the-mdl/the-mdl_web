import type { DataProvider } from '@refinedev/core';
import { apiClient } from './api-client';

/**
 * Maps Refine resource names → API endpoint paths and response shape extraction.
 *
 * Each entry defines:
 * - path: the admin API path (relative to /admin)
 * - listKey: the key in the response JSON that holds the array
 * - totalKey: the key for total count (or null to use array length)
 */
const RESOURCE_MAP: Record<string, {
  path: string;
  listKey: string;
  totalKey: string | null;
}> = {
  users: { path: '/admin/users', listKey: 'users', totalKey: 'total' },
  circles: { path: '/admin/circles/health', listKey: 'circles', totalKey: null },
  alerts: { path: '/admin/alerts', listKey: 'alerts', totalKey: null },
  whitelist: { path: '/admin/whitelist', listKey: 'entries', totalKey: null },
  invites: { path: '/admin/invites', listKey: 'invites', totalKey: null },
  audits: { path: '/admin/audits', listKey: 'audits', totalKey: null },
  feedback: { path: '/admin/feedback', listKey: 'feedback', totalKey: null },
  'tester-alerts': { path: '/admin/tester-alerts', listKey: 'alerts', totalKey: null },
};

export const dataProvider: DataProvider = {
  getApiUrl: () => apiClient.defaults.baseURL ?? '/api',

  getList: async ({ resource, pagination, filters }) => {
    const mapping = RESOURCE_MAP[resource];
    if (!mapping) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    const params: Record<string, string | number> = {};

    // Pagination — the users endpoint uses page/perPage; others don't paginate server-side yet
    if (pagination) {
      const { currentPage = 1, pageSize = 50 } = pagination;
      if (resource === 'users') {
        params.page = currentPage;
        params.perPage = pageSize;
      }
    }

    // Forward filters as query params
    if (filters) {
      for (const filter of filters) {
        if ('field' in filter && filter.value !== undefined && filter.value !== '') {
          params[filter.field] = String(filter.value);
        }
      }
    }

    const { data: responseData } = await apiClient.get(mapping.path, { params });

    const list = (responseData as Record<string, unknown>)[mapping.listKey];
    const items = Array.isArray(list) ? list : [];

    const total = mapping.totalKey
      ? (responseData as Record<string, unknown>)[mapping.totalKey] as number
      : items.length;

    return { data: items, total };
  },

  getOne: async ({ resource, id }) => {
    let path: string;
    switch (resource) {
      case 'users':
        path = `/admin/users/${id}`;
        break;
      case 'circles':
        path = `/admin/circles/${id}`;
        break;
      default:
        path = `/admin/${resource}/${id}`;
    }

    const { data } = await apiClient.get(path);
    return { data };
  },

  create: async ({ resource, variables }) => {
    const mapping = RESOURCE_MAP[resource];
    const path = mapping?.path ?? `/admin/${resource}`;
    const { data } = await apiClient.post(path, variables);
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const path = `/admin/${resource}/${id}`;
    const { data } = await apiClient.patch(path, variables);
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    const path = `/admin/${resource}/${id}`;
    const { data } = await apiClient.delete(path);
    return { data };
  },

  custom: async ({ url, method = 'get', payload, headers }) => {
    const { data } = await apiClient.request({
      url,
      method,
      data: payload,
      headers: headers as Record<string, string>,
    });
    return { data };
  },
};
