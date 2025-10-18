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

// export default function VehiclePermitEditModal({ show, onHide, record, onUpdated }) {
//   const [form, setForm] = useState({ permit_number: '', issue_date: '', expiry_date: '' });
//   const [file, setFile] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (record) {
//       // --- START OF THE FIX (PART 2) ---
//       // Use the new helper function to correctly format the dates for the form.
//       setForm({
//         permit_number: record.permit_number || '',
//         issue_date: formatDateForInput(record.issue_date),
//         expiry_date: formatDateForInput(record.expiry_date),
//       });
//       // --- END OF THE FIX (PART 2) ---
//       setFile(null);
//       setError('');
//     }
//   }, [record]);

//   const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!record) return;
//     setSaving(true); setError('');

//     const formData = new FormData();
//     Object.keys(form).forEach(key => formData.append(key, form[key]));
//     if (file) {
//       formData.append('file', file);
//     }
//     formData.append('_method', 'PUT');

//     try {
//       await api.post(`/permits/${record.id}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       toast.success('Permit record updated.');
//       onUpdated?.(); onHide();
//     } catch (err) {
//       const msg = err?.response?.data?.message || 'Failed to save changes.';
//       setError(msg); toast.error(msg);
//     } finally { setSaving(false); }
//   };

//   if (!record) return null;

//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Form onSubmit={handleSubmit}>
//         <Modal.Header closeButton><Modal.Title>Edit Permit Record</Modal.Title></Modal.Header>
//         <Modal.Body>
//           {error && <Alert variant="danger">{error}</Alert>}
//           <Row className="g-3">
//             <Col md={12}><Form.Group><Form.Label>Permit Number *</Form.Label><Form.Control value={form.permit_number} onChange={e => updateForm('permit_number', e.target.value.toUpperCase())} required /></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>Issue Date *</Form.Label><Form.Control type="date" value={form.issue_date} onChange={e => updateForm('issue_date', e.target.value)} required /></Form.Group></Col>
//             <Col md={6}><Form.Group><Form.Label>Expiry Date *</Form.Label><Form.Control type="date" value={form.expiry_date} onChange={e => updateForm('expiry_date', e.target.value)} required /></Form.Group></Col>
//             <Col md={12}>
//               <Form.Group>
//                 <Form.Label>Upload New Document (Optional)</Form.Label>
//                 <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
//                 {record.file_path && !file && (
//                     <div className="small mt-1">
//                         Current file: <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.file_path}`} target="_blank" rel="noopener noreferrer">View</a>
//                     </div>
//                 )}
//               </Form.Group>
//             </Col>
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

// --- START: ADD THE ROBUST DATE FORMATTER ---
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
// --- END: ADD THE ROBUST DATE FORMATTER ---

export default function VehiclePermitEditModal({ show, onHide, record, onUpdated }) {
  const [form, setForm] = useState({ permit_number: '', issue_date: '', expiry_date: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setForm({
        permit_number: record.permit_number || '',
        issue_date: formatDateForInput(record.issue_date),
        expiry_date: formatDateForInput(record.expiry_date),
      });
      setFile(null);
      setError('');
    }
  }, [record]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!record) return;
    setSaving(true); setError('');

    // --- START OF THE FIX (1/2) ---
    // Create a new payload and remove empty keys before sending
    const payload = { ...form };
    Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === null) {
            delete payload[key];
        }
    });

    const formData = new FormData();
    Object.keys(payload).forEach(key => formData.append(key, payload[key]));
    // --- END OF THE FIX ---

    if (file) {
      formData.append('file', file);
    }
    formData.append('_method', 'PUT');

    try {
      await api.post(`/permits/${record.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Permit record updated.');
      onUpdated?.(); onHide();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save changes.';
      setError(msg); toast.error(msg);
    } finally { setSaving(false); }
  };

  if (!record) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton><Modal.Title>Edit Permit Record</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3">
            {/* --- START OF THE FIX (2/2) --- */}
            {/* Remove asterisk and 'required' from optional fields */}
            <Col md={12}><Form.Group><Form.Label>Permit Number</Form.Label><Form.Control value={form.permit_number} onChange={e => updateForm('permit_number', e.target.value.toUpperCase())} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Issue Date</Form.Label><Form.Control type="date" value={form.issue_date} onChange={e => updateForm('issue_date', e.target.value)} /></Form.Group></Col>

            {/* Keep asterisk and 'required' for the mandatory field */}
            <Col md={6}><Form.Group><Form.Label>Expiry Date *</Form.Label><Form.Control type="date" value={form.expiry_date} onChange={e => updateForm('expiry_date', e.target.value)} required /></Form.Group></Col>
            {/* --- END OF THE FIX --- */}

            <Col md={12}>
              <Form.Group>
                <Form.Label>Upload New Document (Optional)</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
                {record.file_path && !file && (
                    <div className="small mt-1">
                        Current file: <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.file_path}`} target="_blank" rel="noopener noreferrer">View</a>
                    </div>
                )}
              </Form.Group>
            </Col>
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
