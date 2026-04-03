import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('../providers/api-client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
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
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}));

import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { dataProvider } from '../providers/data-provider';
import { CircleListPage } from '../pages/circles/list';
import type { ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      <Refine
        dataProvider={dataProvider}
        resources={[{ name: 'circles', list: '/circles' }]}
        options={{ disableTelemetry: true }}
      >
        {children}
      </Refine>
    </AntdApp>
  </BrowserRouter>
);

const mockCircles = [
  {
    id: 'c1',
    name: 'Family Circle',
    archetype: 'nurturing',
    member_count: 4,
    message_count: 120,
    last_active: '2026-03-20T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    name: 'Work Team',
    archetype: 'direct',
    member_count: 6,
    message_count: 350,
    last_active: null,
    created_at: '2026-02-15T00:00:00Z',
  },
];

describe('CircleListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      data: { circles: mockCircles },
    });
  });

  it('renders circle rows in the table', async () => {
    render(<CircleListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Family Circle')).toBeInTheDocument();
    });

    expect(screen.getByText('Work Team')).toBeInTheDocument();
    expect(screen.getByText('nurturing')).toBeInTheDocument();
    expect(screen.getByText('direct')).toBeInTheDocument();
  });

  it('shows member and message counts', async () => {
    render(<CircleListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Family Circle')).toBeInTheDocument();
    });

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
  });

  it('displays total circles count in pagination', async () => {
    render(<CircleListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('2 circles')).toBeInTheDocument();
    });
  });
});
