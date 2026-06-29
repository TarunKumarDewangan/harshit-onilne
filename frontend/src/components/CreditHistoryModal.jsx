import { useEffect, useState } from 'react';
import { Modal, Table, Spinner, Alert, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
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

export default function CreditHistoryModal({ show, onHide, credit, onAddEntry, onEdit, onDelete, onSaved }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Overall payment state
  const [overallAmount, setOverallAmount] = useState('');
  const [overallNote, setOverallNote] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    if (show && credit) {
      setOverallAmount('');
      setOverallNote('');
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
      setOverallAmount('');
      setOverallNote('');
    }
  }, [show, credit]);

  const handleOverallPaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(overallAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    setRecordingPayment(true);
    try {
      const payload = {
        name: credit.name,
        mobile: credit.mobile || null,
        work_done: overallNote.trim() || 'Overall Payment',
        total_amount: 0,
        given_amount: amount
      };
      await api.post('/credits', payload);
      toast.success('Overall payment recorded successfully');
      setOverallAmount('');
      setOverallNote('');
      // Refresh local history
      const { data } = await api.get(`/credits/${credit.id}/history`);
      setHistory(data || []);
      // Notify parent list to refresh
      if (onSaved) {
        onSaved();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to record overall payment.');
    } finally {
      setRecordingPayment(false);
    }
  };

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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            {credit?.mobile ? (
              <span className="text-muted">
                <strong>Mobile:</strong> {credit.mobile}
              </span>
            ) : (
              <span className="text-muted italic">No mobile number</span>
            )}
          </div>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => onAddEntry(credit.name, credit.mobile)}
          >
            + Add Entry for this Customer
          </Button>
        </div>

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

            {/* Quick Receive Overall Payment */}
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="py-3 bg-white rounded">
                <h6 className="mb-3 text-secondary fw-semibold">Receive Overall Payment (General)</h6>
                <Form onSubmit={handleOverallPaymentSubmit}>
                  <Row className="g-2">
                    <Col xs={12} sm={5}>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Amount (₹) *"
                        value={overallAmount}
                        onChange={(e) => setOverallAmount(e.target.value)}
                        required
                        disabled={recordingPayment}
                      />
                    </Col>
                    <Col xs={12} sm={4}>
                      <Form.Control
                        type="text"
                        placeholder="Payment Mode / Note (e.g. Cash)"
                        value={overallNote}
                        onChange={(e) => setOverallNote(e.target.value)}
                        disabled={recordingPayment}
                      />
                    </Col>
                    <Col xs={12} sm={3}>
                      <Button 
                        type="submit" 
                        variant="success" 
                        className="w-100 fw-bold"
                        disabled={recordingPayment || !overallAmount}
                      >
                        {recordingPayment ? 'Recording...' : 'Record Payment'}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>

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
                        <th>Date Added</th>
                        <th className="text-center pe-3" style={{ width: '140px' }}>Actions</th>
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
                            <td>{formatDate(h.created_at)}</td>
                            <td className="text-center pe-3">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-1 py-0 px-2"
                                onClick={() => onEdit(h)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="py-0 px-2"
                                onClick={() => onDelete(h)}
                              >
                                Delete
                              </Button>
                            </td>
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
