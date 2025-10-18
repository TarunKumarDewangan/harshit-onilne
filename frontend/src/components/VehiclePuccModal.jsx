import { useEffect, useState } from 'react';
import { Modal, Button, Table, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

// --- FIX: The formatDate function is no longer needed here ---
// const formatDate = (dateString) => { ... };

export default function VehiclePuccModal({ show, onHide, vehicle, onShowEdit }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

 const [form, setForm] = useState({
    pucc_number: '',
    valid_from: '',
    valid_until: '',
    status: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async (page = 1) => {
    if (!vehicle) return;
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get(`/vehicles/${vehicle.id}/puccs`, { params: { page } });
      setItems(data.data || []);
      setMeta(data.meta || null);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load PUCC records.';
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      load(1);
      setForm({ pucc_number: '', valid_from: '', valid_until: '', status: 'active' });
    }
  }, [show, vehicle]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      await api.post(`/vehicles/${vehicle.id}/puccs`, form);
      toast.success('PUCC record added.');
      load(1);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to save PUCC record.';
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (puccId) => {
    if (window.confirm('Are you sure you want to delete this PUCC record?')) {
      try {
        await api.delete(`/puccs/${puccId}`);
        toast.success('Record deleted.');
        load(meta?.current_page || 1);
      } catch (e) {
        toast.error(e?.response?.data?.message || 'Delete failed.');
      }
    }
  };

  if (!vehicle) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>PUCC Details — {vehicle.registration_no}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {err && <Alert variant="danger">{err}</Alert>}

        <div className="table-responsive mb-4">
          <Table bordered hover size="sm">
            <thead>
              <tr><th>#</th><th>PUCC Number</th><th>Valid From</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="text-center"><Spinner size="sm" /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={6} className="text-center">No PUCC records found.</td></tr>}
              {!loading && items.map((pucc, i) => (
                <tr key={pucc.id}>
                  <td>{(meta?.from ?? 1) + i}</td>
                  <td>{pucc.pucc_number}</td>
                  {/* --- FIX: Display the pre-formatted date directly from the API --- */}
                  <td>{pucc.valid_from || '-'}</td>
                  <td>{pucc.valid_until || '-'}</td>
                  <td><Badge bg={pucc.status === 'active' ? 'success' : 'danger'}>{pucc.status}</Badge></td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => onShowEdit(pucc)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(pucc.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <h5 className="mb-3">Add New PUCC</h5>
        <Form onSubmit={submit}>
          <Row className="g-3">
             <Col md={12}><Form.Group><Form.Label>PUCC Number</Form.Label><Form.Control value={form.pucc_number} onChange={e => updateForm('pucc_number', e.target.value.toUpperCase())} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Valid From</Form.Label><Form.Control type="date" value={form.valid_from} onChange={e => updateForm('valid_from', e.target.value)} /></Form.Group></Col>

            {/* Keep the asterisk and 'required' prop for the mandatory field */}
            <Col md={4}><Form.Group><Form.Label>Valid Until *</Form.Label><Form.Control type="date" value={form.valid_until} onChange={e => updateForm('valid_until', e.target.value)} required /></Form.Group></Col>

            <Col md={4}>
                <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={form.status} onChange={e => updateForm('status', e.target.value)}>
                        <option value="">-- Select Status --</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                    </Form.Select>
                </Form.Group>
            </Col>
          </Row>
          <div className="text-end mt-3">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add PUCC'}</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
