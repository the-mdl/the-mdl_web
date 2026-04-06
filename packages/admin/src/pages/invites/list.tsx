import { useList } from '@refinedev/core';
import { Table, Typography, Space, Card, Input, Button, Form, App } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { apiClient } from '../../providers/api-client';

const { Title } = Typography;
const { TextArea } = Input;

interface WhitelistEntry {
  email: string;
  added_at: string;
  notes: string | null;
}

interface InviteRow {
  id: string;
  email: string;
  code: string;
  created_at: string;
  created_by: string | null;
}

export const InviteListPage = () => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [adding, setAdding] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [resendingCode, setResendingCode] = useState<string | null>(null);
  const [inviteForm] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const { result: whitelistResult, query: whitelistQuery } = useList<WhitelistEntry>({
    resource: 'whitelist',
  });
  const whitelistData = whitelistResult;
  const whitelistLoading = whitelistQuery.isLoading;
  const refetchWhitelist = whitelistQuery.refetch;

  const { result: inviteResult, query: inviteQuery } = useList<InviteRow>({
    resource: 'invites',
  });
  const inviteData = inviteResult;
  const inviteLoading = inviteQuery.isLoading;
  const refetchInvites = inviteQuery.refetch;

  const handleAddWhitelist = async (values: { email: string; notes?: string }) => {
    setAdding(true);
    try {
      await apiClient.post('/admin/whitelist', values);
      messageApi.success('Added to whitelist');
      form.resetFields();
      refetchWhitelist();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message ?? 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const handleSendInvite = async (values: { email: string }) => {
    setSendingInvite(true);
    try {
      const res = await apiClient.post('/admin/invites', { email: values.email });
      const link = res.data?.invite?.code ? `Invite code: ${res.data.invite.code}` : 'Invite sent';
      messageApi.success(link);
      inviteForm.resetFields();
      refetchInvites();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message ?? 'Failed to send invite');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleResend = async (code: string) => {
    setResendingCode(code);
    try {
      const res = await apiClient.post(`/admin/invites/${code}/resend`);
      messageApi.success(`Invite re-sent to ${res.data?.email ?? 'recipient'}`);
    } catch (err: any) {
      messageApi.error(err.response?.data?.message ?? 'Failed to resend invite');
    } finally {
      setResendingCode(null);
    }
  };

  const handleBulkInvite = async (values: { emails: string }) => {
    const emails = values.emails
      .split('\n')
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0);
    if (emails.length === 0) {
      messageApi.warning('No valid emails provided');
      return;
    }
    setSendingBulk(true);
    try {
      const res = await apiClient.post('/admin/invites/bulk', { emails });
      const count = res.data?.invites?.length ?? emails.length;
      messageApi.success(`${count} invite(s) created`);
      bulkForm.resetFields();
      refetchInvites();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message ?? 'Bulk invite failed');
    } finally {
      setSendingBulk(false);
    }
  };

  const whitelistColumns: ColumnsType<WhitelistEntry> = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Added',
      dataIndex: 'added_at',
      key: 'added_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (v) => v ?? '—' },
  ];

  const inviteColumns: ColumnsType<InviteRow> = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: InviteRow) => (
        <Button
          size="small"
          loading={resendingCode === record.code}
          onClick={() => handleResend(record.code)}
        >
          Resend
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3}>Invites &amp; Whitelist</Title>

        <Card title="Whitelist">
          <Form form={form} layout="inline" onFinish={handleAddWhitelist} style={{ marginBottom: 16 }}>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
              <Input placeholder="Email address" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item name="notes">
              <TextArea placeholder="Notes (optional)" rows={1} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={adding}>Add</Button>
            </Form.Item>
          </Form>
          <Table<WhitelistEntry>
            dataSource={whitelistData?.data ?? []}
            columns={whitelistColumns}
            rowKey="email"
            loading={whitelistLoading}
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Send Beta Invite">
          <Form form={inviteForm} layout="inline" onFinish={handleSendInvite} style={{ marginBottom: 8 }}>
            <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
              <Input placeholder="Email address" style={{ width: 280 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={sendingInvite}>Send Invite</Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Bulk Invite">
          <Form form={bulkForm} onFinish={handleBulkInvite}>
            <Form.Item name="emails" rules={[{ required: true, message: 'Enter at least one email' }]}>
              <TextArea rows={4} placeholder="One email per line" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={sendingBulk}>Send Bulk Invites</Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Invites">
          <Table<InviteRow>
            dataSource={inviteData?.data ?? []}
            columns={inviteColumns}
            rowKey="id"
            loading={inviteLoading}
            pagination={{
              total: inviteData?.total ?? 0,
              showTotal: (total) => `${total} invites`,
            }}
            size="small"
          />
        </Card>
      </Space>
    </div>
  );
};
