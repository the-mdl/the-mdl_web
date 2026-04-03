import { useList } from '@refinedev/core';
import { Table, Input, Tag, Typography, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title } = Typography;

interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  last_sign_in_at: string | null;
  is_banned: boolean;
  created_at: string;
}

export const UserListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { result, query } = useList<UserRow>({
    resource: 'users',
    pagination: { currentPage: page, pageSize },
    filters: search ? [{ field: 'search', operator: 'eq', value: search }] : [],
  });
  const data = result;
  const isLoading = query.isLoading;

  const columns: ColumnsType<UserRow> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string | null, record) => (
        <Link to={`/users/${record.id}`}>{email ?? '—'}</Link>
      ),
    },
    {
      title: 'Display Name',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (name: string | null) => name ?? '—',
    },
    {
      title: 'Last Sign In',
      dataIndex: 'last_sign_in_at',
      key: 'last_sign_in_at',
      render: (val: string | null) =>
        val ? dayjs(val).format('YYYY-MM-DD HH:mm') : 'Never',
    },
    {
      title: 'Status',
      dataIndex: 'is_banned',
      key: 'is_banned',
      render: (banned: boolean) =>
        banned ? <Tag color="red">Banned</Tag> : <Tag color="green">Active</Tag>,
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
        <Title level={3}>Users</Title>
        <Input
          placeholder="Search by email or name…"
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: 400 }}
        />
        <Table<UserRow>
          dataSource={data?.data ?? []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showSizeChanger: true,
            showTotal: (total) => `${total} users`,
          }}
        />
      </Space>
    </div>
  );
};
