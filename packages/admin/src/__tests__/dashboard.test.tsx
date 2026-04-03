import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
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
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: mockRequest,
  },
}));

import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { dataProvider } from '../providers/data-provider';
import { DashboardPage } from '../pages/dashboard';
import type { ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      <Refine
        dataProvider={dataProvider}
        resources={[]}
        options={{ disableTelemetry: true }}
      >
        {children}
      </Refine>
    </AntdApp>
  </BrowserRouter>
);

const mockStats = {
  total_circles: 12,
  total_audits: 45,
  total_alerts: 8,
  unresolved_alerts: 3,
  recent_audits: [],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest.mockResolvedValue({ data: mockStats });
  });

  it('renders all stat cards with correct values', async () => {
    render(<DashboardPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Circles')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Total Audits')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Total Alerts')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Unresolved Alerts')).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    // Delay resolution so spinner is visible
    mockRequest.mockReturnValue(new Promise(() => {}));

    const { container } = render(<DashboardPage />, { wrapper: Wrapper });

    expect(container.querySelector('.ant-spin')).toBeTruthy();
  });
});
