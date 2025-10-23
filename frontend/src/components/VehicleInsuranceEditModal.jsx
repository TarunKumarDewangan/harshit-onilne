// import { useEffect, useState } from 'react';
// import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
// import { toast } from 'react-toastify';
// import api from '../services/apiClient';

// // --- START OF THE FIX (PART 1) ---
// // Helper function to convert "dd-mm-yyyy" from API to "yyyy-mm-dd" for the input field.
// const formatDateForInput = (dateString) => {
//     if (!dateString) return '';
//     try {
//         const [day, month, year] = dateString.split('-');
//         if (day && month && year) {
//             return `${year}-${month}-${day}`;
//         }
//         return ''; // Return empty string if format is unexpected
//     } catch (e) {
//         return ''; // Return empty string on error
//     }
// };
// // --- END OF THE FIX (PART 1) ---

// export default function VehicleInsuranceEditModal({ show, onHide, insuranceRecord, onUpdated }) {
//   const [form, setForm] = useState({
//     insurance_type: '',
//     company_name: '',
//     policy_number: '',
//     start_date: '',
//     end_date: '',
//     status: 'active',
//   });
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (insuranceRecord) {
//       // --- START OF THE FIX (PART 2) ---
//       // Use the new helper function to correctly format the dates for the form.
//       setForm({
//         insurance_type: insuranceRecord.insurance_type || '',
//         company_name: insuranceRecord.company_name || '',
//         policy_number: insuranceRecord.policy_number || '',
//         start_date: formatDateForInput(insuranceRecord.start_date),
//         end_date: formatDateForInput(insuranceRecord.end_date),
//         status: insuranceRecord.status || 'active',
//       });
//       // --- END OF THE FIX (PART 2) ---
//       setError('');
//     }
//   }, [insuranceRecord]);

//   const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!insuranceRecord) return;

//     setSaving(true);
//     setError('');
//     try {
//       await api.put(`/insurances/${insuranceRecord.id}`, form);
//       toast.success('Insurance record updated successfully.');
//       onUpdated?.();
//       onHide();
//     } catch (err) {
//       const msg = err?.response?.data?.message || 'Failed to save changes.';
//       setError(msg);
//       toast.error(msg);
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (!insuranceRecord) return null;

//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Form onSubmit={handleSubmit}>
//         <Modal.Header closeButton><Modal.Title>Edit Insurance Record</Modal.Title></Modal.Header>
//         <Modal.Body>
//           {error && <Alert variant="danger">{error}</Alert>}
//           <Row className="g-3">
//             <Col md={6}><Form.Group><Form.Label>Insurance Company *</Form.Label><Form.Control value={form.company_name} onChange={e => updateForm('company_name', e.target.value)} required /></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>Policy Number *</Form.Label><Form.Control value={form.policy_number} onChange={e => updateForm('policy_number', e.target.value.toUpperCase())} required /></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>Insurance Type *</Form.Label><Form.Select value={form.insurance_type} onChange={e => updateForm('insurance_type', e.target.value)}><option value="">-- Select --</option><option value="Comprehensive">Comprehensive</option><option value="Third Party">Third Party</option></Form.Select></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>Status *</Form.Label><Form.Select value={form.status} onChange={e => updateForm('status', e.target.value)}><option value="active">Active</option><option value="expired">Expired</option></Form.Select></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>Start Date *</Form.Label><Form.Control type="date" value={form.start_date} onChange={e => updateForm('start_date', e.target.value)} required /></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>End Date *</Form.Label><Form.Control type="date" value={form.end_date} onChange={e => updateForm('end_date', e.target.value)} required /></Form.Group></Col>
//           </Row>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={onHide}>Cancel</Button>
//           <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
//         </Modal.Footer>
//       </Form>
//     </Modal>
//   );
// }

import { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

// Add the robust date formatter
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateString.substring(0, 10);
    }
    try {
        const [day, month, year] = dateString.split('-');
        if (day && month && year) {
            return `${year}-${month}-${day}`;
        }
        return '';
    } catch (e) {
        return '';
    }
};

export default function VehicleInsuranceEditModal({ show, onHide, insuranceRecord, onUpdated }) {
  const [form, setForm] = useState({
    insurance_type: '',
    company_name: '',
    policy_number: '',
    start_date: '',
    end_date: '',
    status: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (insuranceRecord) {
      setForm({
        insurance_type: insuranceRecord.insurance_type || '',
        company_name: insuranceRecord.company_name || '',
        policy_number: insuranceRecord.policy_number || '',
        start_date: formatDateForInput(insuranceRecord.start_date),
        end_date: formatDateForInput(insuranceRecord.end_date),
        status: insuranceRecord.status || '',
      });
      setError('');
    }
  }, [insuranceRecord]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!insuranceRecord) return;

    setSaving(true);
    setError('');
    try {
        const payload = { ...form };
        Object.keys(payload).forEach(key => {
            if (payload[key] === '' || payload[key] === null) {
                // Keep the required date fields, even if temporarily empty during user input
                if (key !== 'start_date' && key !== 'end_date') {
                    delete payload[key];
                }
            }
        });

        // Use PUT for updates, and send the payload directly. Axios will handle JSON stringification.
        await api.put(`/insurances/${insuranceRecord.id}`, payload);
        toast.success('Insurance record updated successfully.');
        onUpdated?.();
        onHide();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save changes.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!insuranceRecord) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton><Modal.Title>Edit Insurance Record</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3">
            {/* --- START OF THE FIX --- */}
            {/* Remove asterisk and 'required' from optional fields */}
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

            {/* Keep asterisk and 'required' for mandatory fields */}
           <Col md={6}><Form.Group><Form.Label>Start Date</Form.Label><Form.Control type="date" value={form.start_date} onChange={e => updateForm('start_date', e.target.value)} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>End Date *</Form.Label><Form.Control type="date" value={form.end_date} onChange={e => updateForm('end_date', e.target.value)} required /></Form.Group></Col>
            {/* --- END OF THE FIX --- */}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
