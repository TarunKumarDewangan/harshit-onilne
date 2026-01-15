import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Table, Badge, Tabs, Tab, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/apiClient';

// Import all modals
import VehicleFormModal from '../components/VehicleFormModal';
import VehicleTaxModal from '../components/VehicleTaxModal';
import CitizenEditModal from '../components/CitizenEditModal';
import VehicleEditModal from '../components/VehicleEditModal';
import VehicleInsuranceModal from '../components/VehicleInsuranceModal';
import VehicleInsuranceEditModal from '../components/VehicleInsuranceEditModal';
import VehiclePuccModal from '../components/VehiclePuccModal';
import VehiclePuccEditModal from '../components/VehiclePuccEditModal';
import VehicleFitnessModal from '../components/VehicleFitnessModal';
import VehicleFitnessEditModal from '../components/VehicleFitnessEditModal';
import VehicleVltdModal from '../components/VehicleVltdModal';
import VehicleVltdEditModal from '../components/VehicleVltdEditModal';
import VehiclePermitModal from '../components/VehiclePermitModal';
import VehiclePermitEditModal from '../components/VehiclePermitEditModal';
import VehicleSpeedGovernorModal from '../components/VehicleSpeedGovernorModal';
import VehicleSpeedGovernorEditModal from '../components/VehicleSpeedGovernorEditModal';
import { toast } from 'react-toastify';
import SendMessageModal from '../components/SendMessageModal';
import VehicleTaxEditModal from '../components/VehicleTaxEditModal';

// Helper component with EVEN LARGER SIZES
const ValidityButton = ({ label, date, onClick, variant = 'outline-secondary' }) => (
    <div className="d-flex flex-column align-items-center" style={{ minWidth: '100px' }}>
        <Button
            size="sm"
            variant={variant}
            onClick={onClick}
            className="w-100 fw-bold"
            style={{ fontSize: '1rem', padding: '6px 10px' }}
        >
            {label}
        </Button>
        <small
            className="text-dark fw-bold mt-1"
            style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}
        >
            {date || '-'}
        </small>
    </div>
);

export default function CitizenProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const canWrite = useMemo(() => user && ['admin', 'manager'].includes(user.role), [user]);
  const isAdmin = user?.role === 'admin';

  const [citizen, setCitizen] = useState(null);
  const [err, setErr] = useState('');

  // Default tab is 'veh' (Vehicles)
  const [activeTab, setActiveTab] = useState('veh');

  const [veh, setVeh] = useState({ data: [], meta: null });
  const [allDetails, setAllDetails] = useState(null);
  const [loadingAllDetails, setLoadingAllDetails] = useState(false);

  // Modal State Variables
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [messagingCitizen, setMessagingCitizen] = useState(null);

  const [showVeh, setShowVeh] = useState(false);
  const [editingVeh, setEditingVeh] = useState(null);
  const [showVehEdit, setShowVehEdit] = useState(false);

  const [showInsurance, setShowInsurance] = useState(false);
  const [insuranceVehicle, setInsuranceVehicle] = useState(null);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [showInsuranceEdit, setShowInsuranceEdit] = useState(false);

  const [showPucc, setShowPucc] = useState(false);
  const [puccVehicle, setPuccVehicle] = useState(null);
  const [editingPucc, setEditingPucc] = useState(null);
  const [showPuccEdit, setShowPuccEdit] = useState(false);

  const [showTax, setShowTax] = useState(false);
  const [taxVehicle, setTaxVehicle] = useState(null);
  const [editingTax, setEditingTax] = useState(null);
  const [showTaxEdit, setShowTaxEdit] = useState(false);

  const [showEdit, setShowEdit] = useState(false);

  const [showFitness, setShowFitness] = useState(false);
  const [fitnessVehicle, setFitnessVehicle] = useState(null);
  const [editingFitness, setEditingFitness] = useState(null);
  const [showFitnessEdit, setShowFitnessEdit] = useState(false);

  const [showVltd, setShowVltd] = useState(false);
  const [vltdVehicle, setVltdVehicle] = useState(null);
  const [editingVltd, setEditingVltd] = useState(null);
  const [showVltdEdit, setShowVltdEdit] = useState(false);

  const [showPermit, setShowPermit] = useState(false);
  const [permitVehicle, setPermitVehicle] = useState(null);
  const [editingPermit, setEditingPermit] = useState(null);
  const [showPermitEdit, setShowPermitEdit] = useState(false);

  const [showSpeedGovernor, setShowSpeedGovernor] = useState(false);
  const [speedGovernorVehicle, setSpeedGovernorVehicle] = useState(null);
  const [editingSpeedGovernor, setEditingSpeedGovernor] = useState(null);
  const [showSpeedGovernorEdit, setShowSpeedGovernorEdit] = useState(false);

  // Initial Data Load
  const loadPageData = useCallback(async () => {
    setErr('');
    try {
      // Fetch Citizen Basic Info
      const citizenRes = await api.get(`/citizens/${id}`);
      setCitizen(citizenRes.data);

      // Fetch Vehicles List
      const vehiclesRes = await api.get(`/citizens/${id}/vehicles`);
      setVeh({ data: vehiclesRes.data.data || [], meta: vehiclesRes.data.meta || null });
    } catch {
      setErr('An error occurred while loading page data.');
      toast.error('Failed to load page data.');
    }
  }, [id]);

  // Lazy Load All Details
  const refreshAllDetails = useCallback(async () => {
    if (!id) return;
    setLoadingAllDetails(true);
    try {
      const { data } = await api.get(`/citizens/${id}/all-details`);
      setAllDetails(data);
    } catch {
      toast.error('Failed to refresh complete details.');
    } finally {
      setLoadingAllDetails(false);
    }
  }, [id]);

  useEffect(() => {
    loadPageData();
  }, [id, loadPageData]);

  // Tab Switch Handler
  const handleTabSelect = (key) => {
    setActiveTab(key);
    if (key === 'all' && !allDetails) {
      refreshAllDetails();
    }
  };

  // Handlers
  const handleShowSendMessage = (citizenRecord) => {
    setMessagingCitizen(citizenRecord);
    setShowSendMessage(true);
  };

  const deleteCitizen = async () => {
    if (!isAdmin) return;
    if (!window.confirm('Delete this citizen and all related records?')) return;
    try {
      await api.delete(`/citizens/${id}`);
      toast.success('Citizen deleted');
      nav('/citizens');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Delete failed');
    }
  };

  const handleVehEdit = (record) => { setEditingVeh(record); setShowVehEdit(true); };

  const handleVehDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this Vehicle record?')) return;
    try {
      await api.delete(`/vehicles/${recordId}`);
      toast.success('Vehicle deleted.');
      await loadPageData();
      if (activeTab === 'all') await refreshAllDetails();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Vehicle delete failed.');
    }
  };

  // Modal Open Handlers
  const handleShowInsurance = (vehicle) => { setInsuranceVehicle(vehicle); setShowInsurance(true); };
  const handleShowInsuranceEdit = (insuranceRecord) => { setEditingInsurance(insuranceRecord); setShowInsuranceEdit(true); };
  const handleShowPucc = (vehicle) => { setPuccVehicle(vehicle); setShowPucc(true); };
  const handleShowPuccEdit = (puccRecord) => { setEditingPucc(puccRecord); setShowPuccEdit(true); };
  const handleShowFitness = (vehicle) => { setFitnessVehicle(vehicle); setShowFitness(true); };
  const handleShowFitnessEdit = (record) => { setEditingFitness(record); setShowFitnessEdit(true); };
  const handleShowVltd = (vehicle) => { setVltdVehicle(vehicle); setShowVltd(true); };
  const handleShowVltdEdit = (record) => { setEditingVltd(record); setShowVltdEdit(true); };
  const handleShowPermit = (vehicle) => { setPermitVehicle(vehicle); setShowPermit(true); };
  const handleShowPermitEdit = (record) => { setEditingPermit(record); setShowPermitEdit(true); };
  const handleShowSpeedGovernor = (vehicle) => { setSpeedGovernorVehicle(vehicle); setShowSpeedGovernor(true); };
  const handleShowSpeedGovernorEdit = (record) => { setEditingSpeedGovernor(record); setShowSpeedGovernorEdit(true); };
  const handleShowTaxEdit = (taxRecord) => { setEditingTax(taxRecord); setShowTaxEdit(true); };


  if (err) return <Container className="py-4"><Alert variant="danger">{err}</Alert></Container>;
  if (!citizen) return <Container className="py-4 text-center"><Spinner /></Container>;

  return (
    <Container className="py-4">
      {/* Header Section */}
      <Row className="mb-3 align-items-center">
        <Col><Link to="/citizens" className="text-decoration-none">&larr; Back to list</Link></Col>
        <Col className="text-end profile-actions">
          <Button as={Link} to={`/citizens/${id}/expired`} size="sm" variant="outline-warning" className="me-2">Check Expiries</Button>
          {canWrite && <Button size="sm" variant="outline-success" className="me-2" onClick={() => handleShowSendMessage(citizen)}>Send Message</Button>}
          {canWrite && <Button size="sm" className="me-2" onClick={() => setShowEdit(true)}>Edit</Button>}
          {isAdmin && <Button size="sm" variant="outline-danger" onClick={deleteCitizen}>Delete</Button>}
        </Col>
      </Row>

      {/* Citizen Info Card */}
      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h4 className="mb-1">{citizen.name}</h4>
              <div className="text-muted">{citizen.relation_type && citizen.relation_name ? `${citizen.relation_type}: ${citizen.relation_name}` : 'Relation: -'}</div>
              <div className="mt-2"><strong>Mobile:</strong> {citizen.mobile}&nbsp;&nbsp;<strong>Email:</strong> {citizen.email || '-'}</div>
              <div className="mt-1"><strong>Birth Date:</strong> {citizen.dob || '-'}&nbsp;&nbsp;<strong>Age:</strong> {citizen.age ? `${citizen.age} years` : '-'}</div>
              <div className="mt-1"><strong>Address:</strong> {citizen.address || '-'}</div>
              <div className="mt-1"><strong>City:</strong> {citizen.city || '-'}&nbsp;&nbsp;<strong>State:</strong> {citizen.state || '-'}</div>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <Badge bg="light" text="dark" className="me-1">LL {citizen.learner_licenses_count ?? 0}</Badge>
              <Badge bg="light" text="dark" className="me-1">DL {citizen.driving_licenses_count ?? 0}</Badge>
              <Badge bg="light" text="dark">Veh {citizen.vehicles_count ?? 0}</Badge>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onSelect={(k) => handleTabSelect(k)} className="mb-3">
        <Tab eventKey="veh" title="Vehicles">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-semibold">Vehicle Records</div>
            {canWrite && <Button size="sm" onClick={() => setShowVeh(true)}>+ Add Vehicle</Button>}
          </div>
          <div className="table-responsive">
            <Table bordered hover size="sm" className="vehicle-table align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Registration</th>
                  <th style={{ minWidth: '750px' }}>Validities & Actions</th> {/* Increased width container */}
                  <th>Type</th>
                  <th>Make/Model</th>
                  <th>Chassis</th>
                  <th>Engine</th>
                </tr>
              </thead>
              <tbody>
                {veh.data.length > 0 ? (
                  veh.data.map((r, i) => (
                    <tr key={r.id}>
                      <td>{(veh.meta?.from ?? 1) + i}</td>
                      <td>
                        <div className="fw-bold">{r.registration_no}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center" style={{ gap: '0.75rem' }}>
                            {/* Validity Buttons with Dates */}
                            <div className="d-flex" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
                                <ValidityButton label="Tax" date={r.latest_tax_expiry} onClick={() => { setTaxVehicle(r); setShowTax(true); }} />
                                <ValidityButton label="Ins" date={r.latest_insurance_expiry} onClick={() => handleShowInsurance(r)} variant="outline-info" />
                                <ValidityButton label="PUCC" date={r.latest_pucc_expiry} onClick={() => handleShowPucc(r)} variant="outline-success" />
                                <ValidityButton label="Fit" date={r.latest_fitness_expiry} onClick={() => handleShowFitness(r)} />
                                <ValidityButton label="VLTd" date={r.latest_vltd_expiry} onClick={() => handleShowVltd(r)} />
                                <ValidityButton label="Permit" date={r.latest_permit_expiry} onClick={() => handleShowPermit(r)} />
                                <ValidityButton label="Speed" date={r.latest_speed_governor_expiry} onClick={() => handleShowSpeedGovernor(r)} />
                            </div>

                            <div className="vr mx-2" style={{height: '50px'}}></div>

                            {/* Action Buttons */}
                            <ButtonGroup vertical>
                                <Button variant="outline-primary" size="sm" onClick={() => handleVehEdit(r)}>Edit</Button>
                                {isAdmin && (
                                    <Button variant="outline-danger" size="sm" onClick={() => handleVehDelete(r.id)}>Delete</Button>
                                )}
                            </ButtonGroup>
                        </div>
                      </td>
                      <td>{r.type || '-'}</td>
                      <td>{r.make_model || '-'}</td>
                      <td>{r.chassis_no || '-'}</td>
                      <td>{r.engine_no || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="text-center">No records</td></tr>
                )}
              </tbody>
            </Table>
          </div>
        </Tab>

        <Tab eventKey="all" title="All Details">
          {loadingAllDetails && <div className="text-center my-4"><Spinner animation="border" /></div>}
          {!loadingAllDetails && !allDetails && <Alert variant="info">Click the tab again to load details.</Alert>}
          {allDetails && (
            <div>
              {/* Detailed Breakdown for each vehicle */}
              {allDetails.vehicles && allDetails.vehicles.map(vehicle => (
                <Card key={vehicle.id} className="mb-3">
                  <Card.Header as="h5" className="bg-light">Vehicle: {vehicle.registration_no}</Card.Header>
                  <Card.Body>
                    <Row>
                      {vehicle.insurances && vehicle.insurances.length > 0 && <Col md={6} className="mb-3">
                        <h6>Insurance Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Policy #</th><th>Company</th><th>Expiry</th></tr></thead><tbody>{vehicle.insurances.map(ins => <tr key={ins.id}><td>{ins.policy_number}</td><td>{ins.company_name}</td><td>{ins.end_date}</td></tr>)}</tbody></Table>
                      </Col>}
                      {vehicle.taxes && vehicle.taxes.length > 0 && <Col md={6} className="mb-3">
                        <h6>Tax Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Mode</th><th>From</th><th>Upto</th></tr></thead><tbody>{vehicle.taxes.map(tax => <tr key={tax.id}><td>{tax.tax_mode}</td><td>{tax.tax_from}</td><td>{tax.tax_upto}</td></tr>)}</tbody></Table>
                      </Col>}
                      {vehicle.puccs && vehicle.puccs.length > 0 && <Col md={6} className="mb-3">
                        <h6>PUCC Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Number</th><th>From</th><th>Until</th></tr></thead><tbody>{vehicle.puccs.map(pucc => <tr key={pucc.id}><td>{pucc.pucc_number}</td><td>{pucc.valid_from}</td><td>{pucc.valid_until}</td></tr>)}</tbody></Table>
                      </Col>}
                      {vehicle.fitnesses && vehicle.fitnesses.length > 0 && <Col md={6} className="mb-3">
                        <h6>Fitness Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Certificate #</th><th>Expiry</th></tr></thead><tbody>{vehicle.fitnesses.map(fit => <tr key={fit.id}><td>{fit.certificate_number}</td><td>{fit.expiry_date}</td></tr>)}</tbody></Table>
                      </Col>}
                      {vehicle.permits && vehicle.permits.length > 0 && <Col md={6} className="mb-3">
                        <h6>Permit Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Permit #</th><th>Expiry</th></tr></thead><tbody>{vehicle.permits.map(p => <tr key={p.id}><td>{p.permit_number}</td><td>{p.expiry_date}</td></tr>)}</tbody></Table>
                      </Col>}
                      {vehicle.vltds && vehicle.vltds.length > 0 && <Col md={6} className="mb-3">
                        <h6>VLTd Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Cert #</th><th>Expiry</th></tr></thead><tbody>{vehicle.vltds.map(p => <tr key={p.id}><td>{p.certificate_number}</td><td>{p.expiry_date}</td></tr>)}</tbody></Table>
                      </Col>}
                       {vehicle.speed_governors && vehicle.speed_governors.length > 0 && <Col md={6} className="mb-3">
                        <h6>Speed Governor Records</h6>
                        <Table striped bordered size="sm"><thead><tr><th>Cert #</th><th>Expiry</th></tr></thead><tbody>{vehicle.speed_governors.map(p => <tr key={p.id}><td>{p.certificate_number}</td><td>{p.expiry_date}</td></tr>)}</tbody></Table>
                      </Col>}
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Tab>
      </Tabs>

      {/* All modals at the bottom of the file remain exactly the same */}
      <SendMessageModal show={showSendMessage} onHide={() => setShowSendMessage(false)} citizen={messagingCitizen} />
      <CitizenEditModal show={showEdit} onHide={() => setShowEdit(false)} citizen={citizen} onUpdated={() => { loadPageData(); refreshAllDetails(); }} />
      <VehicleEditModal show={showVehEdit} onHide={() => setShowVehEdit(false)} vehicleRecord={editingVeh} onUpdated={() => { setShowVehEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehicleInsuranceEditModal show={showInsuranceEdit} onHide={() => setShowInsuranceEdit(false)} insuranceRecord={editingInsurance} onUpdated={() => { setShowInsuranceEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehiclePuccEditModal show={showPuccEdit} onHide={() => setShowPuccEdit(false)} puccRecord={editingPucc} onUpdated={() => { setShowPuccEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehicleFitnessEditModal show={showFitnessEdit} onHide={() => setShowFitnessEdit(false)} record={editingFitness} onUpdated={() => { setShowFitnessEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehicleVltdEditModal show={showVltdEdit} onHide={() => setShowVltdEdit(false)} record={editingVltd} onUpdated={() => { setShowVltdEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehiclePermitEditModal show={showPermitEdit} onHide={() => setShowPermitEdit(false)} record={editingPermit} onUpdated={() => { setShowPermitEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehicleSpeedGovernorEditModal show={showSpeedGovernorEdit} onHide={() => setShowSpeedGovernorEdit(false)} record={editingSpeedGovernor} onUpdated={() => { setShowSpeedGovernorEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehicleTaxModal show={showTax} onHide={() => { setShowTax(false); loadPageData(); refreshAllDetails(); }} vehicle={taxVehicle} onShowEdit={handleShowTaxEdit} />
      <VehicleTaxEditModal show={showTaxEdit} onHide={() => setShowTaxEdit(false)} record={editingTax} onUpdated={() => { setShowTaxEdit(false); loadPageData(); refreshAllDetails(); }} />
      <VehicleFormModal show={showVeh} onHide={() => setShowVeh(false)} citizenId={id} onCreated={() => { loadPageData(); refreshAllDetails(); }} />
      <VehicleInsuranceModal show={showInsurance} onHide={() => setShowInsurance(false)} vehicle={insuranceVehicle} onShowEdit={handleShowInsuranceEdit} />
      <VehiclePuccModal show={showPucc} onHide={() => setShowPucc(false)} vehicle={puccVehicle} onShowEdit={handleShowPuccEdit} />
      <VehicleFitnessModal show={showFitness} onHide={() => setShowFitness(false)} vehicle={fitnessVehicle} onShowEdit={handleShowFitnessEdit} />
      <VehicleVltdModal show={showVltd} onHide={() => setShowVltd(false)} vehicle={vltdVehicle} onShowEdit={handleShowVltdEdit} />
      <VehiclePermitModal show={showPermit} onHide={() => setShowPermit(false)} vehicle={permitVehicle} onShowEdit={handleShowPermitEdit} />
      <VehicleSpeedGovernorModal show={showSpeedGovernor} onHide={() => setShowSpeedGovernor(false)} vehicle={speedGovernorVehicle} onShowEdit={handleShowSpeedGovernorEdit} />
    </Container>
  );
}
