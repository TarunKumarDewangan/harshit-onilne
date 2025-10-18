// import { useEffect, useState } from 'react';
// import { Modal, Button, Table, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
// import { toast } from 'react-toastify';
// import api from '../services/apiClient';

// export default function VehicleFitnessModal({ show, onHide, vehicle, onShowEdit }) {
//   const [items, setItems] = useState([]);
//   const [meta, setMeta] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   const [form, setForm] = useState({ certificate_number: '', issue_date: '', expiry_date: '' });
//   const [file, setFile] = useState(null);
//   const [saving, setSaving] = useState(false);

//   const load = async (page = 1) => {
//     if (!vehicle) return;
//     setLoading(true);
//     setErr('');
//     try {
//       const { data } = await api.get(`/vehicles/${vehicle.id}/fitnesses`, { params: { page } });
//       setItems(data.data || []);
//       setMeta(data.meta || null);
//     } catch (e) {
//       toast.error('Failed to load Fitness records.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (show) {
//       load(1);
//       setForm({ certificate_number: '', issue_date: '', expiry_date: '' });
//       setFile(null);
//     }
//   }, [show, vehicle]);

//   const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

//   const submit = async (e) => {
//     e.preventDefault();
//     setSaving(true);
//     setErr('');

//     const formData = new FormData();
//     Object.keys(form).forEach(key => formData.append(key, form[key]));
//     if (file) {
//       formData.append('file', file);
//     }

//     try {
//       await api.post(`/vehicles/${vehicle.id}/fitnesses`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       toast.success('Fitness record added.');
//       e.target.reset();
//       setForm({ certificate_number: '', issue_date: '', expiry_date: '' });
//       setFile(null);
//       load(1);
//     } catch (e) {
//       const msg = e?.response?.data?.message || 'Failed to save record.';
//       setErr(msg);
//       toast.error(msg);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Delete this Fitness record?')) {
//       try {
//         await api.delete(`/fitnesses/${id}`);
//         toast.success('Record deleted.');
//         load(meta?.current_page || 1);
//       }
//       catch (e) {
//         toast.error(e?.response?.data?.message || 'Delete failed.');
//       }
//     }
//   };

//   if (!vehicle) return null;

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Fitness Details — {vehicle.registration_no}</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {err && <Alert variant="danger">{err}</Alert>}
//         <div className="table-responsive mb-4">
//           <Table bordered hover size="sm">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Certificate No.</th>
//                 <th>Issue Date</th>
//                 <th>Expiry Date</th>
//                 <th>Document</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading && (
//                 <tr>
//                   <td colSpan={6} className="text-center">
//                     <Spinner size="sm" />
//                   </td>
//                 </tr>
//               )}
//               {!loading && items.length === 0 && (
//                 <tr>
//                   <td colSpan={6} className="text-center">No records found.</td>
//                 </tr>
//               )}
//               {!loading && items.map((item, i) => (
//                 <tr key={item.id}>
//                   <td>{(meta?.from ?? 1) + i}</td>
//                   <td>{item.certificate_number}</td>
//                   {/* --- START OF THE FIX --- */}
//                   {/* Directly use the pre-formatted date from the API */}
//                   <td>{item.issue_date || '-'}</td>
//                   <td>{item.expiry_date || '-'}</td>
//                   {/* --- END OF THE FIX --- */}
//                   <td>
//                     {item.file_path ? (
//                       <a
//                         href={`${import.meta.env.VITE_API_BASE_URL}/storage/${item.file_path}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                       >
//                         View
//                       </a>
//                     ) : 'N/A'}
//                   </td>
//                   <td>
//                     <Button
//                       variant="outline-primary"
//                       size="sm"
//                       className="me-1"
//                       onClick={() => onShowEdit(item)}
//                     >
//                       Edit
//                     </Button>
//                     <Button
//                       variant="outline-danger"
//                       size="sm"
//                       onClick={() => handleDelete(item.id)}
//                     >
//                       Delete
//                     </Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </div>

//         <h5 className="mb-3">Add New Fitness Certificate</h5>
//         <Form onSubmit={submit}>
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
//                 <Form.Label>Upload Document (Optional)</Form.Label>
//                 <Form.Control
//                   type="file"
//                   onChange={(e) => setFile(e.target.files[0])}
//                 />
//               </Form.Group>
//             </Col>
//           </Row>
//           <div className="text-end mt-3">
//             <Button type="submit" disabled={saving}>
//               {saving ? 'Saving...' : 'Add Fitness'}
//             </Button>
//           </div>
//         </Form>
//       </Modal.Body>
//     </Modal>
//   );
// }


import { useEffect, useState } from 'react';
import { Modal, Button, Table, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

export default function VehicleFitnessModal({ show, onHide, vehicle, onShowEdit }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({ certificate_number: '', issue_date: '', expiry_date: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async (page = 1) => {
    if (!vehicle) return;
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get(`/vehicles/${vehicle.id}/fitnesses`, { params: { page } });
      setItems(data.data || []);
      setMeta(data.meta || null);
    } catch (e) {
      toast.error('Failed to load Fitness records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      load(1);
      setForm({ certificate_number: '', issue_date: '', expiry_date: '' });
      setFile(null);
    }
  }, [show, vehicle]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
        // --- START OF THE FIX ---
        // Create a new payload object from the form state.
        const payload = { ...form };

        // Go through each key in the payload. If the value is an empty string,
        // DELETE the key from the payload entirely.
        Object.keys(payload).forEach(key => {
            if (payload[key] === '' || payload[key] === null) {
                delete payload[key];
            }
        });

        const formData = new FormData();
        // Append the cleaned payload data to FormData
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));

        if (file) {
            formData.append('file', file);
        }

        // Send the FormData object.
        await api.post(`/vehicles/${vehicle.id}/fitnesses`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // --- END OF THE FIX ---

        toast.success('Fitness record added.');
        e.target.reset(); // This is okay, but resetting form state is better
        setForm({ certificate_number: '', issue_date: '', expiry_date: '' }); // Explicitly reset state
        setFile(null);
        load(1);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to save record.';
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this Fitness record?')) {
      try {
        await api.delete(`/fitnesses/${id}`);
        toast.success('Record deleted.');
        load(meta?.current_page || 1);
      }
      catch (e) {
        toast.error(e?.response?.data?.message || 'Delete failed.');
      }
    }
  };

  if (!vehicle) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Fitness Details — {vehicle.registration_no}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {err && <Alert variant="danger">{err}</Alert>}
        <div className="table-responsive mb-4">
          <Table bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Certificate No.</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center"><Spinner size="sm" /></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={6} className="text-center">No records found.</td></tr>
              )}
              {!loading && items.map((item, i) => (
                <tr key={item.id}>
                  <td>{(meta?.from ?? 1) + i}</td>
                  <td>{item.certificate_number || '-'}</td>
                  <td>{item.issue_date || '-'}</td>
                  <td>{item.expiry_date || '-'}</td>
                  <td>
                    {item.file_path ? (
                      <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${item.file_path}`} target="_blank" rel="noopener noreferrer">View</a>
                    ) : 'N/A'}
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => onShowEdit(item)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <h5 className="mb-3">Add New Fitness Certificate</h5>
        <Form onSubmit={submit}>
          <Row className="g-3">
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

            <Col md={6}>
              <Form.Group>
                <Form.Label>Expiry Date *</Form.Label>
                <Form.Control type="date" value={form.expiry_date} onChange={e => updateForm('expiry_date', e.target.value)} required />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Upload Document (Optional)</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end mt-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Add Fitness'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
