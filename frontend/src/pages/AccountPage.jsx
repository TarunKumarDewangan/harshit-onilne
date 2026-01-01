import { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/apiClient';

export default function AccountPage() {
  const { user, loadMe, logout } = useAuth(); // Import logout
  const navigate = useNavigate();

  const [phoneForm, setPhoneForm] = useState({ phone: user.phone || '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });

  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false); // New state for logout all

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      await api.put('/me/phone', phoneForm);
      toast.success('Mobile number updated successfully.');
      loadMe();
      setPhoneForm(prev => ({ ...prev, password: '' }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update mobile number.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.put('/me/password', passwordForm);
      toast.success('Password updated successfully.');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // --- START: NEW HANDLER ---
  const handleLogoutAll = async () => {
    if (!window.confirm("ARE YOU SURE? This will log you out from this computer and ALL other devices instantly.")) {
        return;
    }

    setLoggingOutAll(true);
    try {
        await api.post('/logout-all');
        toast.success('Logged out from all devices.');
        // Perform the frontend logout to clear local storage and redirect
        logout();
    } catch (err) {
        toast.error('Failed to perform global logout.');
        setLoggingOutAll(false);
    }
  };
  // --- END: NEW HANDLER ---

  return (
    <Container className="py-4">
      <h3 className="mb-3">Account Settings</h3>
      <Row className="g-4">
        {/* Profile Details Link */}
        <Col lg={12}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">My Profile</h5>
              <p>Your personal details (like name, address, and date of birth) are managed in your primary citizen profile.</p>
              {user.primary_citizen ? (
                <Button as={Link} to={`/citizens/${user.primary_citizen.id}`}>
                  Go to My Profile
                </Button>
              ) : (
                <Alert variant="warning">
                  You have not created your primary profile yet. Go to the{' '}
                  <Link to="/citizens">Citizen Profiles</Link> page to create it.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Change Mobile Number Card */}
        <Col md={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Change Mobile Number</h5>
              <Form onSubmit={handlePhoneSubmit}>
                <Form.Group className="mb-3"><Form.Label>New Mobile Number</Form.Label><Form.Control value={phoneForm.phone} onChange={e => setPhoneForm({...phoneForm, phone: e.target.value})} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Verify with Current Password</Form.Label><Form.Control type="password" value={phoneForm.password} onChange={e => setPhoneForm({...phoneForm, password: e.target.value})} required /></Form.Group>
                <Button type="submit" disabled={savingPhone}>{savingPhone ? 'Saving...' : 'Update Mobile'}</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Change Password Card */}
        <Col md={6}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Change Password</h5>
              <Form onSubmit={handlePasswordSubmit}>
                <Form.Group className="mb-3"><Form.Label>Current Password</Form.Label><Form.Control type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>New Password</Form.Label><Form.Control type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Confirm New Password</Form.Label><Form.Control type="password" value={passwordForm.new_password_confirmation} onChange={e => setPasswordForm({...passwordForm, new_password_confirmation: e.target.value})} required /></Form.Group>
                <Button type="submit" variant="outline-dark" disabled={savingPassword}>{savingPassword ? 'Saving...' : 'Update Password'}</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* --- START: ADMIN ONLY SECTION --- */}
        {user.role === 'admin' && (
            <Col md={12}>
                <Card border="danger" className="text-danger">
                    <Card.Header className="bg-danger text-white fw-bold">Admin Security Zone</Card.Header>
                    <Card.Body>
                        <Card.Title>Session Management</Card.Title>
                        <Card.Text>
                            If you suspect your account is compromised or you left a session open on a public computer, use this button.
                            It will invalidate <strong>all</strong> active login sessions for your account immediately.
                        </Card.Text>
                        <Button variant="danger" onClick={handleLogoutAll} disabled={loggingOutAll}>
                            {loggingOutAll ? 'Processing...' : 'Logout From All Devices'}
                        </Button>
                    </Card.Body>
                </Card>
            </Col>
        )}
        {/* --- END: ADMIN ONLY SECTION --- */}

      </Row>
    </Container>
  );
}
