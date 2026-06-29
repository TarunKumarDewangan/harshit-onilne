import { useEffect, useState, useCallback } from 'react';
import { Container, Card, Form, Row, Col, Button, Table, Badge, Spinner, Alert, Pagination, Tabs, Tab } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

export default function WhatsAppLogsPage() {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const fetchLogs = useCallback(async (page = 1, filterDate = date, filterCategory = category) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        date: filterDate,
        category: filterCategory,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      const { data } = await api.get('/whatsapp-logs', { params });

      setLogs(data.data || []);
      setMeta({
        current_page: data.current_page || page,
        last_page: data.last_page || 1,
        per_page: data.per_page || 30,
        total: data.total || 0,
        from: data.from,
        to: data.to,
      });
      setCurrentPage(page);
    } catch (err) {
      console.error('Fetch WhatsApp logs error:', err);
      const msg = err?.response?.data?.message || 'Failed to load WhatsApp logs.';
      setError(msg);
      toast.error(msg);
      setLogs([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [search, date, category]);

  useEffect(() => {
    fetchLogs(1, date, category);
  }, [date, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleReset = () => {
    setDate(getTodayDateString());
    setCategory('all');
    setSearch('');
    fetchLogs(1, getTodayDateString(), 'all');
  };

  const handlePageChange = (pageNum) => {
    if (pageNum < 1 || !meta || pageNum > meta.last_page || pageNum === currentPage || loading) return;
    fetchLogs(pageNum);
  };

  const formatTime = (dateString) => {
    try {
      const dateObj = new Date(dateString);
      return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return dateString;
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Credit':
        return <Badge bg="success">Credit</Badge>;
      case 'Vehicle INC':
        return <Badge bg="primary">Vehicle INC</Badge>;
      case 'LL':
        return <Badge bg="info" text="dark">LL</Badge>;
      case 'DL':
        return <Badge bg="warning" text="dark">DL</Badge>;
      default:
        return <Badge bg="secondary">{cat}</Badge>;
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1 fw-bold text-dark">WhatsApp logs</h3>
          <p className="text-muted mb-0">Track all messages sent to citizens on any given day.</p>
        </div>
        <Button variant="outline-secondary" onClick={handleReset} disabled={loading}>
          Reset Filters
        </Button>
      </div>

      {/* Filters Form */}
      <Card className="shadow-sm border-0 mb-4 bg-light">
        <Card.Body className="p-3">
          <Form onSubmit={handleSearchSubmit}>
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">Select Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-muted small">Search Message / Mobile</Form.Label>
                  <Form.Control
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by phone number or message content..."
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                  {loading ? <Spinner animation="border" size="sm" /> : 'Search Logs'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Category Tabs */}
      <Tabs
        activeKey={category}
        onSelect={(k) => setCategory(k || 'all')}
        className="mb-3"
      >
        <Tab eventKey="all" title="All Categories" />
        <Tab eventKey="Credit" title="Credit" />
        <Tab eventKey="Vehicle INC" title="Vehicle INC" />
        <Tab eventKey="LL" title="LL" />
        <Tab eventKey="DL" title="DL" />
        <Tab eventKey="Other" title="Other" />
      </Tabs>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle">
              <thead className="bg-light text-uppercase text-muted font-monospace small">
                <tr>
                  <th className="px-4 py-3" style={{ width: '80px' }}>#</th>
                  <th className="py-3" style={{ width: '120px' }}>Time</th>
                  <th className="py-3" style={{ width: '130px' }}>Category</th>
                  <th className="py-3" style={{ width: '160px' }}>Mobile</th>
                  <th className="py-3">Message</th>
                  <th className="py-3" style={{ width: '140px' }}>Sent By</th>
                  <th className="px-4 py-3 text-center" style={{ width: '110px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <Spinner animation="border" variant="primary" className="me-2" />
                      Loading logs...
                    </td>
                  </tr>
                )}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No WhatsApp messages found matching your criteria.
                    </td>
                  </tr>
                )}

                {!loading && logs.map((log, index) => {
                  const absoluteIndex = meta ? (meta.from + index) : (index + 1);
                  return (
                    <tr key={log.id}>
                      <td className="px-4 py-3 text-muted small">#{absoluteIndex}</td>
                      <td className="py-3 fw-semibold text-secondary">{formatTime(log.created_at)}</td>
                      <td className="py-3">{getCategoryBadge(log.category)}</td>
                      <td className="py-3 font-monospace">{log.phone_number}</td>
                      <td className="py-3" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
                        {log.message}
                      </td>
                      <td className="py-3">
                        {log.user ? (
                          <span className="fw-medium text-dark">{log.user.name}</span>
                        ) : (
                          <span className="text-muted italic small">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.status ? (
                          <Badge bg="success" pill>Sent</Badge>
                        ) : (
                          <span title={log.error_message || 'Unknown Error'}>
                            <Badge bg="danger" pill style={{ cursor: 'help' }}>Failed</Badge>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span className="text-muted small">
            Showing {meta.from} to {meta.to} of {meta.total} messages
          </span>
          <Pagination className="mb-0">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} />
            <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading} />
            
            {Array.from({ length: meta.last_page }).map((_, idx) => {
              const pageNum = idx + 1;
              const isNearCurrent = Math.abs(pageNum - currentPage) <= 2;
              if (pageNum === 1 || pageNum === meta.last_page || isNearCurrent) {
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === currentPage}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={loading}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              }
              if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                return <Pagination.Ellipsis key={pageNum} disabled />;
              }
              return null;
            })}

            <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === meta.last_page || loading} />
            <Pagination.Last onClick={() => handlePageChange(meta.last_page)} disabled={currentPage === meta.last_page || loading} />
          </Pagination>
        </div>
      )}
    </Container>
  );
}
