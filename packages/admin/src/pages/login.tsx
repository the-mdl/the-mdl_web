import { useState } from 'react';
import { useLogin } from '@refinedev/core';
import { Form, Input, Button, Card, Typography, Alert, Space } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const LoginPage = () => {
  const { mutate: login, isPending } = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onFinish = (values: { email: string; password: string }) => {
    setError(null);
    login(values, {
      onError: (err) => {
        setError(err?.message ?? 'Login failed');
      },
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 4 }}>
              The MDL Admin
            </Title>
            <Text type="secondary">Sign in to the admin portal</Text>
          </div>

          {error && (
            <Alert type="error" message={error} closable onClose={() => setError(null)} />
          )}

          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="admin@the-mdl.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isPending} block size="large">
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};
