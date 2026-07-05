import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, ShieldAlert, Key, CheckCircle, Settings } from 'lucide-react';

const SettingsPage = () => {
  const { user: currentUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile fields state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchProfile = async () => {
    setProfileError('');
    try {
      const resp = await api.get('/settings/profile');
      const { name: rName, email: rEmail, role: rRole, created_at: rCreated } = resp.data;
      setName(rName);
      setEmail(rEmail);
      setRole(rRole);
      setCreatedAt(rCreated);
    } catch (err) {
      setProfileError('Failed to fetch account profile details.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const resp = await api.patch('/settings/profile', { name, email });
      // Update local context variables if needed, or just show success
      setProfileSuccess('Profile updated successfully.');
      setName(resp.data.name);
      setEmail(resp.data.email);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to update profile info.';
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.patch('/settings/password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to update account password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-dark-border pb-4">
        <h1 className="text-xl font-bold tracking-tight text-text-primary uppercase font-mono flex items-center gap-2">
          <Settings className="text-accent-cyan" size={20} />
          <span>Console Settings & Profile</span>
        </h1>
        <p className="text-xs text-text-secondary font-mono mt-1">
          Inspect account attributes, update user metadata, and rotate access keys.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-dark-border font-mono text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 border-b-2 font-semibold uppercase tracking-wider transition-colors duration-150 ${
            activeTab === 'profile'
              ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-4 py-2 border-b-2 font-semibold uppercase tracking-wider transition-colors duration-150 ${
            activeTab === 'password'
              ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Password Security
        </button>
      </div>

      <div className="max-w-lg">
        {activeTab === 'profile' ? (
          <Card className="border border-dark-border bg-dark-panel/20 p-6 space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary font-mono flex items-center gap-1.5 border-b border-dark-border/40 pb-2">
              <User size={14} className="text-accent-cyan" />
              <span>Modify User Profile Info</span>
            </h3>

            {profileError && (
              <div className="p-3 rounded border border-severity-critical/20 bg-severity-critical/10 text-severity-critical font-mono text-[10px] flex items-start gap-1.5">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 rounded border border-severity-closed/20 bg-severity-closed/10 text-severity-closed font-mono text-[10px] flex items-start gap-1.5">
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Account Privilege (Read-only)</label>
                <div className="bg-dark-base border border-dark-border/40 rounded px-3 py-2 text-xs text-text-secondary font-mono flex items-center gap-2 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
                  <span className="uppercase">{role}</span>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Registration Timestamp</label>
                <div className="bg-dark-base border border-dark-border/40 rounded px-3 py-2 text-xs text-text-secondary font-mono select-none">
                  {createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={profileLoading}
                  className="font-mono text-xs uppercase px-4 h-9"
                >
                  {profileLoading ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Card className="border border-dark-border bg-dark-panel/20 p-6 space-y-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary font-mono flex items-center gap-1.5 border-b border-dark-border/40 pb-2">
              <Key size={14} className="text-accent-cyan" />
              <span>Rotate System Passkey</span>
            </h3>

            {passwordError && (
              <div className="p-3 rounded border border-severity-critical/20 bg-severity-critical/10 text-severity-critical font-mono text-[10px] flex items-start gap-1.5">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded border border-severity-closed/20 bg-severity-closed/10 text-severity-closed font-mono text-[10px] flex items-start gap-1.5">
                <CheckCircle size={14} className="shrink-0 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none font-mono"
                  placeholder="Verify existing credentials"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none font-mono"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none font-mono"
                  placeholder="Confirm rotated credentials"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={passwordLoading}
                  className="font-mono text-xs uppercase px-4 h-9"
                >
                  {passwordLoading ? 'Rotating...' : 'Rotate Password'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
