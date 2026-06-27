import { useEffect, useState, useCallback } from 'react';
import { Container, Card, Button, Table, Alert, Spinner, Row, Col, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../services/apiClient';

export default function DataExportPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingTable, setExportingTable] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  // Backup & Import states
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const fetchTableList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/export/tables');
      setTables(data || []);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to load table list.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTableList(); }, [fetchTableList]);

  const handleExport = async (tableName) => {
    setExportingTable(tableName);
    toast.info(`Exporting ${tableName}...`);
    try {
      const response = await api.get(`/export/table/${tableName}`, { responseType: 'blob' });

      let filename = `${tableName}.csv`;
      const cd = response.headers['content-disposition'];
      if (cd) {
        const m = cd.match(/filename="(.+)"/);
        if (m && m[1]) filename = m[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      toast.error(`Failed to export ${tableName}.`);
    } finally {
      setExportingTable(null);
    }
  };

  const handleExportAll = async () => {
    if (!window.confirm('This will generate a zip file containing a CSV for every table. Continue?')) return;
    setIsZipping(true);
    toast.info('Export process started... The download will begin shortly.');
    try {
      const response = await api.get('/export/all-as-zip', { responseType: 'blob' });

      let filename = 'full-data-export.zip';
      const cd = response.headers['content-disposition'];
      if (cd) {
        const m = cd.match(/filename="(.+)"/);
        if (m && m[1]) filename = m[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', filename);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data export download started!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Data export failed.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleBackupDownload = async (format) => {
    const formatName = format === 'json' ? 'JSON' : 'SQL';
    if (!window.confirm(`This will generate a full database ${formatName} backup and start the download. Continue?`)) {
      return;
    }
    setBackingUp(true);
    toast.info(`Generating ${formatName} backup... The download will begin automatically.`);

    try {
      const endpoint = format === 'json' ? '/database-backups/download-json' : '/database-backups/download';
      const fullUrl = `${api.defaults.baseURL}${endpoint}`;
      const token = localStorage.getItem('auth_token');

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Backup failed. Server responded with an error.');
      }

      const blob = await response.blob();

      const contentDisposition = response.headers.get('content-disposition');
      let filename = format === 'json' ? 'backup.json' : 'backup.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${formatName} backup download started!`);

    } catch (err) {
      toast.error('Backup download failed. Please check the logs.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.warn('Please select a .sql, .zip, or .json backup file to import.');
      return;
    }

    const filename = importFile.name.toLowerCase();
    const isJson = filename.endsWith('.json');
    const isSqlOrZip = filename.endsWith('.sql') || filename.endsWith('.zip');

    if (!isJson && !isSqlOrZip) {
      toast.error('Invalid file format. Only .sql, .zip, and .json files are supported.');
      return;
    }

    if (!window.confirm('WARNING: Importing this backup will overwrite ALL current database records, users, and details. This action CANNOT be undone. Are you sure you want to proceed?')) {
      return;
    }

    setImporting(true);
    const formatName = isJson ? 'JSON' : 'SQL';
    toast.info(`Importing ${formatName} database backup... Please wait.`);

    try {
      const formData = new FormData();
      formData.append('import_file', importFile);

      const endpoint = isJson ? '/database-backups/import-json' : '/database-backups/import';
      await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Database successfully restored from ${formatName} backup!`);
      setImportFile(null);
      const fileInput = document.getElementById('import-file-input');
      if (fileInput) fileInput.value = '';
      fetchTableList();

    } catch (err) {
      const msg = err?.response?.data?.message || 'Database restoration failed.';
      toast.error(msg);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Container className="py-4">
      <h3 className="mb-4">Database Backup, Export & Restore</h3>

      {/* --- BACKUP & RESTORE SECTION --- */}
      <Card className="mb-4 border-danger shadow-sm">
        <Card.Header className="bg-danger text-white">
          <Card.Title className="mb-0">Database Backup & Restore</Card.Title>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            <strong>Warning:</strong> Restoring the database from a backup file will overwrite all current citizen profiles, licenses, vehicle records, and admin accounts. Make sure you back up your current state first if you need it.
          </Alert>

          <Row className="g-4">
            {/* Backup Column */}
            <Col md={6} className="border-end">
              <h5>Backup Database</h5>
              <p className="text-muted small">
                Download a full database backup in either SQL format (ZIP compressed) or JSON format containing all structure and row details.
              </p>
              <div className="d-flex flex-column gap-2 mt-3">
                <Button
                  variant="success"
                  onClick={() => handleBackupDownload('sql')}
                  disabled={backingUp}
                  className="py-2 btn-success text-start d-flex justify-content-between align-items-center"
                >
                  <span>Generate SQL Backup (.zip)</span>
                  <i className="bi bi-download"></i>
                </Button>
                <Button
                  variant="info"
                  onClick={() => handleBackupDownload('json')}
                  disabled={backingUp}
                  className="py-2 btn-info text-start text-white d-flex justify-content-between align-items-center"
                >
                  <span>Generate JSON Backup (.json)</span>
                  <i className="bi bi-download"></i>
                </Button>
              </div>
            </Col>

            {/* Restore Column */}
            <Col md={6}>
              <h5>Restore Database</h5>
              <p className="text-muted small">
                Upload a previously exported backup file (supports `.sql`, `.zip`, and `.json`) to reset and restore the database state.
              </p>
              <Form onSubmit={handleImportSubmit}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="file"
                    id="import-file-input"
                    accept=".sql,.zip,.json"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    required
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="danger"
                  disabled={importing || !importFile}
                  className="w-100 py-2"
                >
                  {importing ? 'Restoring Database...' : 'Upload & Restore Backup'}
                </Button>
              </Form>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* --- EXPORT CSV SECTION --- */}
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <Card.Title className="mb-0">Export Individual Tables (CSV)</Card.Title>
          <Button variant="outline-primary" onClick={handleExportAll} disabled={isZipping}>
            {isZipping ? 'Zipping...' : 'Download All as ZIP (CSV)'}
          </Button>
        </Card.Header>
        <Card.Body>
          <Card.Text className="text-muted small">
            Click the button next to any table to export its current data into a standard CSV spreadsheet file.
          </Card.Text>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Table Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="3" className="text-center py-3">
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading tables...
                    </td>
                  </tr>
                )}
                {!loading && tables.length === 0 && (
                  <tr><td colSpan="3" className="text-center">No tables found.</td></tr>
                )}
                {!loading && tables.map((tableName, index) => (
                  <tr key={tableName}>
                    <td>{index + 1}</td>
                    <td><strong>{tableName}</strong></td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleExport(tableName)}
                        disabled={exportingTable === tableName}
                      >
                        {exportingTable === tableName ? 'Exporting…' : 'Download CSV'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
