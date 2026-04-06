import { useState, useEffect } from 'react';
import { Table, Typography, Space, Statistic, Card, Row, Col, Segmented, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '../../providers/api-client';

const { Title } = Typography;

/** Row returned by the get_cost_summary PG function — one row per (day, model, provider) */
interface CostRawRow {
  day: string;
  model: string;
  provider: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_creation_tokens: number;
  total_cache_read_tokens: number;
  request_count: number;
}

interface ModelPricing {
  input_per_mtok: number;
  output_per_mtok: number;
  cache_creation_per_mtok: number;
  cache_read_per_mtok: number;
}

interface CostSummaryResponse {
  summary: CostRawRow[];
  pricing: Record<string, ModelPricing>;
  days: number;
  error?: string;
}

/** Aggregated row for display — one per model across the entire window */
interface AggregatedRow {
  model: string;
  provider: string;
  request_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cache_creation_tokens: number;
  total_cache_read_tokens: number;
  estimated_cost: number;
}

function computeCost(row: CostRawRow, pricing?: ModelPricing): number {
  if (!pricing) return 0;
  const MTOK = 1_000_000;
  return (
    (row.total_input_tokens / MTOK) * pricing.input_per_mtok +
    (row.total_output_tokens / MTOK) * pricing.output_per_mtok +
    (row.total_cache_creation_tokens / MTOK) * pricing.cache_creation_per_mtok +
    (row.total_cache_read_tokens / MTOK) * pricing.cache_read_per_mtok
  );
}

function aggregate(summary: CostRawRow[], pricing: Record<string, ModelPricing>): AggregatedRow[] {
  const byModel = new Map<string, AggregatedRow>();

  for (const row of summary) {
    const key = row.model;
    const existing = byModel.get(key);
    const cost = computeCost(row, pricing[row.model]);

    if (existing) {
      existing.request_count += row.request_count;
      existing.total_input_tokens += row.total_input_tokens;
      existing.total_output_tokens += row.total_output_tokens;
      existing.total_cache_creation_tokens += row.total_cache_creation_tokens;
      existing.total_cache_read_tokens += row.total_cache_read_tokens;
      existing.estimated_cost += cost;
    } else {
      byModel.set(key, {
        model: row.model,
        provider: row.provider,
        request_count: row.request_count,
        total_input_tokens: row.total_input_tokens,
        total_output_tokens: row.total_output_tokens,
        total_cache_creation_tokens: row.total_cache_creation_tokens,
        total_cache_read_tokens: row.total_cache_read_tokens,
        estimated_cost: cost,
      });
    }
  }

  return Array.from(byModel.values()).sort((a, b) => b.estimated_cost - a.estimated_cost);
}

export const CostPage = () => {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AggregatedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiClient
      .get<CostSummaryResponse>('/admin/cost-summary', { params: { days } })
      .then((res) => {
        if (res.data.error) {
          setError(res.data.error);
          setData([]);
          return;
        }
        const aggregated = aggregate(res.data.summary ?? [], res.data.pricing ?? {});
        setData(aggregated);
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? 'Failed to load cost summary');
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [days]);

  const totals = data.reduce(
    (acc, row) => ({
      requests: acc.requests + row.request_count,
      inputTokens: acc.inputTokens + row.total_input_tokens,
      outputTokens: acc.outputTokens + row.total_output_tokens,
      cost: acc.cost + row.estimated_cost,
    }),
    { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
  );

  const formatTokens = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const columns: ColumnsType<AggregatedRow> = [
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Provider', dataIndex: 'provider', key: 'provider' },
    {
      title: 'Requests',
      dataIndex: 'request_count',
      key: 'request_count',
      sorter: (a, b) => a.request_count - b.request_count,
    },
    {
      title: 'Input Tokens',
      dataIndex: 'total_input_tokens',
      key: 'total_input_tokens',
      render: (val: number) => formatTokens(val),
    },
    {
      title: 'Output Tokens',
      dataIndex: 'total_output_tokens',
      key: 'total_output_tokens',
      render: (val: number) => formatTokens(val),
    },
    {
      title: 'Cache Read',
      dataIndex: 'total_cache_read_tokens',
      key: 'total_cache_read_tokens',
      render: (val: number) => formatTokens(val),
    },
    {
      title: 'Est. Cost',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (val: number) => `$${val.toFixed(4)}`,
      sorter: (a, b) => a.estimated_cost - b.estimated_cost,
      defaultSortOrder: 'descend',
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

        {error && <Alert type="error" message={error} showIcon closable />}

        <Row gutter={16}>
          <Col span={6}>
            <Card><Statistic title="Requests" value={totals.requests} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Input Tokens" value={formatTokens(totals.inputTokens)} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Output Tokens" value={formatTokens(totals.outputTokens)} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="Est. Total Cost" value={`$${totals.cost.toFixed(4)}`} /></Card>
          </Col>
        </Row>

        <Table<AggregatedRow>
          dataSource={data}
          columns={columns}
          rowKey="model"
          loading={loading}
          pagination={false}
          locale={{ emptyText: loading ? 'Loading...' : 'No cost data for this period' }}
        />
      </Space>
    </div>
  );
};
