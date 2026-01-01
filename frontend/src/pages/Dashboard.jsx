import { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/apiClient';

// Helper component for the new stats
function DashboardCard({ title, value, icon, color, link, desc }) {
    return (
        <Card className={`h-100 border-0 shadow-sm text-white bg-${color}`}>
            <Card.Body className="d-flex flex-column justify-content-between">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h2 className="display-4 fw-bold mb-0">{value}</h2>
                        <h5 className="fw-normal opacity-75">{title}</h5>
                    </div>
                    {icon && <i className={`bi ${icon} fs-1 opacity-50`}></i>}
                </div>
                <div className="mt-3 pt-3 border-top border-white border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center">
                        <small>{desc}</small>
                        {link && (
                            <Link to={link} className="text-white text-decoration-none fw-bold small">
                                View Details &rarr;
                            </Link>
                        )}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdminOrManager = useMemo(() => user && ['admin', 'manager'].includes(user.role), [user]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const endpoint = isAdminOrManager ? '/dashboard/stats' : '/dashboard/user-stats';
        const { data } = await api.get(endpoint);
        if (isAdminOrManager) setAdminStats(data);
        else setUserStats(data);
      } catch (e) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user, isAdminOrManager]);

  const renderAdminDashboard = () => (
    <>
      <h3 className="mb-4 text-secondary">Overview</h3>

      {/* NEW ACTIONABLE ROW */}
      <Row className="g-4 mb-4">
        <Col md={6} lg={6}>
            <DashboardCard
                title="DL Eligible (LL > 31 Days)"
                value={adminStats.ll_eligible_for_dl}
                color="primary"
                icon="bi-card-heading"
                link="/citizens" // Ideally link to a filtered view
                desc="Learner Licenses crossed 30 days period."
            />
        </Col>
        <Col md={6} lg={6}>
            <DashboardCard
                title="Documents Expiring Soon"
                value={adminStats.docs_expiring_soon}
                color="warning"
                icon="bi-exclamation-triangle-fill"
                link="/reports/expiries"
                desc="Tax, Ins, Permit, Fitness, PUCC expiring in next 10 days."
            />
        </Col>
      </Row>

      <h5 className="mb-3 text-muted">Database Stats</h5>
      {/* SECONDARY ROW */}
      <Row className="g-4">
        <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                    <div className="bg-light rounded-circle p-3 me-3 text-primary">
                        <i className="bi bi-people-fill fs-3"></i>
                    </div>
                    <div>
                        <h6 className="text-muted mb-1">Total Citizens</h6>
                        <h3 className="fw-bold mb-0">{adminStats.total_citizens}</h3>
                    </div>
                    <Link to="/citizens" className="ms-auto stretched-link"></Link>
                </Card.Body>
            </Card>
        </Col>
        <Col md={4}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                    <div className="bg-light rounded-circle p-3 me-3 text-secondary">
                        <i className="bi bi-person-badge-fill fs-3"></i>
                    </div>
                    <div>
                        <h6 className="text-muted mb-1">System Users</h6>
                        <h3 className="fw-bold mb-0">{adminStats.total_users}</h3>
                    </div>
                    {user.role === 'admin' && <Link to="/admin/users" className="ms-auto stretched-link"></Link>}
                </Card.Body>
            </Card>
        </Col>
        <Col md={4}>
             <Card className="border-0 shadow-sm h-100 bg-light">
                <Card.Body className="d-flex align-items-center justify-content-center">
                    <Link to="/admin/export" className="btn btn-outline-dark fw-bold">
                        <i className="bi bi-download me-2"></i> Export Data
                    </Link>
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </>
  );

  const renderUserDashboard = () => (
    <>
      <h2 className="mb-4">Welcome, {user?.name}!</h2>
      {!user?.primary_citizen && (
        <Alert variant="warning">
          You haven't created your primary citizen profile yet.
          <Link to="/citizens" className="alert-link ms-1">Create it now</Link>.
        </Alert>
      )}
      {userStats && (
        <Row className="g-3">
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 h-100">
                <Card.Body>
                    <h1 className="text-primary">{userStats.vehicle_count}</h1>
                    <div className="text-muted">My Vehicles</div>
                </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="text-center shadow-sm border-0 h-100">
                <Card.Body>
                    <h1 className="text-success">{userStats.ll_count}</h1>
                    <div className="text-muted">Learner Licenses</div>
                </Card.Body>
            </Card>
          </Col>
           <Col md={4}>
            <Card className="text-center shadow-sm border-0 h-100">
                <Card.Body>
                    <h1 className="text-info">{userStats.dl_count}</h1>
                    <div className="text-muted">Driving Licenses</div>
                </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );

  return (
    <Container className="py-4">
      {loading && <div className="text-center py-5"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && (isAdminOrManager ? renderAdminDashboard() : renderUserDashboard())}
    </Container>
  );
}
