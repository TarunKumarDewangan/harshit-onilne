import { useEffect, useState, useCallback } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Alert, Spinner, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';
import CreditModal from '../components/CreditModal';
import CreditHistoryModal from '../components/CreditHistoryModal';

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

export default function CreditPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [totals, setTotals] = useState({ total_amount: 0, given_amount: 0, balance_amount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Pagination & Sorting filters
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [onlyBalance, setOnlyBalance] = useState(false);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  // WhatsApp loading state
  const [sendingMessageId, setSendingMessageId] = useState(null);

  const fetchCredits = useCallback(async (
    page = 1, 
    searchVal = search, 
    limit = perPage,
    sort = sortBy,
    order = sortOrder,
    balanceOnly = onlyBalance
  ) => {
    setLoading(true);
    setError('');
    try {
      const params = { 
        page, 
        per_page: limit,
        sort_by: sort,
        sort_order: order
      };
      if (searchVal.trim() !== '') {
        params.search = searchVal;
      }
      if (balanceOnly) {
        params.only_balance = 'true';
      }
      const { data } = await api.get('/credits', { params });
      setItems(data.data || []);
      setMeta(data.meta || null);
      setTotals(data.totals || { total_amount: 0, given_amount: 0, balance_amount: 0 });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to load credits list';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [search, perPage, sortBy, sortOrder, onlyBalance]);

  // Sync fetching when sorting or pending filters change
  useEffect(() => {
    fetchCredits(1, search, perPage, sortBy, sortOrder, onlyBalance);
  }, [sortBy, sortOrder, onlyBalance]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCredits(1, search, perPage, sortBy, sortOrder, onlyBalance);
  };

  const handleReset = () => {
    setSearch('');
    setSortBy('id');
    setSortOrder('desc');
    setOnlyBalance(false);
    fetchCredits(1, '', perPage, 'id', 'desc', false);
  };

  const handlePageChange = (p) => {
    if (!meta || p < 1 || p > meta.last_page || p === meta.current_page || loading) return;
    fetchCredits(p, search, perPage, sortBy, sortOrder, onlyBalance);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setShowModal(true);
  };

  const handleDelete = async (record) => {
    if (window.confirm(`Are you sure you want to delete the credit record for '${record.name}'?`)) {
      try {
        await api.delete(`/credits/${record.id}`);
        toast.success('Credit record deleted successfully');
        fetchCredits(meta?.current_page || 1, search, perPage, sortBy, sortOrder, onlyBalance);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  const handleSendWhatsApp = async (record) => {
    if (!record.mobile) {
      toast.warn('No mobile number set for this record.');
      return;
    }
    if (!window.confirm(`Send manual WhatsApp reminder to ${record.name} at ${record.mobile}?`)) {
      return;
    }
    setSendingMessageId(record.id);
    try {
      await api.post(`/credits/${record.id}/send-message`);
      toast.success('WhatsApp reminder sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send WhatsApp reminder.');
    } finally {
      setSendingMessageId(null);
    }
  };

  const onSaved = () => {
    fetchCredits(meta?.current_page || 1, search, perPage, sortBy, sortOrder, onlyBalance);
  };

  const handleAddForPerson = (name, mobile) => {
    setShowHistoryModal(false);
    setEditingRecord({ name, mobile });
    setShowModal(true);
  };

  // Sort click handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <Container className="py-4">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 className="mb-0">Credit Tracker (That Credit)</h3>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => { setEditingRecord(null); setShowModal(true); }}>
            + Add Credit Entry
          </Button>
        </Col>
      </Row>

      {/* --- TOTALS / STATS SECTION --- */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="bg-primary text-white border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="text-white-50 small text-uppercase">Total Credit Amount</Card.Title>
              <h2 className="mb-0">₹ {totals.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-success text-white border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="text-white-50 small text-uppercase">Total Amount Given (Paid)</Card.Title>
              <h2 className="mb-0">₹ {totals.given_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="bg-danger text-white border-0 shadow-sm">
            <Card.Body>
              <Card.Title className="text-white-50 small text-uppercase">Pending / Balance</Card.Title>
              <h2 className="mb-0">₹ {totals.balance_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- SEARCH FILTER --- */}
      <Card className="mb-4 shadow-sm border-0 bg-light">
        <Card.Body>
          <Form onSubmit={handleSearchSubmit}>
            <Row className="g-2 align-items-center">
              <Col md={5}>
                <Form.Control
                  placeholder="Search by name, mobile number, or work done..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Form.Select
                  value={perPage}
                  onChange={(e) => {
                    const newLimit = Number(e.target.value);
                    setPerPage(newLimit);
                    fetchCredits(1, search, newLimit, sortBy, sortOrder, onlyBalance);
                  }}
                >
                  <option value={15}>15 / page</option>
                  <option value={30}>30 / page</option>
                  <option value={50}>50 / page</option>
                </Form.Select>
              </Col>
              <Col md="auto" className="d-flex align-items-center ms-3 me-2">
                <Form.Check
                  type="switch"
                  id="only-balance-switch"
                  label={<span className="fw-semibold text-secondary">Pending Balance Only</span>}
                  checked={onlyBalance}
                  onChange={(e) => setOnlyBalance(e.target.checked)}
                />
              </Col>
              <Col md="auto" className="ms-auto d-flex gap-2">
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button variant="outline-secondary" onClick={handleReset} disabled={loading}>
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* --- DATA TABLE --- */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped hover align="middle" className="mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-3 text-muted" style={{ width: '60px' }}>#</th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort('name')}
                  >
                    Person Name{renderSortIndicator('name')}
                  </th>
                  <th>Mobile</th>
                  <th>Work Done</th>
                  <th 
                    className="text-end" 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '130px' }}
                    onClick={() => handleSort('total_amount')}
                  >
                    Total{renderSortIndicator('total_amount')}
                  </th>
                  <th 
                    className="text-end" 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '130px' }}
                    onClick={() => handleSort('given_amount')}
                  >
                    Given{renderSortIndicator('given_amount')}
                  </th>
                  <th 
                    className="text-end" 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '140px' }}
                    onClick={() => handleSort('balance_amount')}
                  >
                    Balance{renderSortIndicator('balance_amount')}
                  </th>
                  <th>Added By</th>
                  <th 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '130px' }}
                    onClick={() => handleSort('created_at')}
                  >
                    Date Added{renderSortIndicator('created_at')}
                  </th>
                  <th className="text-center pe-3" style={{ width: '200px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading credit records...
                    </td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">
                      No credit records found.
                    </td>
                  </tr>
                )}
                {!loading && items.map((item, index) => {
                  const balance = Number(item.balance_amount);
                  const rowNum = meta ? (meta.current_page - 1) * meta.per_page + index + 1 : index + 1;
                  return (
                    <tr key={item.id}>
                      <td className="ps-3 text-muted">{rowNum}</td>
                      <td>
                        <span 
                          className="text-primary fw-bold" 
                          style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => { setHistoryRecord(item); setShowHistoryModal(true); }}
                          title="Click to view history"
                        >
                          {item.name}
                        </span>
                      </td>
                      <td>{item.mobile || '-'}</td>
                      <td className="text-truncate" style={{ maxWidth: '220px' }} title={item.work_done}>
                        {item.work_done || <span className="text-muted italic">N/A</span>}
                      </td>
                      <td className="text-end fw-semibold">₹ {Number(item.total_amount).toFixed(2)}</td>
                      <td className="text-end text-success">₹ {Number(item.given_amount).toFixed(2)}</td>
                      <td className={`text-end fw-bold ${balance > 0 ? 'text-danger' : 'text-muted'}`}>
                        ₹ {balance.toFixed(2)}
                      </td>
                      <td>
                        <small className="text-muted">{item.user?.name || 'Unknown'}</small>
                      </td>
                      <td>
                        <span className="small text-secondary">{formatDate(item.created_at)}</span>
                      </td>
                      <td className="text-center pe-3">
                        {/* WhatsApp Button */}
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2 py-1 px-2 btn-outline-success text-success"
                          disabled={!item.mobile || balance <= 0 || sendingMessageId === item.id}
                          onClick={() => handleSendWhatsApp(item)}
                          title="Send WhatsApp Reminder"
                          style={{ borderColor: '#25d366' }}
                        >
                          {sendingMessageId === item.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="bi bi-whatsapp"></i>
                          )}
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(item)}
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

      {/* --- PAGINATION --- */}
      {meta && meta.last_page > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">
            Showing {meta.from || 0} to {meta.to || 0} of {meta.total} entries
          </small>
          <Pagination className="mb-0">
            <Pagination.First onClick={() => handlePageChange(1)} disabled={meta.current_page === 1 || loading} />
            <Pagination.Prev onClick={() => handlePageChange(meta.current_page - 1)} disabled={meta.current_page === 1 || loading} />
            
            {Array.from({ length: meta.last_page }, (_, i) => {
              const pageNum = i + 1;
              const shouldShow = meta.last_page <= 5 || Math.abs(pageNum - meta.current_page) <= 1 || pageNum === 1 || pageNum === meta.last_page;
              if (!shouldShow) return null;
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === meta.current_page}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}

            <Pagination.Next onClick={() => handlePageChange(meta.current_page + 1)} disabled={meta.current_page === meta.last_page || loading} />
            <Pagination.Last onClick={() => handlePageChange(meta.last_page)} disabled={meta.current_page === meta.last_page || loading} />
          </Pagination>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      <CreditModal
        show={showModal}
        onHide={() => { setShowModal(false); setEditingRecord(null); }}
        record={editingRecord}
        onSaved={onSaved}
      />

      {/* --- HISTORY MODAL --- */}
      <CreditHistoryModal
        show={showHistoryModal}
        onHide={() => { setShowHistoryModal(false); setHistoryRecord(null); }}
        credit={historyRecord}
        onAddEntry={handleAddForPerson}
      />
    </Container>
  );
}
