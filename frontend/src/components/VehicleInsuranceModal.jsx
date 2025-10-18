import { useEffect, useState } from 'react';
import { Modal, Button, Table, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

export default function VehicleInsuranceModal({ show, onHide, vehicle, onShowEdit }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    insurance_type: '',
    company_name: '',
    policy_number: '',
    start_date: '',
    end_date: '',
    status: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async (page = 1) => {
    if (!vehicle) return;
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get(`/vehicles/${vehicle.id}/insurances`, { params: { page } });
      setItems(data.data || []);
      setMeta(data.meta || null);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load insurances';
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      load(1);
      setForm({ insurance_type: '', company_name: '', policy_number: '', start_date: '', end_date: '', status: '' });
    }
  }, [show, vehicle]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
        // --- START OF THE FIX ---
        // Create a new payload object to send to the API.
        const payload = { ...form };

        // Go through each key in the payload. If the value is an empty string,
        // change it to null so the database will accept it.
        Object.keys(payload).forEach(key => {
            if (payload[key] === '') {
                payload[key] = null;
            }
        });

        // Send the cleaned payload instead of the original form state.
        await api.post(`/vehicles/${vehicle.id}/insurances`, payload);
        // --- END OF THE FIX ---

        toast.success('Insurance record added.');
        load(1);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to save insurance.';
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (insuranceId) => {
    if (window.confirm('Are you sure you want to delete this insurance record?')) {
      try {
        await api.delete(`/insurances/${insuranceId}`);
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
        <Modal.Title>Insurance Details — {vehicle.registration_no}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {err && <Alert variant="danger">{err}</Alert>}

        <div className="table-responsive mb-4">
          <Table bordered hover size="sm">
            <thead>
              <tr><th>#</th><th>Policy Number</th><th>Company</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-center"><Spinner size="sm" /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={8} className="text-center">No insurance records found.</td></tr>}
              {!loading && items.map((ins, i) => (
                <tr key={ins.id}>
                  <td>{(meta?.from ?? 1) + i}</td>
                  <td>{ins.policy_number || '-'}</td>
                  <td>{ins.company_name || '-'}</td>
                  <td>{ins.insurance_type || '-'}</td>
                  <td>{ins.start_date || '-'}</td>
                  <td>{ins.end_date || '-'}</td>
                  <td><Badge bg={ins.status === 'active' ? 'success' : 'danger'}>{ins.status || 'N/A'}</Badge></td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => onShowEdit(ins)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(ins.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <h5 className="mb-3">Add New Insurance</h5>
        <Form onSubmit={submit}>
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Insurance Company</Form.Label><Form.Control value={form.company_name} onChange={e => updateForm('company_name', e.target.value)} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Policy Number</Form.Label><Form.Control value={form.policy_number} onChange={e => updateForm('policy_number', e.target.value.toUpperCase())} /></Form.Group></Col>
            <Col md={6}>
                <Form.Group>
                    <Form.Label>Insurance Type</Form.Label>
                    <Form.Select value={form.insurance_type} onChange={e => updateForm('insurance_type', e.target.value)}>
                        <option value="">-- Select --</option>
                        <option value="Comprehensive">Comprehensive</option>
                        <option value="Third Party">Third Party</option>
                    </Form.Select>
                </Form.Group>
            </Col>
            <Col md={6}>
                <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={form.status} onChange={e => updateForm('status', e.target.value)}>
                        <option value="">-- Select Status --</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                    </Form.Select>
                </Form.Group>
            </Col>
            <Col md={6}><Form.Group><Form.Label>Start Date *</Form.Label><Form.Control type="date" value={form.start_date} onChange={e => updateForm('start_date', e.target.value)} required /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>End Date *</Form.Label><Form.Control type="date" value={form.end_date} onChange={e => updateForm('end_date', e.target.value)} required /></Form.Group></Col>
          </Row>
          <div className="text-end mt-3">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Insurance'}</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
