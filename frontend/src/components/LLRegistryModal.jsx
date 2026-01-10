
import { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

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
        name: '', mobile: '', given_by: '', // --- ADDED given_by ---
        application_no: '', ll_no: '',
        dob: '',
        start_date: '', end_date: '',
        payment_asked: 0, payment_paid: 0
    });

    // State for the file
    const [aadharFile, setAadharFile] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (record) {
            setForm({
                name: record.name || '',
                mobile: record.mobile || '',
                given_by: record.given_by || '', // --- ADDED ---
                application_no: record.application_no || '',
                ll_no: record.ll_no || '',
                dob: formatDateForInput(record.dob),
                start_date: formatDateForInput(record.start_date),
                end_date: formatDateForInput(record.end_date),
                payment_asked: record.payment_asked || 0,
                payment_paid: record.payment_paid || 0,
            });
            setAadharFile(null); // Reset file input on edit load
        } else {
            setForm({ name: '', mobile: '', given_by: '', application_no: '', ll_no: '', dob: '', start_date: '', end_date: '', payment_asked: 0, payment_paid: 0 });
            setAadharFile(null);
        }
    }, [record, show]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // File change handler
    const handleFileChange = (e) => {
        setAadharFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // --- MUST USE FORMDATA FOR FILE UPLOADS ---
            const formData = new FormData();

            // Append standard fields
            Object.keys(form).forEach(key => {
                // Handle null dates
                if (['dob', 'start_date', 'end_date'].includes(key) && !form[key]) {
                    // Don't append empty dates, or send them as empty string
                } else {
                    formData.append(key, form[key]);
                }
            });

            // Append File if selected
            if (aadharFile) {
                formData.append('aadhar_file', aadharFile);
            }

            if (record) {
                // For PUT requests with files, Laravel usually needs _method: PUT
                formData.append('_method', 'PUT');
                await api.post(`/ll-registry/${record.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Updated successfully');
            } else {
                await api.post('/ll-registry', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Added successfully');
            }
            onSaved();
            onHide();
        } catch (e) {
            console.error(e);
            toast.error(e.response?.data?.message || 'Failed to save');
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

                        {/* --- NEW GIVEN BY FIELD --- */}
                        <Col md={12}><Form.Label>Given By (Optional)</Form.Label><Form.Control name="given_by" value={form.given_by} onChange={handleChange} placeholder="e.g. Agent Name / Reference" /></Col>

                        <Col md={4}><Form.Label>Application No</Form.Label><Form.Control name="application_no" value={form.application_no} onChange={handleChange} /></Col>
                        <Col md={4}><Form.Label>LL Number</Form.Label><Form.Control name="ll_no" value={form.ll_no} onChange={handleChange} placeholder="LL No" /></Col>
                        <Col md={4}><Form.Label>DOB</Form.Label><Form.Control type="date" name="dob" value={form.dob} onChange={handleChange} /></Col>

                        <Col md={6}><Form.Label>Start Date</Form.Label><Form.Control type="date" name="start_date" value={form.start_date} onChange={handleChange} /></Col>
                        <Col md={6}><Form.Label>End Date</Form.Label><Form.Control type="date" name="end_date" value={form.end_date} onChange={handleChange} /></Col>
                    </Row>

                    {/* --- NEW FILE UPLOAD FIELD --- */}
                    <div className="mb-3 p-3 bg-light border rounded">
                        <Form.Label>Upload Aadhaar Card (Optional)</Form.Label>
                        <Form.Control type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.pdf" />
                        {record?.aadhar_path && !aadharFile && (
                            <div className="mt-1 small">
                                <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.aadhar_path}`} target="_blank" rel="noreferrer">View Current Aadhaar</a>
                            </div>
                        )}
                    </div>

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
