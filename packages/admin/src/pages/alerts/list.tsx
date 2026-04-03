import { useList } from '@refinedev/core';
import { Table, Tag, Typography, Space, Select, Radio, Button, Modal, Input, App } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { apiClient } from '../../providers/api-client';

const { Title } = Typography;
const { TextArea } = Input;

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

export const AlertListPage = () => {
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
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={3}>Alerts</Title>
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
      </Space>
    </div>
  );
};
