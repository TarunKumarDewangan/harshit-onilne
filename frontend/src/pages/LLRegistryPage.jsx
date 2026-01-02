import { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Table, Spinner, Badge, Pagination, Row, Col } from 'react-bootstrap';
import api from '../services/apiClient';
import LLRegistryModal from '../components/LLRegistryModal';
import { toast } from 'react-toastify';

export default function LLRegistryPage() {
    const [list, setList] = useState([]);
    const [meta, setMeta] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
    // --- START OF NEW STATE ---
    const [expiryFrom, setExpiryFrom] = useState('');
    const [expiryTo, setExpiryTo] = useState('');
    // --- END OF NEW STATE ---

    const [sendingId, setSendingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            // --- START OF MODIFIED PARAMS ---
            const params = {
                page,
                search,
                show_unpaid: showUnpaidOnly,
                expiry_from: expiryFrom,
                expiry_to: expiryTo
            };
            // --- END OF MODIFIED PARAMS ---

            const { data } = await api.get('/ll-registry', { params });
            setList(data.data);
            setMeta(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Live Search & Filter Trigger
    useEffect(() => {
        const timeout = setTimeout(() => { fetchData(1); }, 500);
        return () => clearTimeout(timeout);
    }, [search, showUnpaidOnly, expiryFrom, expiryTo]); // Added date dependencies

    // ... (handleAdd, handleEdit, handleDelete, handleSendMessage remain exactly the same) ...
    const handleAdd = () => { setEditingRecord(null); setShowModal(true); };
    const handleEdit = (rec) => { setEditingRecord(rec); setShowModal(true); };
    const handleDelete = async (id) => {
        if(window.confirm("Delete this entry permanently?")) {
            await api.delete(`/ll-registry/${id}`);
            toast.success("Deleted");
            fetchData(meta?.current_page || 1);
        }
    };
    const handleSendMessage = async (item) => {
        if(!window.confirm(`Send WhatsApp message to ${item.name}?`)) return;
        setSendingId(item.id);
        try {
            await api.post(`/ll-registry/${item.id}/send-message`);
            toast.success("Message sent!");
        } catch (e) {
            toast.error("Failed to send message.");
        } finally {
            setSendingId(null);
        }
    };

    const resetFilters = () => {
        setSearch('');
        setExpiryFrom('');
        setExpiryTo('');
        setShowUnpaidOnly(false);
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Learning License Registry</h3>
                <Button onClick={handleAdd}>+ New Entry</Button>
            </div>

            <Card className="mb-3">
                <Card.Body>
                    <Row className="g-2 align-items-end">
                        <Col md={4}>
                            <Form.Label className="small text-muted">Search Text</Form.Label>
                            <Form.Control
                                placeholder="Name, Mobile, App No..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Col>
                        {/* --- START OF DATE FILTERS --- */}
                        <Col md={2}>
                            <Form.Label className="small text-muted">Expiry From</Form.Label>
                            <Form.Control
                                type="date"
                                value={expiryFrom}
                                onChange={(e) => setExpiryFrom(e.target.value)}
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small text-muted">Expiry To</Form.Label>
                            <Form.Control
                                type="date"
                                value={expiryTo}
                                onChange={(e) => setExpiryTo(e.target.value)}
                            />
                        </Col>
                        {/* --- END OF DATE FILTERS --- */}
                        <Col md={2}>
                             <Form.Check
                                type="switch"
                                id="unpaid-switch"
                                label="Pending Dues"
                                checked={showUnpaidOnly}
                                onChange={(e) => setShowUnpaidOnly(e.target.checked)}
                                className="fw-bold text-danger mb-2"
                            />
                        </Col>
                        <Col md={2}>
                            <Button variant="secondary" className="w-100" onClick={resetFilters}>Reset</Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <div className="table-responsive">
                <Table striped bordered hover size="sm" className="align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>App / LL No</th>
                            <th>DOB</th>
                            <th>Dates (Start - End)</th>
                            <th>Fees (Ask/Paid)</th>
                            <th>Bal</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan={9} className="text-center"><Spinner size="sm"/></td></tr> :
                         list.length === 0 ? <tr><td colSpan={9} className="text-center">No records found.</td></tr> :
                         list.map((item, idx) => (
                            <tr key={item.id}>
                                <td>{(meta?.from || 1) + idx}</td>
                                <td className="fw-bold">{item.name}</td>
                                <td>{item.mobile}</td>
                                <td>
                                    <div><span className="text-muted">App:</span> {item.application_no || '-'}</div>
                                    <div><span className="text-muted">LL:</span> <span className="text-primary">{item.ll_no || '-'}</span></div>
                                </td>
                                <td>{item.dob || '-'}</td>
                                <td>
                                    <div className="small text-muted">
                                        {item.start_date || '?'} <br/> to {item.end_date || '?'}
                                    </div>
                                </td>
                                <td>
                                    <div>Ask: {item.payment_asked}</div>
                                    <div className="text-success">Pd: {item.payment_paid}</div>
                                </td>
                                <td>
                                    <Badge bg={(item.payment_asked - item.payment_paid) > 0 ? 'danger' : 'success'}>
                                        {item.payment_asked - item.payment_paid}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            className="py-0 px-2"
                                            onClick={() => handleSendMessage(item)}
                                            disabled={sendingId === item.id}
                                        >
                                            {sendingId === item.id ? '...' : <i className="bi bi-whatsapp"></i>} Send
                                        </Button>
                                        <Button variant="link" size="sm" className="p-0" onClick={() => handleEdit(item)}>Edit</Button>
                                        <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDelete(item.id)}>Del</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="d-flex justify-content-end">
                    <Pagination>
                        <Pagination.Prev onClick={() => fetchData(meta.current_page - 1)} disabled={meta.current_page === 1} />
                        <Pagination.Item active>{meta.current_page}</Pagination.Item>
                        <Pagination.Next onClick={() => fetchData(meta.current_page + 1)} disabled={meta.current_page === meta.last_page} />
                    </Pagination>
                </div>
            )}

            <LLRegistryModal
                show={showModal}
                onHide={() => setShowModal(false)}
                record={editingRecord}
                onSaved={() => fetchData(meta?.current_page || 1)}
            />
        </Container>
    );
}
