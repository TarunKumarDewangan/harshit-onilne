import { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button, Table, Badge } from 'react-bootstrap';
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
  const [upcomingExpiries, setUpcomingExpiries] = useState([]);
  const [upcomingLoading, setUpcomingLoading] = useState(true);

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

  useEffect(() => {
    const fetchUpcomingExpiries = async () => {
      setUpcomingLoading(true);
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const { data } = await api.get('/reports/expiries', {
          params: { start_date: todayStr, per_page: 10, page: 1 },
        });
        setUpcomingExpiries(Array.isArray(data.data) ? data.data : []);
      } catch (e) {
        // Non-critical widget; fail silently.
      } finally {
        setUpcomingLoading(false);
      }
    };
    if (user && isAdminOrManager) fetchUpcomingExpiries();
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
                // --- START OF THE FIX ---
                // Changed link from /citizens to /ll-registry
                link="/ll-registry"
                // --- END OF THE FIX ---
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

      <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
        <h5 className="text-muted mb-0">Nearest Upcoming Expiries</h5>
        <Link to="/reports/expiries" className="small fw-bold text-decoration-none">View Full Report &rarr;</Link>
      </div>
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover size="sm" className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Mobile</th>
                  <th>Doc. Type</th>
                  <th>Identifier / No.</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {upcomingLoading && (
                  <tr><td colSpan={5} className="text-center py-3"><Spinner size="sm" /></td></tr>
                )}
                {!upcomingLoading && upcomingExpiries.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-3 text-muted">No upcoming expiries found.</td></tr>
                )}
                {!upcomingLoading && upcomingExpiries.map((item) => (
                  <tr key={`${item.type}-${item.record_id}`}>
                    <td>
                      {item.citizen_id ? (
                        <Link to={`/citizens/${item.citizen_id}`}>{item.owner_name || 'N/A'}</Link>
                      ) : (item.owner_name || 'N/A')}
                    </td>
                    <td>{item.owner_mobile || '-'}</td>
                    <td><Badge bg={item.type === 'Insurance' ? 'success' : 'warning'} text="dark">{item.type || 'N/A'}</Badge></td>
                    <td>{item.identifier || 'N/A'}</td>
                    <td>{item.expiry_date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
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
