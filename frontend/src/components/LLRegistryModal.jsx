import { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

// Helper to handle dates for inputs (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) return dateString.substring(0, 10);
    try {
        const [day, month, year] = dateString.split('-');
        if (day && month && year) return `${year}-${month}-${day}`;
        return '';
    } catch (e) { return ''; }
};

export default function LLRegistryModal({ show, onHide, record, onSaved }) {
    const [form, setForm] = useState({
        name: '', mobile: '',
        application_no: '', dob: '', ll_no: '', // Added ll_no
        start_date: '', end_date: '', payment_asked: 0, payment_paid: 0
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (record) {
            setForm({
                name: record.name || '',
                mobile: record.mobile || '',
                application_no: record.application_no || '',
                dob: formatDateForInput(record.dob),
                ll_no: record.ll_no || '', // Added
                start_date: formatDateForInput(record.start_date),
                end_date: formatDateForInput(record.end_date),
                payment_asked: record.payment_asked || 0,
                payment_paid: record.payment_paid || 0,
            });
        } else {
            setForm({ name: '', mobile: '', application_no: '', dob: '', ll_no: '', start_date: '', end_date: '', payment_asked: 0, payment_paid: 0 });
        }
    }, [record, show]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Clean empty dates to null
            const payload = { ...form };
            ['dob', 'start_date', 'end_date'].forEach(k => { if (!payload[k]) payload[k] = null; });

            if (record) {
                await api.put(`/ll-registry/${record.id}`, payload);
                toast.success('Updated successfully');
            } else {
                await api.post('/ll-registry', payload);
                toast.success('Added successfully');
            }
            onSaved();
            onHide();
        } catch (e) {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton><Modal.Title>{record ? 'Edit' : 'Add'} LL Registry Entry</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Row className="g-3 mb-3">
                        <Col md={6}><Form.Label>Name *</Form.Label><Form.Control name="name" value={form.name} onChange={handleChange} required /></Col>
                        <Col md={6}><Form.Label>Mobile *</Form.Label><Form.Control name="mobile" value={form.mobile} onChange={handleChange} required maxLength={10} /></Col>

                        <Col md={4}><Form.Label>Application No</Form.Label><Form.Control name="application_no" value={form.application_no} onChange={handleChange} /></Col>
                        <Col md={4}><Form.Label>DOB</Form.Label><Form.Control type="date" name="dob" value={form.dob} onChange={handleChange} /></Col>
                        <Col md={4}><Form.Label>LL Number</Form.Label><Form.Control name="ll_no" value={form.ll_no} onChange={handleChange} placeholder="LL No" /></Col>

                        <Col md={6}><Form.Label>Start Date</Form.Label><Form.Control type="date" name="start_date" value={form.start_date} onChange={handleChange} /></Col>
                        <Col md={6}><Form.Label>End Date</Form.Label><Form.Control type="date" name="end_date" value={form.end_date} onChange={handleChange} /></Col>
                    </Row>
                    <hr />
                    <Row className="g-3">
                        <Col md={4}><Form.Label>Payment Asked</Form.Label><Form.Control type="number" name="payment_asked" value={form.payment_asked} onChange={handleChange} /></Col>
                        <Col md={4}><Form.Label>Payment Paid</Form.Label><Form.Control type="number" name="payment_paid" value={form.payment_paid} onChange={handleChange} /></Col>
                        <Col md={4}><Form.Label>Balance</Form.Label>
                            <Form.Control value={Number(form.payment_asked) - Number(form.payment_paid)} disabled className="bg-light fw-bold text-danger" />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Cancel</Button>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
