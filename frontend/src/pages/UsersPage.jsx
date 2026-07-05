import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { UserPlus, Shield, UserCheck, Trash2, ShieldAlert } from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [password, setPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const fetchUsers = async (p = page, silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const resp = await api.get('/users', { params: { page: p, limit: 10 } });
      setUsers(resp.data.users);
      setTotalPages(resp.data.pagination.pages);
      setPage(p);
    } catch (err) {
      setError('Failed to fetch user directory.');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      await api.post('/users', { name, email, role, password });
      setIsModalOpen(false);
      // Clear fields
      setName('');
      setEmail('');
      setRole('analyst');
      setPassword('');
      fetchUsers(1);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to create user account.';
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    const isSelf = targetUser.id === currentUser.id;
    if (isSelf) {
      const confirmSelfDemote = window.confirm(
        "WARNING: You are editing your own role. Changing your role to something other than Admin will revoke your administrative access and log you out immediately. Do you want to proceed?"
      );
      if (!confirmSelfDemote) {
        fetchUsers(page, true);
        return;
      }
    }

    try {
      await api.patch(`/users/${targetUser.id}/role`, { role: newRole });
      if (isSelf && newRole !== 'admin') {
        alert("Your role has been successfully modified. Logging out...");
        await logout();
        navigate('/login');
      } else {
        fetchUsers(page, true);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to modify user role.';
      alert("Error: " + msg);
      fetchUsers(page, true); // Revert select value in UI on error by reloading DB records silently
    }
  };

  const handleDeactivateUser = async (targetUser) => {
    const isSelf = targetUser.id === currentUser.id;
    
    let confirmMsg = `Are you sure you want to deactivate user: ${targetUser.name}?`;
    if (isSelf) {
      confirmMsg = "WARNING: You are deactivating your own account. This will log you out immediately. Are you sure you want to proceed?";
    }

    const confirmAction = window.confirm(confirmMsg);
    if (!confirmAction) return;

    try {
      await api.delete(`/users/${targetUser.id}`);
      if (isSelf) {
        alert("Your account has been deactivated. Logging out...");
        await logout();
        navigate('/login');
      } else {
        fetchUsers(page, true);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to deactivate user.';
      alert("Error: " + msg);
      fetchUsers(page, true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Console Bar */}
      <div className="flex items-center justify-between border-b border-dark-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary uppercase font-mono flex items-center gap-2">
            <Shield className="text-accent-cyan" size={20} />
            <span>User Administration Console</span>
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Manage console user credentials, privilege allocations, and account lifecycles.
          </p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setIsModalOpen(true)}
          className="font-mono text-xs uppercase h-9 flex items-center gap-1.5"
        >
          <UserPlus size={14} /> Add New User
        </Button>
      </div>

      {error ? (
        <div className="min-h-[250px] flex items-center justify-center p-6 text-center text-xs font-mono text-severity-critical">
          {error}
        </div>
      ) : loading ? (
        <div className="min-h-[250px] flex items-center justify-center text-xs font-mono text-accent-cyan tracking-widest uppercase">
          Loading User Directory...
        </div>
      ) : (
        <Card className="overflow-hidden border border-dark-border bg-dark-panel/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-dark-border bg-dark-base/40 text-[10px] font-mono text-text-secondary uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-semibold">User Details</th>
                  <th className="py-3.5 px-4 font-semibold">Role Privilege</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold">Registered At</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {users.map(u => {
                  const isSelf = u.id === currentUser.id;
                  const roleStr = u.role || 'viewer';
                  
                  return (
                    <tr key={u.id} className="hover:bg-dark-hover/10 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-text-primary flex items-center gap-1.5">
                          {u.name}
                          {isSelf && (
                            <span className="text-[8px] font-mono bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 px-1 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-text-secondary mt-0.5">{u.email}</div>
                      </td>
                      
                      <td className="py-3.5 px-4 font-mono">
                        <select
                          value={roleStr}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2 py-1 text-xs text-text-primary focus:outline-none font-mono disabled:opacity-40"
                        >
                          <option value="admin">ADMIN</option>
                          <option value="analyst">ANALYST</option>
                          <option value="viewer">VIEWER</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={u.is_active ? 'in_review' : 'closed'}>
                          {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[10px] text-text-secondary">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {u.is_active ? (
                          <button
                            onClick={() => handleDeactivateUser(u)}
                            className="p-1.5 rounded hover:bg-severity-critical/10 text-text-secondary hover:text-severity-critical transition-colors"
                            title="Deactivate Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono text-text-secondary italic">DEACTIVATED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-dark-border bg-dark-base/20 flex items-center justify-between font-mono text-[10px]">
              <span className="text-text-secondary">PAGE {page} OF {totalPages}</span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => fetchUsers(page - 1)}
                  className="px-2.5 py-1"
                >
                  PREV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => fetchUsers(page + 1)}
                  className="px-2.5 py-1"
                >
                  NEXT
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-base/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-dark-panel border border-dark-border rounded p-6 shadow-2xl relative">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary font-mono mb-4 flex items-center gap-1.5">
              <UserPlus size={16} className="text-accent-cyan" />
              <span>Create System User Account</span>
            </h3>

            {modalError && (
              <div className="p-3 mb-4 rounded border border-severity-critical/20 bg-severity-critical/10 text-severity-critical font-mono text-[10px] leading-relaxed flex items-start gap-1.5">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none"
                  placeholder="e.g. Lead Analyst John"
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
                  placeholder="e.g. john@threatmatrix.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Assign Privilege</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none font-mono"
                  >
                    <option value="admin">ADMIN</option>
                    <option value="analyst">ANALYST</option>
                    <option value="viewer">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Initial Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-3 py-2 text-xs text-text-primary focus:outline-none font-mono"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-dark-border/40 mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setModalError('');
                  }}
                  className="font-mono text-xs uppercase px-4 h-9"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={modalLoading}
                  className="font-mono text-xs uppercase px-4 h-9"
                >
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
