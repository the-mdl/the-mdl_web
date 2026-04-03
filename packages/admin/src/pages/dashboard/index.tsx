import { useCustom } from '@refinedev/core';
import { Row, Col, Card, Statistic, Typography, Spin, Alert } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  AlertOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

interface DashboardStats {
  total_circles: number;
  total_audits: number;
  total_alerts: number;
  unresolved_alerts: number;
  recent_audits: Array<Record<string, unknown>>;
}

export const DashboardPage = () => {
  const { result, query } = useCustom<DashboardStats>({
    url: '/admin/dashboard',
    method: 'get',
  });
  const data = result?.data ? { data: result.data } : undefined;
  const isLoading = query.isLoading;
  const isError = query.isError;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <Alert
        type="error"
        message="Failed to load dashboard"
        description="Could not fetch dashboard stats from the API."
        showIcon
      />
    );
  }

  const stats = data.data;

  return (
    <div>
      <Title level={3}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Circles"
              value={stats.total_circles ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Audits"
              value={stats.total_audits ?? 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Alerts"
              value={stats.total_alerts ?? 0}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Unresolved Alerts"
              value={stats.unresolved_alerts ?? 0}
              prefix={<UserOutlined />}
              valueStyle={
                (stats.unresolved_alerts ?? 0) > 0
                  ? { color: '#cf1322' }
                  : undefined
              }
            />
          </Card>
        </Col>
      </Row>

      {stats.recent_audits && stats.recent_audits.length > 0 && (
        <Card title="Recent Audits" style={{ marginTop: 24 }}>
          <ul>
            {stats.recent_audits.slice(0, 5).map((audit: Record<string, unknown>, i: number) => (
              <li key={i}>
                {String(audit.audit_type ?? 'unknown')} —{' '}
                <strong>{String(audit.severity ?? 'n/a')}</strong>{' '}
                ({new Date(audit.created_at as string).toLocaleDateString()})
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
