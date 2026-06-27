import { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

export default function CreditModal({ show, onHide, record, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    work_done: '',
    total_amount: 0,
    given_amount: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        name: record.name || '',
        mobile: record.mobile || '',
        work_done: record.work_done || '',
        total_amount: Number(record.total_amount) || 0,
        given_amount: Number(record.given_amount) || 0
      });
    } else {
      setForm({
        name: '',
        mobile: '',
        work_done: '',
        total_amount: 0,
        given_amount: 0
      });
    }
  }, [record, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name,
      mobile: form.mobile || null,
      work_done: form.work_done || null,
      total_amount: Number(form.total_amount) || 0,
      given_amount: Number(form.given_amount) || 0
    };

    try {
      if (record) {
        await api.put(`/credits/${record.id}`, payload);
        toast.success('Credit record updated successfully');
      } else {
        await api.post('/credits', payload);
        toast.success('Credit record added successfully');
      }
      onSaved();
      onHide();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const balanceAmount = Number(form.total_amount) - Number(form.given_amount);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{record ? 'Edit' : 'Add'} Credit Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3 mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Person Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Mobile No</Form.Label>
                <Form.Control
                  type="text"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  maxLength={10}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Work Done (Description)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="work_done"
              value={form.work_done}
              onChange={handleChange}
              placeholder="Describe the work completed"
            />
          </Form.Group>

          <hr />

          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Total Amount *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="total_amount"
                  value={form.total_amount}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Given Amount *</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  name="given_amount"
                  value={form.given_amount}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Pending / Balance</Form.Label>
                <Form.Control
                  type="number"
                  value={balanceAmount.toFixed(2)}
                  disabled
                  className="bg-light fw-bold text-danger"
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Record'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
