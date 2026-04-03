import { useLogout, useGetIdentity } from '@refinedev/core';
import { Layout as AntLayout, Menu, Button, Typography, Space, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  AlertOutlined,
  DollarOutlined,
  MailOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router';

const { Sider, Header, Content } = AntLayout;
const { Text } = Typography;

interface Identity {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

const NAV_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <UserOutlined />, label: 'Users' },
  { key: '/circles', icon: <TeamOutlined />, label: 'Circles' },
  { key: '/alerts', icon: <AlertOutlined />, label: 'Alerts' },
  { key: '/cost', icon: <DollarOutlined />, label: 'Cost' },
  { key: '/invites', icon: <MailOutlined />, label: 'Invites' },
];

export const AdminLayout = () => {
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<Identity>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="light" breakpoint="lg" collapsedWidth={64}>
        <div style={{ padding: '16px', textAlign: 'center', fontWeight: 700, fontSize: 16 }}>
          The MDL
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: token.colorBgContainer,
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space>
            {identity && (
              <Text type="secondary">
                {identity.name} ({identity.role})
              </Text>
            )}
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => logout()}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: 24, margin: 0 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
