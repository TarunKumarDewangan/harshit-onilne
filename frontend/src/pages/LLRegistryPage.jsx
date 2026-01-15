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

    // Filters
    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
    const [expiryFrom, setExpiryFrom] = useState('');
    const [expiryTo, setExpiryTo] = useState('');
    const [cross31Days, setCross31Days] = useState(false);
    const [expiresInMonth, setExpiresInMonth] = useState(false);

    const [sendingId, setSendingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const fetchData = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                search,
                show_unpaid: showUnpaidOnly,
                expiry_from: expiryFrom,
                expiry_to: expiryTo,
                cross_31_days: cross31Days,
                expires_in_month: expiresInMonth
            };

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
    }, [search, showUnpaidOnly, expiryFrom, expiryTo, cross31Days, expiresInMonth]);

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
        setCross31Days(false);
        setExpiresInMonth(false);
    };

    const toggleCross31 = (checked) => {
        setCross31Days(checked);
        if(checked) setExpiresInMonth(false);
    }

    const toggleExpiresSoon = (checked) => {
        setExpiresInMonth(checked);
        if(checked) setCross31Days(false);
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Learning License Registry</h3>
                <Button onClick={handleAdd}>+ New Entry</Button>
            </div>

            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="small text-muted fw-bold">Search Text</Form.Label>
                            <Form.Control
                                placeholder="Name, Mobile, App No, Given By..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small text-muted fw-bold">Expiry From</Form.Label>
                            <Form.Control type="date" value={expiryFrom} onChange={(e) => setExpiryFrom(e.target.value)} />
                        </Col>
                        <Col md={2}>
                            <Form.Label className="small text-muted fw-bold">Expiry To</Form.Label>
                            <Form.Control type="date" value={expiryTo} onChange={(e) => setExpiryTo(e.target.value)} />
                        </Col>
                        <Col md={3}>
                            <div className="d-flex flex-column gap-2">
                                <Form.Check
                                    type="switch"
                                    id="cross-31"
                                    label="Crossed 31 Days (DL Ready)"
                                    checked={cross31Days}
                                    onChange={(e) => toggleCross31(e.target.checked)}
                                    className="fw-bold text-primary"
                                />
                                <Form.Check
                                    type="switch"
                                    id="expire-month"
                                    label="Expires in 1 Month"
                                    checked={expiresInMonth}
                                    onChange={(e) => toggleExpiresSoon(e.target.checked)}
                                    className="fw-bold text-warning"
                                />
                            </div>
                        </Col>
                        <Col md={2}>
                             <Form.Check
                                type="switch"
                                id="unpaid-switch"
                                label="Pending Dues"
                                checked={showUnpaidOnly}
                                onChange={(e) => setShowUnpaidOnly(e.target.checked)}
                                className="fw-bold text-danger mb-2"
                            />
                            <Button variant="outline-secondary" size="sm" className="w-100" onClick={resetFilters}>Reset All</Button>
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
                            <th>Given By</th> {/* --- NEW SEPARATE COLUMN HEADER --- */}
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
                        {loading ? <tr><td colSpan={10} className="text-center"><Spinner size="sm"/></td></tr> :
                         list.length === 0 ? <tr><td colSpan={10} className="text-center py-4">No records found.</td></tr> :
                         list.map((item, idx) => (
                            <tr key={item.id}>
                                <td>{(meta?.from || 1) + idx}</td>
                                <td className="fw-bold">{item.name}</td>

                                {/* --- NEW SEPARATE COLUMN DATA --- */}
                                <td>{item.given_by || '-'}</td>
                                {/* ------------------------------- */}

                                <td>{item.mobile}</td>
                                <td>
                                    <div><span className="text-muted small">App:</span> {item.application_no || '-'}</div>
                                    <div><span className="text-muted small">LL:</span> <span className="text-primary">{item.ll_no || '-'}</span></div>
                                </td>
                                <td>{item.dob || '-'}</td>
                                <td>
                                    <div className="small">
                                        <span className="text-success">{item.start_date || '?'}</span> <br/>
                                        <span className="text-danger">to {item.end_date || '?'}</span>
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
                                    <div className="d-flex align-items-center gap-1">
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            className="py-0 px-2"
                                            onClick={() => handleSendMessage(item)}
                                            disabled={sendingId === item.id}
                                            title="Send WhatsApp"
                                        >
                                            {sendingId === item.id ? '...' : <><i className="bi bi-whatsapp"></i> Send</>}
                                        </Button>
                                        <Button variant="outline-primary" size="sm" className="py-0 px-2" onClick={() => handleEdit(item)}>Edit</Button>
                                        <Button variant="outline-danger" size="sm" className="py-0 px-2" onClick={() => handleDelete(item.id)}>Del</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {meta && meta.last_page > 1 && (
                <div className="d-flex justify-content-end mt-3">
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
