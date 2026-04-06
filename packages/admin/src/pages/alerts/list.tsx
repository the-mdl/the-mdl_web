import { useList } from '@refinedev/core';
import {
  Table, Tag, Typography, Space, Select, Radio, Button, Modal, Input, App,
  Tabs, Form, DatePicker, Card, Popconfirm,
} from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { apiClient } from '../../providers/api-client';

const { Title } = Typography;
const { TextArea } = Input;

/* ─── Safety Alerts ─────────────────────────────────────────────────────────── */

interface AlertRow {
  id: string;
  alert_type: string;
  severity: string;
  description: string;
  circle_id: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

const severityColors: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'blue',
  info: 'default',
};

const SafetyAlertsTab = () => {
  const { message: messageApi } = App.useApp();
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const [resolved, setResolved] = useState<string>('false');
  const [resolveModal, setResolveModal] = useState<{ open: boolean; alertId: string | null }>({ open: false, alertId: null });
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const filters = [
    { field: 'resolved', operator: 'eq' as const, value: resolved },
    ...(severity ? [{ field: 'severity', operator: 'eq' as const, value: severity }] : []),
  ];

  const { result, query } = useList<AlertRow>({
    resource: 'alerts',
    filters,
  });
  const data = result;
  const isLoading = query.isLoading;
  const refetch = query.refetch;

  const handleResolve = async () => {
    if (!resolveModal.alertId) return;
    setResolving(true);
    try {
      await apiClient.patch(`/admin/alerts/${resolveModal.alertId}/resolve`, {
        resolutionNotes,
      });
      messageApi.success('Alert resolved');
      setResolveModal({ open: false, alertId: null });
      setResolutionNotes('');
      refetch();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message ?? 'Failed to resolve alert');
    } finally {
      setResolving(false);
    }
  };

  const columns: ColumnsType<AlertRow> = [
    {
      title: 'Type',
      dataIndex: 'alert_type',
      key: 'alert_type',
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (val: string) => (
        <Tag color={severityColors[val] ?? 'default'}>{val}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Resolved',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (val: boolean) =>
        val ? <Tag color="green">Resolved</Tag> : <Tag color="orange">Open</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: AlertRow) =>
        !record.resolved ? (
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setResolveModal({ open: true, alertId: record.id });
              setResolutionNotes('');
            }}
          >
            Resolve
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Radio.Group value={resolved} onChange={(e) => setResolved(e.target.value)}>
            <Radio.Button value="false">Open</Radio.Button>
            <Radio.Button value="true">Resolved</Radio.Button>
          </Radio.Group>
          <Select
            placeholder="Filter by severity"
            allowClear
            value={severity}
            onChange={setSeverity}
            style={{ width: 160 }}
            options={[
              { label: 'Critical', value: 'critical' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ]}
          />
        </Space>
        <Table<AlertRow>
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} alerts`,
          }}
        />
      </Space>
      <Modal
        title="Resolve Alert"
        open={resolveModal.open}
        onOk={handleResolve}
        onCancel={() => { setResolveModal({ open: false, alertId: null }); setResolutionNotes(''); }}
        confirmLoading={resolving}
        okText="Resolve"
      >
        <p>Provide resolution notes:</p>
        <TextArea
          rows={4}
          value={resolutionNotes}
          onChange={(e) => setResolutionNotes(e.target.value)}
          placeholder="Describe how this alert was resolved..."
        />
      </Modal>
    </>
  );
};

/* ─── Tester Alerts ─────────────────────────────────────────────────────────── */

interface TesterAlertRow {
  id: string;
  title: string;
  message: string;
  status: 'active' | 'expired';
  created_at: string;
  expires_at: string | null;
  dismiss_count: number;
}

const TesterAlertsTab = () => {
  const { message: messageApi } = App.useApp();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const filters = statusFilter
    ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }]
    : [];

  const { result, query } = useList<TesterAlertRow>({
    resource: 'tester-alerts',
    filters,
  });
  const data = result;
  const isLoading = query.isLoading;
  const refetch = query.refetch;

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await apiClient.post('/admin/tester-alerts', {
        title: values.title,
        message: values.message,
        ...(values.expiresAt ? { expiresAt: values.expiresAt.toISOString() } : {}),
      });
      messageApi.success('Tester alert created');
      form.resetFields();
      setCreateOpen(false);
      refetch();
    } catch (err: any) {
      if (err?.errorFields) return;
      messageApi.error(err.response?.data?.message ?? 'Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const handleExpire = async (id: string) => {
    try {
      await apiClient.patch(`/admin/tester-alerts/${id}/expire`);
      messageApi.success('Alert expired');
      refetch();
    } catch (err: any) {
      messageApi.error(err.response?.data?.message ?? 'Failed to expire alert');
    }
  };

  const columns: ColumnsType<TesterAlertRow> = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) =>
        val === 'active'
          ? <Tag color="green">Active</Tag>
          : <Tag color="default">Expired</Tag>,
    },
    {
      title: 'Dismissals',
      dataIndex: 'dismiss_count',
      key: 'dismiss_count',
      render: (val: number) => val ?? 0,
    },
    {
      title: 'Expires',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (val: string | null) =>
        val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TesterAlertRow) =>
        record.status === 'active' ? (
          <Popconfirm
            title="Expire this alert?"
            description="Users will no longer see it."
            onConfirm={() => handleExpire(record.id)}
            okText="Expire"
          >
            <Button size="small" danger>Expire</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Select
            placeholder="Filter by status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Expired', value: 'expired' },
            ]}
          />
          <Button type="primary" onClick={() => setCreateOpen(true)}>
            Create Alert
          </Button>
        </Space>
        <Table<TesterAlertRow>
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} alerts`,
          }}
        />
      </Space>
      <Modal
        title="Create Tester Alert"
        open={createOpen}
        onOk={handleCreate}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="Maintenance window tonight" />
          </Form.Item>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Message is required' }]}
          >
            <TextArea rows={3} placeholder="We'll be doing maintenance from 10pm–12am. The app may be unavailable." />
          </Form.Item>
          <Form.Item
            name="expiresAt"
            label="Expires at (optional)"
            extra="Alert automatically expires at this time. Leave blank for manual expiration."
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────────── */

export const AlertListPage = () => {
  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={3}>Alerts</Title>
        <Tabs
          defaultActiveKey="safety"
          items={[
            {
              key: 'safety',
              label: 'Safety Alerts',
              children: <SafetyAlertsTab />,
            },
            {
              key: 'tester',
              label: 'Tester Alerts',
              children: <TesterAlertsTab />,
            },
          ]}
        />
      </Space>
    </div>
  );
};
