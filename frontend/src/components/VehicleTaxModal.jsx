// import { useEffect, useState } from 'react';
// import { Modal, Button, Table, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
// import { toast } from 'react-toastify';
// import api from '../services/apiClient';

// // --- FIX: The formatDate function is no longer needed here ---
// // const formatDate = (dateString) => { ... };

// export default function VehicleTaxModal({ show, onHide, vehicle, onShowEdit }) {
//   const [items, setItems] = useState([]);
//   const [meta, setMeta] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState('');

//   const [form, setForm] = useState({
//     vehicle_type: '',
//     tax_mode: '',
//     tax_from: '',
//     tax_upto: '',
//     amount: '',
//   });
//   const [file, setFile] = useState(null);
//   const [saving, setSaving] = useState(false);

//   const load = async (page = 1) => {
//     if (!vehicle) return;
//     setLoading(true);
//     setErr('');
//     try {
//       const { data } = await api.get(`/vehicles/${vehicle.id}/taxes`, { params: { page } });
//       setItems(data.data || []);
//       setMeta(data.meta || null);
//     } catch (e) {
//       const msg = e?.response?.data?.message || 'Failed to load taxes';
//       setErr(msg);
//       toast.error(msg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (show) {
//       load(1);
//       setForm({ vehicle_type:'', tax_mode:'', tax_from:'', tax_upto:'', amount: '' });
//       setFile(null);
//     }
//   }, [show, vehicle]);

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
//       await api.post(`/vehicles/${vehicle.id}/taxes`, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });

//       setForm({ vehicle_type:'', tax_mode:'', tax_from:'', tax_upto:'', amount: '' });
//       setFile(null);
//       e.target.reset();

//       toast.success('Tax record added');
//       load(1);
//     } catch (e) {
//       const msg = e?.response?.data?.message || 'Failed to save';
//       setErr(msg);
//       toast.error(msg);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (taxId) => {
//     if (window.confirm('Are you sure you want to delete this tax record?')) {
//       try {
//         await api.delete(`/taxes/${taxId}`);
//         toast.success('Record deleted.');
//         load(meta?.current_page || 1);
//       } catch (e) {
//         toast.error(e?.response?.data?.message || 'Delete failed.');
//       }
//     }
//   };

//   if (!vehicle) return null;

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Taxes — {vehicle.registration_no}</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {err && <Alert variant="danger">{err}</Alert>}

//         <div className="table-responsive mb-4">
//           <Table bordered hover size="sm">
//             <thead>
//               <tr>
//                 <th>#</th>
//                 <th>Tax Mode</th>
//                 <th>From</th>
//                 <th>Upto</th>
//                 <th>Amount</th>
//                 <th>Document</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading && <tr><td colSpan={7} className="text-center"><Spinner size="sm" /></td></tr>}
//               {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center">No records</td></tr>}
//               {!loading && items.map((t, i)=>(
//                 <tr key={t.id}>
//                   <td>{(meta?.from ?? 1) + i}</td>
//                   <td>{t.tax_mode}</td>
//                   {/* --- FIX: Display the pre-formatted date directly from the API --- */}
//                   <td>{t.tax_from || '-'}</td>
//                   <td>{t.tax_upto || '-'}</td>
//                   <td>{t.amount ? `₹ ${t.amount}`: '-'}</td>
//                   <td>
//                     {t.file_path ? (
//                       <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${t.file_path}`} target="_blank" rel="noopener noreferrer">
//                         View
//                       </a>
//                     ) : ( 'N/A' )}
//                   </td>
//                   <td>
//                     <Button variant="outline-primary" size="sm" className="me-1" onClick={() => onShowEdit(t)}>Edit</Button>
//                     <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t.id)}>Delete</Button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </div>

//         <h5 className="mb-3">Add New Tax Record</h5>
//         <Form onSubmit={submit}>
//           <Row className="g-3">
//             <Col md={3}>
//               <Form.Group>
//                 <Form.Label>Tax Mode *</Form.Label>
//                 <Form.Select value={form.tax_mode} onChange={e=>setForm(f=>({...f, tax_mode:e.target.value}))} required>
//                   <option value="">Select</option>
//                   <option value="Monthly">Monthly</option>
//                   <option value="Quarterly">Quarterly</option>
//                   <option value="HalfYearly">HalfYearly</option>
//                   <option value="Yearly">Yearly</option>
//                   <option value="OneTime">OneTime</option>
//                 </Form.Select>
//               </Form.Group>
//             </Col>
//             <Col md={3}><Form.Group><Form.Label>From *</Form.Label><Form.Control type="date" value={form.tax_from} onChange={e=>setForm(f=>({...f, tax_from:e.target.value}))} required /></Form.Group></Col>
//             <Col md={3}><Form.Group><Form.Label>Upto *</Form.Label><Form.Control type="date" value={form.tax_upto} onChange={e=>setForm(f=>({...f, tax_upto:e.target.value}))} required /></Form.Group></Col>
//             <Col md={3}><Form.Group><Form.Label>Vehicle Type (opt)</Form.Label><Form.Control value={form.vehicle_type} onChange={e=>setForm(f=>({...f, vehicle_type:e.target.value}))} placeholder="LMV / MC" /></Form.Group></Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Tax Amount (₹)</Form.Label>
//                 <Form.Control type="number" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} placeholder="e.g., 1500.00" />
//               </Form.Group>
//             </Col>

//             <Col md={6}>
//               <Form.Group>
//                 <Form.Label>Upload Document (Optional)</Form.Label>
//                 <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
//               </Form.Group>
//             </Col>
//           </Row>
//           <div className="text-end mt-3">
//             <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Tax'}</Button>
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

export default function VehicleTaxModal({ show, onHide, vehicle, onShowEdit }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    vehicle_type: '',
    tax_mode: '',
    tax_from: '',
    tax_upto: '',
    amount: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async (page = 1) => {
    if (!vehicle) return;
    setLoading(true);
    setErr('');
    try {
      const { data } = await api.get(`/vehicles/${vehicle.id}/taxes`, { params: { page } });
      setItems(data.data || []);
      setMeta(data.meta || null);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to load taxes';
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      load(1);
      setForm({ vehicle_type:'', tax_mode:'', tax_from:'', tax_upto:'', amount: '' });
      setFile(null);
    }
  }, [show, vehicle]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');

    try {
        const payload = { ...form };
        Object.keys(payload).forEach(key => {
            if (payload[key] === '' || payload[key] === null) {
                delete payload[key];
            }
        });

        const formData = new FormData();
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));
        if (file) {
            formData.append('file', file);
        }

        await api.post(`/vehicles/${vehicle.id}/taxes`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        setForm({ vehicle_type:'', tax_mode:'', tax_from:'', tax_upto:'', amount: '' });
        setFile(null);
        e.target.reset();

        toast.success('Tax record added');
        load(1);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to save';
      setErr(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taxId) => {
    if (window.confirm('Are you sure you want to delete this tax record?')) {
      try {
        await api.delete(`/taxes/${taxId}`);
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
        <Modal.Title>Taxes — {vehicle.registration_no}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {err && <Alert variant="danger">{err}</Alert>}

        <div className="table-responsive mb-4">
          <Table bordered hover size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Tax Mode</th>
                <th>From</th>
                <th>Upto</th>
                <th>Amount</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center"><Spinner size="sm" /></td></tr>}
              {!loading && items.length === 0 && <tr><td colSpan={7} className="text-center">No records</td></tr>}
              {!loading && items.map((t, i)=>(
                <tr key={t.id}>
                  <td>{(meta?.from ?? 1) + i}</td>
                  <td>{t.tax_mode || '-'}</td>
                  <td>{t.tax_from || '-'}</td>
                  <td>{t.tax_upto || '-'}</td>
                  <td>{t.amount ? `₹ ${t.amount}`: '-'}</td>
                  <td>
                    {t.file_path ? (
                      <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${t.file_path}`} target="_blank" rel="noopener noreferrer">View</a>
                    ) : ( 'N/A' )}
                  </td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-1" onClick={() => onShowEdit(t)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(t.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        <h5 className="mb-3">Add New Tax Record</h5>
        <Form onSubmit={submit}>
          <Row className="g-3">
            {/* --- START OF THE FIX --- */}
            <Col md={3}>
              <Form.Group>
                <Form.Label>Tax Mode</Form.Label>
                <Form.Select value={form.tax_mode} onChange={e=>setForm(f=>({...f, tax_mode:e.target.value}))}>
                  <option value="">Select</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="HalfYearly">HalfYearly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="OneTime">OneTime</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}><Form.Group><Form.Label>From</Form.Label><Form.Control type="date" value={form.tax_from} onChange={e=>setForm(f=>({...f, tax_from:e.target.value}))} /></Form.Group></Col>

            {/* This field remains mandatory */}
            <Col md={3}><Form.Group><Form.Label>Upto *</Form.Label><Form.Control type="date" value={form.tax_upto} onChange={e=>setForm(f=>({...f, tax_upto:e.target.value}))} required /></Form.Group></Col>

            <Col md={3}><Form.Group><Form.Label>Vehicle Type (opt)</Form.Label><Form.Control value={form.vehicle_type} onChange={e=>setForm(f=>({...f, vehicle_type:e.target.value}))} placeholder="LMV / MC" /></Form.Group></Col>
            {/* --- END OF THE FIX --- */}

            <Col md={6}>
              <Form.Group>
                <Form.Label>Tax Amount (₹)</Form.Label>
                <Form.Control type="number" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))} placeholder="e.g., 1500.00" />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Upload Document (Optional)</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
              </Form.Group>
            </Col>
          </Row>
          <div className="text-end mt-3">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Tax'}</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
