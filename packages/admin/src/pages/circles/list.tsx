import { useList } from '@refinedev/core';
import { Table, Tag, Typography, Space } from 'antd';
import { Link } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;

interface CircleRow {
  id: string;
  name: string;
  archetype: string;
  member_count: number;
  message_count: number;
  last_active: string | null;
  created_at: string;
}

const archetypeColors: Record<string, string> = {
  balanced: 'blue',
  nurturing: 'green',
  direct: 'orange',
  analytical: 'purple',
};

export const CircleListPage = () => {
  const { result, query } = useList<CircleRow>({
    resource: 'circles',
  });
  const data = result;
  const isLoading = query.isLoading;

  const columns: ColumnsType<CircleRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Link to={`/circles/${record.id}`}>{name}</Link>
      ),
    },
    {
      title: 'Archetype',
      dataIndex: 'archetype',
      key: 'archetype',
      render: (val: string) => (
        <Tag color={archetypeColors[val] ?? 'default'}>{val}</Tag>
      ),
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      sorter: (a, b) => a.member_count - b.member_count,
    },
    {
      title: 'Messages',
      dataIndex: 'message_count',
      key: 'message_count',
      sorter: (a, b) => a.message_count - b.message_count,
    },
    {
      title: 'Last Active',
      dataIndex: 'last_active',
      key: 'last_active',
      render: (val: string | null) =>
        val ? dayjs(val).format('YYYY-MM-DD HH:mm') : 'Never',
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={3}>Circles</Title>
        <Table<CircleRow>
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} circles`,
          }}
        />
      </Space>
    </div>
  );
};
