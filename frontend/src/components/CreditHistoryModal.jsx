import { useEffect, useState } from 'react';
import { Modal, Table, Spinner, Alert, Row, Col, Card } from 'react-bootstrap';
import api from '../services/apiClient';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return '-';
  }
};

export default function CreditHistoryModal({ show, onHide, credit }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && credit) {
      const fetchHistory = async () => {
        setLoading(true);
        setError('');
        try {
          const { data } = await api.get(`/credits/${credit.id}/history`);
          setHistory(data || []);
        } catch (err) {
          console.error(err);
          setError(err.response?.data?.message || 'Failed to fetch customer history.');
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [show, credit]);

  // Aggregate totals
  const totalCharged = history.reduce((sum, h) => sum + Number(h.total_amount), 0);
  const totalPaid = history.reduce((sum, h) => sum + Number(h.given_amount), 0);
  const totalOutstanding = history.reduce((sum, h) => sum + Number(h.balance_amount), 0);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Credit History: <span className="text-primary">{credit?.name}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light">
        {credit?.mobile && (
          <div className="mb-3 text-muted">
            <strong>Mobile:</strong> {credit.mobile}
          </div>
        )}

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" className="me-2" />
            Loading customer history...
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && history.length > 0 && (
          <>
            {/* History Aggregates */}
            <Row className="mb-4 g-2">
              <Col xs={4}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body className="py-2 px-1">
                    <div className="text-muted small text-uppercase">Total Charged</div>
                    <h5 className="mb-0 text-primary">₹ {totalCharged.toFixed(2)}</h5>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={4}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body className="py-2 px-1">
                    <div className="text-muted small text-uppercase">Total Paid</div>
                    <h5 className="mb-0 text-success">₹ {totalPaid.toFixed(2)}</h5>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={4}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body className="py-2 px-1">
                    <div className="text-muted small text-uppercase">Outstanding</div>
                    <h5 className="mb-0 text-danger">₹ {totalOutstanding.toFixed(2)}</h5>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* History Table */}
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped hover size="sm" className="mb-0 align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-3">#</th>
                        <th>Work Done</th>
                        <th className="text-end">Total</th>
                        <th className="text-end">Given</th>
                        <th className="text-end">Balance</th>
                        <th>Added By</th>
                        <th className="pe-3">Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => {
                        const balance = Number(h.balance_amount);
                        return (
                          <tr key={h.id}>
                            <td className="ps-3 text-muted">{i + 1}</td>
                            <td>{h.work_done || <span className="text-muted italic">N/A</span>}</td>
                            <td className="text-end fw-semibold">₹ {Number(h.total_amount).toFixed(2)}</td>
                            <td className="text-end text-success">₹ {Number(h.given_amount).toFixed(2)}</td>
                            <td className={`text-end fw-bold ${balance > 0 ? 'text-danger' : 'text-muted'}`}>
                              ₹ {balance.toFixed(2)}
                            </td>
                            <td>
                              <small className="text-muted">{h.user?.name || 'Unknown'}</small>
                            </td>
                            <td className="pe-3">{formatDate(h.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}

        {!loading && !error && history.length === 0 && (
          <Alert variant="info" className="mb-0">
            No history found for this contact.
          </Alert>
        )}
      </Modal.Body>
    </Modal>
  );
}
