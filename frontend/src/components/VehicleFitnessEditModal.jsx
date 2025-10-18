// import { useEffect, useState } from 'react';
// import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
// import { toast } from 'react-toastify';
// import api from '../services/apiClient';

// // --- START OF NEW CODE ---
// // Helper function to convert "dd-mm-yyyy" from API to "yyyy-mm-dd" for the input field.
// const formatDateForInput = (dateString) => {
//     if (!dateString) return '';
//     try {
//         const [day, month, year] = dateString.split('-');
//         if (day && month && year) {
//             return `${year}-${month}-${day}`;
//         }
//         return '';
//     } catch (e) {
//         return '';
//     }
// };
// // --- END OF NEW CODE ---

// export default function VehicleFitnessEditModal({ show, onHide, record, onUpdated }) {
//   const [form, setForm] = useState({ certificate_number: '', issue_date: '', expiry_date: '' });
//   const [file, setFile] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (record) {
//       // --- START OF THE FIX ---
//       // Use the new helper function to correctly format the dates for the form.
//       setForm({
//         certificate_number: record.certificate_number || '',
//         issue_date: formatDateForInput(record.issue_date),
//         expiry_date: formatDateForInput(record.expiry_date),
//       });
//       // --- END OF THE FIX ---
//       setFile(null);
//       setError('');
//     }
//   }, [record]);

//   const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!record) return;
//     setSaving(true);
//     setError('');

//     const formData = new FormData();
//     Object.keys(form).forEach(key => formData.append(key, form[key]));
//     if (file) {
//       formData.append('file', file);
//     }
//     formData.append('_method', 'PUT');

//     try {
//       await api.post(`/fitnesses/${record.id}`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       toast.success('Fitness record updated.');
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

//   if (!record) return null;

//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Form onSubmit={handleSubmit}>
//         <Modal.Header closeButton>
//           <Modal.Title>Edit Fitness Record</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           {error && <Alert variant="danger">{error}</Alert>}
//           <Row className="g-3">
//             <Col md={12}>
//               <Form.Group>
//                 <Form.Label>Certificate Number *</Form.Label>
//                 <Form.Control
//                   value={form.certificate_number}
//                   onChange={e => updateForm('certificate_number', e.target.value.toUpperCase())}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Issue Date *</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={form.issue_date}
//                   onChange={e => updateForm('issue_date', e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Expiry Date *</Form.Label>
//                 <Form.Control
//                   type="date"
//                   value={form.expiry_date}
//                   onChange={e => updateForm('expiry_date', e.target.value)}
//                   required
//                 />
//               </Form.Group>
//             </Col>
//             <Col md={12}>
//               <Form.Group>
//                 <Form.Label>Upload New Document (Optional)</Form.Label>
//                 <Form.Control
//                   type="file"
//                   onChange={(e) => setFile(e.target.files[0])}
//                 />
//                 {record.file_path && !file && (
//                   <div className="small mt-1">
//                     Current file: <a
//                       href={`${import.meta.env.VITE_API_BASE_URL}/storage/${record.file_path}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       View
//                     </a>
//                   </div>
//                 )}
//               </Form.Group>
//             </Col>
//           </Row>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={onHide}>Cancel</Button>
//           <Button type="submit" disabled={saving}>
//             {saving ? 'Saving...' : 'Save Changes'}
//           </Button>
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

export default function VehicleFitnessEditModal({ show, onHide, record, onUpdated }) {
  const [form, setForm] = useState({ certificate_number: '', issue_date: '', expiry_date: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setForm({
        certificate_number: record.certificate_number || '',
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
    setSaving(true);
    setError('');

    try {
        const payload = { ...form };
        Object.keys(payload).forEach(key => {
            if (payload[key] === '' || payload[key] === null) {
                // Keep the required 'expiry_date' field, even if temporarily empty during user input
                if (key !== 'expiry_date') {
                    delete payload[key];
                }
            }
        });

        const formData = new FormData();
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));
        if (file) {
            formData.append('file', file);
        }
        formData.append('_method', 'PUT');

        await api.post(`/fitnesses/${record.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Fitness record updated.');
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

  if (!record) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Fitness Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3">
            {/* --- START OF THE FIX --- */}
            {/* Remove asterisk and 'required' from optional fields */}
            <Col md={12}>
              <Form.Group>
                <Form.Label>Certificate Number</Form.Label>
                <Form.Control value={form.certificate_number} onChange={e => updateForm('certificate_number', e.target.value.toUpperCase())} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Issue Date</Form.Label>
                <Form.Control type="date" value={form.issue_date} onChange={e => updateForm('issue_date', e.target.value)} />
              </Form.Group>
            </Col>

            {/* Keep asterisk and 'required' for the mandatory field */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>Expiry Date *</Form.Label>
                <Form.Control type="date" value={form.expiry_date} onChange={e => updateForm('expiry_date', e.target.value)} required />
              </Form.Group>
            </Col>
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
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
