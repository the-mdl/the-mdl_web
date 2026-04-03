import { Refine, Authenticated } from '@refinedev/core';
import routerProvider, { NavigateToResource } from '@refinedev/react-router';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router';
import { ConfigProvider, App as AntdApp } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  AlertOutlined,
  DollarOutlined,
  MailOutlined,
} from '@ant-design/icons';

import { authProvider } from './providers/auth-provider';
import { dataProvider } from './providers/data-provider';
import { AdminLayout } from './components/layout';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';
import { UserListPage } from './pages/users/list';
import { UserShowPage } from './pages/users/show';
import { CircleListPage } from './pages/circles/list';
import { CircleShowPage } from './pages/circles/show';
import { AlertListPage } from './pages/alerts/list';
import { CostPage } from './pages/cost/index';
import { InviteListPage } from './pages/invites/list';

import 'antd/dist/reset.css';

export default function App() {
  return (
    <BrowserRouter basename="/">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#6366f1',
          },
        }}
      >
        <AntdApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            routerProvider={routerProvider}
            resources={[
              {
                name: 'dashboard',
                list: '/',
                meta: { label: 'Dashboard', icon: <DashboardOutlined /> },
              },
              {
                name: 'users',
                list: '/users',
                show: '/users/:id',
                meta: { label: 'Users', icon: <UserOutlined /> },
              },
              {
                name: 'circles',
                list: '/circles',
                show: '/circles/:id',
                meta: { label: 'Circles', icon: <TeamOutlined /> },
              },
              {
                name: 'alerts',
                list: '/alerts',
                meta: { label: 'Alerts', icon: <AlertOutlined /> },
              },
              {
                name: 'cost',
                list: '/cost',
                meta: { label: 'Cost', icon: <DollarOutlined /> },
              },
              {
                name: 'invites',
                list: '/invites',
                meta: { label: 'Invites', icon: <MailOutlined /> },
              },
            ]}
            options={{ syncWithLocation: true, disableTelemetry: true }}
          >
            <Routes>
              {/* Unauthenticated — login */}
              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Authenticated — layout */}
              <Route
                element={
                  <Authenticated key="authenticated-routes" redirectOnFail="/login">
                    <AdminLayout />
                  </Authenticated>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="/users" element={<UserListPage />} />
                <Route path="/users/:id" element={<UserShowPage />} />
                <Route path="/circles" element={<CircleListPage />} />
                <Route path="/circles/:id" element={<CircleShowPage />} />
                <Route path="/alerts" element={<AlertListPage />} />
                <Route path="/cost" element={<CostPage />} />
                <Route path="/invites" element={<InviteListPage />} />
              </Route>
            </Routes>
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}
