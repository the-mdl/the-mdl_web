import { useCustom } from '@refinedev/core';
import {
  Typography,
  Descriptions,
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Spin,
  Alert,
  Tag,
  App,
} from 'antd';
import {
  StopOutlined,
  CheckCircleOutlined,
  LockOutlined,
  MessageOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useParams, Link } from 'react-router';
import { apiClient } from '../../providers/api-client';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface UserDetail {
  user: {
    id: string;
    email: string | null;
    display_name: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    is_banned: boolean;
    banned_until: string | null;
    disclaimer_accepted_at: string | null;
  };
  circles: Array<{
    circle_id: string;
    role: string;
    joined_at: string;
    circles: { id: string; name: string; created_at: string };
  }>;
  stats: {
    message_count: number;
    circle_count: number;
  };
}

export const UserShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const { message } = App.useApp();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { result, query } = useCustom<UserDetail>({
    url: `/admin/users/${id}`,
    method: 'get',
    queryOptions: { enabled: !!id },
  });
  const data = result?.data ? { data: result.data } : undefined;
  const isLoading = query.isLoading;
  const isError = query.isError;
  const refetch = query.refetch;

  const handleToggleBan = async () => {
    if (!data?.data?.user) return;
    const shouldBan = !data.data.user.is_banned;
    setActionLoading('ban');
    try {
      await apiClient.post(`/admin/users/${id}/toggle-ban`, { ban: shouldBan });
      message.success(shouldBan ? 'User banned' : 'User unbanned');
      refetch();
    } catch (err) {
      message.error('Failed to toggle ban status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    setActionLoading('reset');
    try {
      const { data: result } = await apiClient.post(`/admin/users/${id}/reset-password`);
      message.success(`Password reset email sent to ${result.email}`);
    } catch (err) {
      message.error('Failed to send password reset email');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <Alert
        type="error"
        message="Failed to load user"
        description="Could not fetch user details from the API."
        showIcon
      />
    );
  }

  const { user, circles, stats } = data.data;

  const circleColumns: ColumnsType<UserDetail['circles'][number]> = [
    {
      title: 'Circle',
      key: 'name',
      render: (_, record) => (
        <Link to={`/circles/${record.circle_id}`}>
          {record.circles?.name ?? record.circle_id}
        </Link>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Joined',
      dataIndex: 'joined_at',
      key: 'joined_at',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '—'),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Space>
          <Link to="/users">
            <Button icon={<ArrowLeftOutlined />}>Back to Users</Button>
          </Link>
        </Space>

        <Title level={3}>
          {user.display_name ?? user.email ?? 'Unknown User'}
          {user.is_banned && (
            <Tag color="red" style={{ marginLeft: 12, verticalAlign: 'middle' }}>
              Banned
            </Tag>
          )}
        </Title>

        {/* Stats */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Messages"
                value={stats.message_count}
                prefix={<MessageOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Circles"
                value={stats.circle_count}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* User Info */}
        <Card title="User Information">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Display Name">
              {user.display_name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(user.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Last Sign In">
              {user.last_sign_in_at
                ? dayjs(user.last_sign_in_at).format('YYYY-MM-DD HH:mm')
                : 'Never'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {user.is_banned ? (
                <Tag color="red">
                  Banned until{' '}
                  {user.banned_until
                    ? dayjs(user.banned_until).format('YYYY-MM-DD')
                    : 'indefinitely'}
                </Tag>
              ) : (
                <Tag color="green">Active</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Disclaimer Accepted">
              {user.disclaimer_accepted_at
                ? dayjs(user.disclaimer_accepted_at).format('YYYY-MM-DD HH:mm')
                : 'No'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Actions */}
        <Space>
          <Button
            danger={!user.is_banned}
            type={user.is_banned ? 'default' : 'primary'}
            icon={user.is_banned ? <CheckCircleOutlined /> : <StopOutlined />}
            loading={actionLoading === 'ban'}
            onClick={handleToggleBan}
          >
            {user.is_banned ? 'Unban User' : 'Ban User'}
          </Button>
          <Button
            icon={<LockOutlined />}
            loading={actionLoading === 'reset'}
            onClick={handleResetPassword}
          >
            Reset Password
          </Button>
        </Space>

        {/* Circle Memberships */}
        <Card title="Circle Memberships">
          <Table
            dataSource={circles}
            columns={circleColumns}
            rowKey="circle_id"
            pagination={false}
            locale={{ emptyText: 'No circle memberships' }}
          />
        </Card>
      </Space>
    </div>
  );
};
