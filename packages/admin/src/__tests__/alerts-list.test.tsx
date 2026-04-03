import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const { mockGet, mockPatch } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
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
    patch: mockPatch,
    delete: vi.fn(),
    request: vi.fn(),
  },
}));

import { Refine } from '@refinedev/core';
import { BrowserRouter } from 'react-router';
import { App as AntdApp } from 'antd';
import { dataProvider } from '../providers/data-provider';
import { AlertListPage } from '../pages/alerts/list';
import type { ReactNode } from 'react';

const Wrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>
    <AntdApp>
      <Refine
        dataProvider={dataProvider}
        resources={[{ name: 'alerts', list: '/alerts' }]}
        options={{ disableTelemetry: true }}
      >
        {children}
      </Refine>
    </AntdApp>
  </BrowserRouter>
);

const mockAlerts = [
  {
    id: 'a1',
    alert_type: 'safety_violation',
    severity: 'critical',
    description: 'Harmful content detected',
    circle_id: 'c1',
    resolved: false,
    resolved_at: null,
    resolution_notes: null,
    created_at: '2026-03-20T10:00:00Z',
  },
  {
    id: 'a2',
    alert_type: 'unusual_pattern',
    severity: 'medium',
    description: 'Unusual message frequency',
    circle_id: 'c2',
    resolved: false,
    resolved_at: null,
    resolution_notes: null,
    created_at: '2026-03-19T08:00:00Z',
  },
];

describe('AlertListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({
      data: { alerts: mockAlerts },
    });
    mockPatch.mockResolvedValue({ data: { success: true } });
  });

  it('renders alerts with severity tags', async () => {
    render(<AlertListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Harmful content detected')).toBeInTheDocument();
    });

    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('Unusual message frequency')).toBeInTheDocument();
  });

  it('shows resolve button for open alerts', async () => {
    render(<AlertListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Harmful content detected')).toBeInTheDocument();
    });

    const resolveButtons = screen.getAllByText('Resolve');
    expect(resolveButtons.length).toBe(2);
  });

  it('opens resolve modal when clicking Resolve', async () => {
    render(<AlertListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Harmful content detected')).toBeInTheDocument();
    });

    const resolveButtons = screen.getAllByText('Resolve');
    fireEvent.click(resolveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Resolve Alert')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Describe how this alert was resolved...')).toBeInTheDocument();
  });

  it('calls PATCH endpoint when resolving an alert', async () => {
    render(<AlertListPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('Harmful content detected')).toBeInTheDocument();
    });

    const resolveButtons = screen.getAllByText('Resolve');
    fireEvent.click(resolveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Resolve Alert')).toBeInTheDocument();
    });

    const notesInput = screen.getByPlaceholderText('Describe how this alert was resolved...');
    fireEvent.change(notesInput, { target: { value: 'Reviewed and cleared' } });

    // Click the OK button in the modal footer (has okText="Resolve")
    const modalFooter = document.querySelector('.ant-modal-footer');
    const okBtn = modalFooter?.querySelector('.ant-btn-primary') as HTMLElement;
    expect(okBtn).toBeTruthy();
    fireEvent.click(okBtn);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        '/admin/alerts/a1/resolve',
        { resolutionNotes: 'Reviewed and cleared' },
      );
    });
  });
});
