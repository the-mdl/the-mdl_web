import { useList } from '@refinedev/core';
import {
  Typography,
  Space,
  Card,
  Form,
  Input,
  Button,
  Radio,
  Select,
  Alert,
  Divider,
  App,
} from 'antd';
import { useState } from 'react';
import { apiClient } from '../../providers/api-client';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
}

type PushMode = 'broadcast' | 'targeted';

export const PushPage = () => {
  const { message: messageApi } = App.useApp();
  const [mode, setMode] = useState<PushMode>('broadcast');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [form] = Form.useForm();

  // Fetch users for the targeted user picker
  const { result: usersResult } = useList<UserRow>({
    resource: 'users',
    pagination: { pageSize: 200 },
  });
  const users = usersResult?.data ?? [];

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      setSending(true);
      setLastResult(null);

      if (mode === 'broadcast') {
        const { data } = await apiClient.post('/admin/push/broadcast', {
          title: values.title,
          body: values.body,
          ...(values.deepLink ? { deepLink: values.deepLink } : {}),
        });
        setLastResult(`Broadcast sent to ${data.sent} device(s), ${data.failed} failed.`);
        messageApi.success(`Broadcast sent to ${data.sent} device(s)`);
      } else {
        const { data } = await apiClient.post('/admin/push/send', {
          userId: values.userId,
          title: values.title,
          body: values.body,
          ...(values.deepLink ? { deepLink: values.deepLink } : {}),
        });
        setLastResult(data.sent ? 'Notification delivered.' : 'User has no registered devices.');
        if (data.sent) {
          messageApi.success('Notification sent');
        } else {
          messageApi.warning('User has no registered devices');
        }
      }

      form.resetFields(['title', 'body', 'deepLink']);
    } catch (err: any) {
      if (err?.errorFields) return; // form validation
      const msg = err.response?.data?.message ?? 'Failed to send notification';
      messageApi.error(msg);
      setLastResult(`Error: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3}>Push Notifications</Title>

        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Radio.Group
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setLastResult(null);
              }}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="broadcast">Broadcast to All</Radio.Button>
              <Radio.Button value="targeted">Send to User</Radio.Button>
            </Radio.Group>

            {mode === 'broadcast' && (
              <Alert
                type="warning"
                showIcon
                message="This sends a push notification to every registered device."
              />
            )}

            <Form form={form} layout="vertical" style={{ maxWidth: 560 }}>
              {mode === 'targeted' && (
                <Form.Item
                  name="userId"
                  label="User"
                  rules={[{ required: true, message: 'Select a user' }]}
                >
                  <Select
                    showSearch
                    placeholder="Search by name or email..."
                    optionFilterProp="label"
                    options={users.map((u) => ({
                      value: u.id,
                      label: `${u.display_name ?? 'No name'} — ${u.email}`,
                    }))}
                  />
                </Form.Item>
              )}

              <Form.Item
                name="title"
                label="Title"
                rules={[
                  { required: true, message: 'Title is required' },
                  { max: 100, message: 'Max 100 characters' },
                ]}
              >
                <Input placeholder="Update available" maxLength={100} />
              </Form.Item>

              <Form.Item
                name="body"
                label="Body"
                rules={[
                  { required: true, message: 'Body is required' },
                  { max: 500, message: 'Max 500 characters' },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder="We've made some improvements you'll love..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <Form.Item
                name="deepLink"
                label="Deep Link (optional)"
                extra={
                  <Text type="secondary">
                    Path the user navigates to on tap, e.g. <code>/circles</code> or{' '}
                    <code>/messages/chat/circle-id</code>
                  </Text>
                }
              >
                <Input placeholder="/circles" maxLength={500} />
              </Form.Item>

              <Divider />

              <Button
                type="primary"
                size="large"
                loading={sending}
                onClick={handleSend}
                danger={mode === 'broadcast'}
              >
                {mode === 'broadcast' ? 'Send Broadcast' : 'Send Notification'}
              </Button>
            </Form>

            {lastResult && (
              <Alert
                type={lastResult.startsWith('Error') ? 'error' : 'success'}
                message={lastResult}
                showIcon
                closable
                onClose={() => setLastResult(null)}
              />
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
};
