import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Table, Spinner, Alert, Badge, Button, ButtonGroup } from 'react-bootstrap';
import api from '../services/apiClient';
import { toast } from 'react-toastify';

// Import all edit modals
import LLEditModal from '../components/LLEditModal';
import DLEditModal from '../components/DLEditModal';
import VehicleInsuranceEditModal from '../components/VehicleInsuranceEditModal';
import VehiclePuccEditModal from '../components/VehiclePuccEditModal';
import VehicleFitnessEditModal from '../components/VehicleFitnessEditModal';
import VehiclePermitEditModal from '../components/VehiclePermitEditModal';
import VehicleVltdEditModal from '../components/VehicleVltdEditModal';
import VehicleSpeedGovernorEditModal from '../components/VehicleSpeedGovernorEditModal';
import VehicleTaxEditModal from '../components/VehicleTaxEditModal';

export default function ExpiredDocumentsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingNoticeId, setSendingNoticeId] = useState(null);

  // Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [showLLEdit, setShowLLEdit] = useState(false);
  const [showDLEdit, setShowDLEdit] = useState(false);
  const [showInsuranceEdit, setShowInsuranceEdit] = useState(false);
  const [showPuccEdit, setShowPuccEdit] = useState(false);
  const [showFitnessEdit, setShowFitnessEdit] = useState(false);
  const [showPermitEdit, setShowPermitEdit] = useState(false);
  const [showVltdEdit, setShowVltdEdit] = useState(false);
  const [showSpeedGovernorEdit, setShowSpeedGovernorEdit] = useState(false);
  const [showTaxEdit, setShowTaxEdit] = useState(false);

  const fetchExpiredDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/citizens/${id}/expired-documents`);
      setData(response.data);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load expired documents.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpiredDocs();
  }, [fetchExpiredDocs]);

  const handleSendNotice = async (doc) => {
    if (!window.confirm(`Send expiry notification to ${data.citizen.name}?`)) return;

    // Create a unique ID for the loading state (e.g., "Tax-15")
    const uniqueId = `${doc.type}-${doc.full_record.id}`;
    setSendingNoticeId(uniqueId);

    try {
        const payload = {
            type: doc.type,
            owner_mobile: data.citizen.mobile,
            identifier: doc.identifier,
            expiry_date: doc.expiry_date,
        };
        await api.post('/reports/expiries/send-notification', payload);
        toast.success('Notification sent successfully!');
    } catch (err) {
        toast.error('Failed to send notification.');
    } finally {
        setSendingNoticeId(null);
    }
  };

  const handleUpdate = (doc) => {
    setEditingRecord(doc.full_record);
    switch (doc.type) {
        case 'Learner License': setShowLLEdit(true); break;
        case 'Driving License': setShowDLEdit(true); break;
        case 'Insurance': setShowInsuranceEdit(true); break;
        case 'PUCC': setShowPuccEdit(true); break;
        case 'Fitness': setShowFitnessEdit(true); break;
        case 'Permit': setShowPermitEdit(true); break;
        case 'VLTd': setShowVltdEdit(true); break;
        case 'Speed Governor': setShowSpeedGovernorEdit(true); break;
        case 'Tax': setShowTaxEdit(true); break;
        default: toast.error('Unknown document type.');
    }
  };

  const renderContent = () => {
    if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!data) return <Alert variant="info">No data found.</Alert>;

    const { citizen, expired_documents } = data;

    return (
      <Card>
        <Card.Header as="h5">Expired Document Report for {citizen.name}</Card.Header>
        <Card.Body>
          {expired_documents.length === 0 ? (
            <Alert variant="success" className="mb-0">No expired documents found for this citizen.</Alert>
          ) : (
            <div className="table-responsive">
                <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                    <th>#</th>
                    <th>Document Type</th>
                    <th>Identifier / Number</th>
                    <th>Mobile</th> {/* --- ADDED MOBILE COLUMN --- */}
                    <th>Expiry Date</th>

                    <th>Actions</th> {/* --- ADDED ACTIONS COLUMN --- */}
                    </tr>
                </thead>
                <tbody>
                    {expired_documents.map((doc, index) => (
                    <tr key={index}>
                        <td>{index + 1}</td>
                        <td><Badge bg="danger">{doc.type}</Badge></td>
                        <td>{doc.identifier}</td>
                        <td>{citizen.mobile}</td> {/* --- DISPLAY MOBILE --- */}
                        <td>{doc.expiry_date}</td>

                        <td>
                            {/* --- ADDED ACTION BUTTONS --- */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-primary" onClick={() => handleUpdate(doc)}>Update</Button>
                                <Button
                                    variant="outline-info"
                                    onClick={() => handleSendNotice(doc)}
                                    disabled={sendingNoticeId === `${doc.type}-${doc.full_record.id}`}
                                >
                                    {sendingNoticeId === `${doc.type}-${doc.full_record.id}` ? 'Sending...' : 'Send'}
                                </Button>
                            </ButtonGroup>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="py-4">
      <div className="mb-3">
        <Link to={`/citizens/${id}`} className="text-decoration-none">&larr; Back to Citizen Profile</Link>
      </div>
      {renderContent()}

      {/* --- RENDER ALL EDIT MODALS --- */}
      <LLEditModal show={showLLEdit} onHide={() => setShowLLEdit(false)} llRecord={editingRecord} onUpdated={() => { setShowLLEdit(false); fetchExpiredDocs(); }} />
      <DLEditModal show={showDLEdit} onHide={() => setShowDLEdit(false)} dlRecord={editingRecord} onUpdated={() => { setShowDLEdit(false); fetchExpiredDocs(); }} />
      <VehicleInsuranceEditModal show={showInsuranceEdit} onHide={() => setShowInsuranceEdit(false)} insuranceRecord={editingRecord} onUpdated={() => { setShowInsuranceEdit(false); fetchExpiredDocs(); }} />
      <VehiclePuccEditModal show={showPuccEdit} onHide={() => setShowPuccEdit(false)} puccRecord={editingRecord} onUpdated={() => { setShowPuccEdit(false); fetchExpiredDocs(); }} />
      <VehicleFitnessEditModal show={showFitnessEdit} onHide={() => setShowFitnessEdit(false)} record={editingRecord} onUpdated={() => { setShowFitnessEdit(false); fetchExpiredDocs(); }} />
      <VehiclePermitEditModal show={showPermitEdit} onHide={() => setShowPermitEdit(false)} record={editingRecord} onUpdated={() => { setShowPermitEdit(false); fetchExpiredDocs(); }} />
      <VehicleVltdEditModal show={showVltdEdit} onHide={() => setShowVltdEdit(false)} record={editingRecord} onUpdated={() => { setShowVltdEdit(false); fetchExpiredDocs(); }} />
      <VehicleSpeedGovernorEditModal show={showSpeedGovernorEdit} onHide={() => setShowSpeedGovernorEdit(false)} record={editingRecord} onUpdated={() => { setShowSpeedGovernorEdit(false); fetchExpiredDocs(); }} />
      <VehicleTaxEditModal show={showTaxEdit} onHide={() => setShowTaxEdit(false)} record={editingRecord} onUpdated={() => { setShowTaxEdit(false); fetchExpiredDocs(); }} />
    </Container>
  );
}
