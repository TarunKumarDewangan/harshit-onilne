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

// export default function VehicleTaxEditModal({ show, onHide, record, onUpdated }) {
//   const [form, setForm] = useState({
//     vehicle_type: '',
//     tax_mode: '',
//     tax_from: '',
//     tax_upto: '',
//     amount: '',
//   });
//   const [file, setFile] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (record) {
//       // --- START OF THE FIX (PART 2) ---
//       // Use the new helper function to correctly format the dates for the form.
//       setForm({
//         vehicle_type: record.vehicle_type || '',
//         tax_mode: record.tax_mode || '',
//         tax_from: formatDateForInput(record.tax_from),
//         tax_upto: formatDateForInput(record.tax_upto),
//         amount: record.amount || '',
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
//     setSaving(true);
//     setError('');

//     const formData = new FormData();
//     Object.keys(form).forEach(key => formData.append(key, form[key]));
//     if (file) {
//       formData.append('file', file);
//     }
//     formData.append('_method', 'PUT');

//     try {
//       await api.post(`/taxes/${record.id}`, formData, {
//          headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       toast.success('Tax record updated successfully.');
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
//         <Modal.Header closeButton><Modal.Title>Edit Tax Record</Modal.Title></Modal.Header>
//         <Modal.Body>
//           {error && <Alert variant="danger">{error}</Alert>}
//           <Row className="g-3">
//              <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Tax Mode *</Form.Label>
//                 <Form.Select value={form.tax_mode} onChange={e => updateForm('tax_mode', e.target.value)} required>
//                   <option value="">Select</option>
//                   <option value="Monthly">Monthly</option>
//                   <option value="Quarterly">Quarterly</option>
//                   <option value="HalfYearly">HalfYearly</option>
//                   <option value="Yearly">Yearly</option>
//                   <option value="OneTime">OneTime</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//              <Col md={6}><Form.Group><Form.Label>Vehicle Type (opt)</Form.Label><Form.Control value={form.vehicle_type} onChange={e => updateForm('vehicle_type', e.target.value)} placeholder="LMV / MC" /></Form.Group></Col>
//              <Col md={6}><Form.Group><Form.Label>From *</Form.Label><Form.Control type="date" value={form.tax_from} onChange={e => updateForm('tax_from', e.target.value)} required /></Form.Group></Col>
//              <Col md={6}><Form.Group><Form.Label>Upto *</Form.Label><Form.Control type="date" value={form.tax_upto} onChange={e => updateForm('tax_upto', e.target.value)} required /></Form.Group></Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Tax Amount (₹)</Form.Label>
//                 <Form.Control type="number" step="0.01" value={form.amount} onChange={e => updateForm('amount', e.target.value)} placeholder="e.g., 1500.00" />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
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

export default function VehicleTaxEditModal({ show, onHide, record, onUpdated }) {
  const [form, setForm] = useState({
    vehicle_type: '',
    tax_mode: '',
    tax_from: '',
    tax_upto: '',
    amount: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (record) {
      setForm({
        vehicle_type: record.vehicle_type || '',
        tax_mode: record.tax_mode || '',
        tax_from: formatDateForInput(record.tax_from),
        tax_upto: formatDateForInput(record.tax_upto),
        amount: record.amount || '',
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
      await api.post(`/taxes/${record.id}`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Tax record updated successfully.');
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
        <Modal.Header closeButton><Modal.Title>Edit Tax Record</Modal.Title></Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3">
             {/* --- START OF THE FIX (2/2) --- */}
             {/* Remove asterisk and 'required' from optional fields */}
             <Col md={6}>
              <Form.Group>
                <Form.Label>Tax Mode</Form.Label>
                <Form.Select value={form.tax_mode} onChange={e => updateForm('tax_mode', e.target.value)}>
                  <option value="">Select</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="HalfYearly">HalfYearly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="OneTime">OneTime</option>
                </Form.Select>
              </Form.Group>
            </Col>
             <Col md={6}><Form.Group><Form.Label>Vehicle Type (opt)</Form.Label><Form.Control value={form.vehicle_type} onChange={e => updateForm('vehicle_type', e.target.value)} placeholder="LMV / MC" /></Form.Group></Col>
             <Col md={6}><Form.Group><Form.Label>From</Form.Label><Form.Control type="date" value={form.tax_from} onChange={e => updateForm('tax_from', e.target.value)} /></Form.Group></Col>

             {/* Keep asterisk and 'required' for the mandatory field */}
             <Col md={6}><Form.Group><Form.Label>Upto *</Form.Label><Form.Control type="date" value={form.tax_upto} onChange={e => updateForm('tax_upto', e.target.value)} required /></Form.Group></Col>
            {/* --- END OF THE FIX --- */}

            <Col md={6}>
              <Form.Group>
                <Form.Label>Tax Amount (₹)</Form.Label>
                <Form.Control type="number" step="0.01" value={form.amount} onChange={e => updateForm('amount', e.target.value)} placeholder="e.g., 1500.00" />
              </Form.Group>
            </Col>

            <Col md={6}>
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
