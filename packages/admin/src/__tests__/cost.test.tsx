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

import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { CostPage } from '../pages/cost';
import type { ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      {children}
    </AntdApp>
  </BrowserRouter>
);

const mockCostData = {
  summary: [
    {
      model: 'claude-sonnet-4-20250514',
      request_count: 150,
      total_input_tokens: 50000,
      total_output_tokens: 30000,
      estimated_cost: 1.2345,
    },
    {
      model: 'claude-haiku-3',
      request_count: 80,
      total_input_tokens: 20000,
      total_output_tokens: 10000,
      estimated_cost: 0.0567,
    },
  ],
  days: 30,
};

describe('CostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: mockCostData });
  });

  it('renders stat cards with totals', async () => {
    render(<CostPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Total Requests')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    // Total requests = 150 + 80 = 230
    expect(screen.getByText('230')).toBeInTheDocument();
  });

  it('renders model rows in the table', async () => {
    render(<CostPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('claude-sonnet-4-20250514')).toBeInTheDocument();
    });

    expect(screen.getByText('claude-haiku-3')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('displays estimated costs formatted', async () => {
    render(<CostPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('$1.2345')).toBeInTheDocument();
    });

    expect(screen.getByText('$0.0567')).toBeInTheDocument();
  });
});
