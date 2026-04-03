import { useState, useEffect } from 'react';
import { Table, Typography, Space, Statistic, Card, Row, Col, Segmented } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../providers/api-client';

const { Title } = Typography;

interface CostRow {
  model: string;
  request_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost: number;
}

interface CostSummaryResponse {
  summary: CostRow[];
  days: number;
}

export const CostPage = () => {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<CostSummaryResponse>('/admin/cost-summary', { params: { days } })
      .then((res) => setData(res.data.summary ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [days]);

  const totals = data.reduce(
    (acc, row) => ({
      requests: acc.requests + row.request_count,
      cost: acc.cost + row.estimated_cost,
    }),
    { requests: 0, cost: 0 },
  );

  const columns: ColumnsType<CostRow> = [
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Requests', dataIndex: 'request_count', key: 'request_count' },
    { title: 'Input Tokens', dataIndex: 'total_input_tokens', key: 'total_input_tokens' },
    { title: 'Output Tokens', dataIndex: 'total_output_tokens', key: 'total_output_tokens' },
    {
      title: 'Est. Cost',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (val: number) => `$${val.toFixed(4)}`,
    },
  ];

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={3}>Cost Summary</Title>

        <Segmented
          options={[
            { label: '7 days', value: 7 },
            { label: '30 days', value: 30 },
            { label: '90 days', value: 90 },
          ]}
          value={days}
          onChange={(val) => setDays(val as number)}
        />

        <Row gutter={16}>
          <Col span={12}>
            <Card><Statistic title="Total Requests" value={totals.requests} /></Card>
          </Col>
          <Col span={12}>
            <Card><Statistic title="Total Cost" value={`$${totals.cost.toFixed(4)}`} /></Card>
          </Col>
        </Row>

        <Table<CostRow>
          dataSource={data}
          columns={columns}
          rowKey="model"
          loading={loading}
          pagination={false}
        />
      </Space>
    </div>
  );
};
