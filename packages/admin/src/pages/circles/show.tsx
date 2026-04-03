import { useCustom } from '@refinedev/core';
import { useParams } from 'react-router';
import { Descriptions, Table, Statistic, Card, Row, Col, Typography, Spin, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;

interface CircleMember {
  user_id: string;
  display_name: string | null;
  personality_blend: Record<string, unknown> | null;
  role: string;
}

interface CircleDetail {
  circle: {
    id: string;
    name: string;
    personality_config: Record<string, unknown> | null;
    created_at: string;
  };
  members: CircleMember[];
  behavioral_rules_count: number;
  message_stats: {
    total: number;
    last_message_at: string | null;
    avg_per_day: number;
  };
  actors: Array<{ id: string; name: string; archetype: string }>;
}

export const CircleShowPage = () => {
  const { id } = useParams<{ id: string }>();

  const { result, query } = useCustom<CircleDetail>({
    url: `/admin/circles/${id}`,
    method: 'get',
  });
  const isLoading = query.isLoading;

  if (isLoading) return <Spin size="large" />;

  const detail = result?.data;
  if (!detail) return <div>Circle not found</div>;

  const { circle, members, behavioral_rules_count, message_stats } = detail;
  const archetype = (circle.personality_config as any)?.archetype ?? 'balanced';

  const memberColumns: ColumnsType<CircleMember> = [
    { title: 'User ID', dataIndex: 'user_id', key: 'user_id', ellipsis: true },
    { title: 'Display Name', dataIndex: 'display_name', key: 'display_name', render: (v) => v ?? '—' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (v) => <Tag>{v}</Tag> },
  ];

  return (
    <div>
      <Title level={3}>{circle.name}</Title>

      <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="ID">{circle.id}</Descriptions.Item>
        <Descriptions.Item label="Archetype">{archetype}</Descriptions.Item>
        <Descriptions.Item label="Created">{circle.created_at}</Descriptions.Item>
        <Descriptions.Item label="Behavioral Rules">{behavioral_rules_count}</Descriptions.Item>
      </Descriptions>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Messages" value={message_stats.total} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Avg/Day" value={message_stats.avg_per_day} precision={2} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Last Message" value={message_stats.last_message_at ?? 'Never'} /></Card>
        </Col>
      </Row>

      <Title level={4}>Members ({members.length})</Title>
      <Table<CircleMember>
        dataSource={members}
        columns={memberColumns}
        rowKey="user_id"
        pagination={false}
        style={{ marginBottom: 24 }}
      />
    </div>
  );
};
