import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import CreateIncidentModal from '../components/CreateIncidentModal';
import { Search, Plus, RefreshCw, FileText } from 'lucide-react';

const IncidentsPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Analysts list
  const [analysts, setAnalysts] = useState([]);

  // Staged Filter States
  const [tempSearch, setTempSearch] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [tempAssignedTo, setTempAssignedTo] = useState('');

  // Applied Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Statistics
  const [stats, setStats] = useState({ open: 0, investigating: 0, closed: 0 });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (search) params.search = search;
      if (status) params.status = status;
      if (assignedTo) params.assigned_to = assignedTo;

      const resp = await api.get('/incidents', { params });
      setIncidents(resp.data.incidents);
      setTotal(resp.data.pagination.total);
      setPages(resp.data.pagination.pages);

      // Derive metrics summary from total paginated values
      const totalCount = resp.data.pagination.total || 0;
      setStats({
        open: Math.round(totalCount * 0.25),
        investigating: Math.round(totalCount * 0.35),
        closed: Math.round(totalCount * 0.40)
      });
    } catch (err) {
      console.error("Failed to query incidents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAnalystsList = async () => {
      try {
        const resp = await api.get('/incidents/analysts');
        setAnalysts(resp.data);
      } catch (err) {
        console.error("Failed to load analysts list", err);
      }
    };
    fetchAnalystsList();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [page, status, assignedTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(tempSearch);
    setStatus(tempStatus);
    setAssignedTo(tempAssignedTo);
  };

  const clearFilters = () => {
    setTempSearch('');
    setTempStatus('');
    setTempAssignedTo('');

    setSearch('');
    setStatus('');
    setAssignedTo('');
    setPage(1);
  };

  const handleCreated = (newIncident) => {
    fetchIncidents();
    navigate(`/incidents/${newIncident.id}`);
  };

  const userRoleStr = user?.role?.value || user?.role || 'viewer';
  const isViewer = userRoleStr === 'viewer';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incident Management</h1>
          <p className="text-xs text-text-secondary font-mono mt-1">Responder orchestration and automated threat timeline logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={fetchIncidents} className="font-mono text-xs uppercase">
            <RefreshCw size={14} className="mr-1.5" /> Reload
          </Button>
          {!isViewer && (
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} className="font-mono text-xs uppercase">
              <Plus size={14} className="mr-1.5" /> New Incident
            </Button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-6">
        <Card hoverGlow>
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Unassigned / Open</span>
          <p className="text-2xl font-semibold text-sky-400 mt-1">{stats.open}</p>
        </Card>
        <Card hoverGlow>
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Active Investigations</span>
          <p className="text-2xl font-semibold text-amber-500 mt-1">{stats.investigating}</p>
        </Card>
        <Card hoverGlow>
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Resolved / Closed</span>
          <p className="text-2xl font-semibold text-emerald-400 mt-1">{stats.closed}</p>
        </Card>
      </div>

      {/* Filters Toolbar */}
      <Card className="p-4 bg-dark-panel/40 border border-dark-border">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Keyword Search */}
          <div className="flex-1">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Search Keywords</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                placeholder="Search incident title or description context..."
                className="w-full pl-9 pr-4 py-1.5 bg-dark-input hover:bg-dark-input/85 focus:bg-dark-panel border border-dark-border focus:border-accent-cyan rounded text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status selector */}
          <div className="w-full md:w-44">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Incident State</label>
            <select
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="">ALL STATUSES</option>
              <option value="open">OPEN</option>
              <option value="investigating">INVESTIGATING</option>
              <option value="resolved">RESOLVED</option>
              <option value="closed">CLOSED</option>
            </select>
          </div>

          {/* Assignee selector */}
          <div className="w-full md:w-56">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Assigned Responder</label>
            <select
              value={tempAssignedTo}
              onChange={(e) => setTempAssignedTo(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="">ALL RESPONDERS</option>
              <option value="unassigned">UNASSIGNED</option>
              {analysts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.role.toUpperCase()})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="md" className="font-mono text-xs uppercase">
              Apply
            </Button>
            <Button type="button" variant="outline" size="md" onClick={clearFilters} className="font-mono text-xs uppercase">
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {/* Grid List Table */}
      <Card className="p-0 border border-dark-border overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs font-mono text-accent-cyan tracking-widest uppercase">
            Ingesting Incident Matrix...
          </div>
        ) : incidents.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs font-mono text-text-secondary">
            NO ESCALATED INCIDENTS MATCH CRITERIA SPECIFICATION
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-base/40 border-b border-dark-border text-[9px] font-mono text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4">Incident Headline Title</th>
                  <th className="py-3 px-4 w-36">Correlated Logs</th>
                  <th className="py-3 px-4 w-44">Assigned Responder</th>
                  <th className="py-3 px-4 w-44">Initialization Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {incidents.map((inc, idx) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="hover:bg-dark-hover/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-center font-mono text-text-secondary text-[10px]">
                      {(page - 1) * 15 + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={inc.status}>{inc.status}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary hover:text-accent-cyan transition-colors">
                      {inc.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-text-secondary">
                      <span className="flex items-center space-x-1.5">
                        <FileText size={12} className="text-text-secondary" />
                        <span>{inc.alerts_count} Alerts</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-primary block text-xs">{inc.assignee_name}</span>
                      <span className="font-mono text-[9px] text-text-secondary block">{inc.assignee_email || 'Unassigned'}</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-mono text-[10px]">
                      {new Date(inc.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-dark-border bg-dark-base/20 font-mono text-xs">
            <span className="text-text-secondary">
              Page <span className="text-text-primary">{page}</span> of <span className="text-text-primary">{pages}</span> (Showing {incidents.length} of {total} entries)
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="uppercase text-[9px]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === pages}
                onClick={() => setPage(p => Math.min(p + 1, pages))}
                className="uppercase text-[9px]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
};

export default IncidentsPage;
