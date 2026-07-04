import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import AlertDetailsDrawer from '../components/AlertDetailsDrawer';
import { Search, ShieldAlert, RefreshCw } from 'lucide-react';

const AlertsPage = () => {
  const { user } = useContext(AuthContext);

  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Applied Filters State
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('created_at_desc');

  // Staged Temp Filters State
  const [tempSearch, setTempSearch] = useState('');
  const [tempSeverity, setTempSeverity] = useState('');
  const [tempStatus, setTempStatus] = useState('');
  const [tempSource, setTempSource] = useState('');
  const [tempSort, setTempSort] = useState('created_at_desc');

  // Selected Alert for Details Drawer
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 15,
        sort,
      };
      if (search) params.search = search;
      if (severity) params.severity = severity;
      if (status) params.status = status;
      if (source) params.source = source;

      const resp = await api.get('/alerts', { params });
      setAlerts(resp.data.alerts);
      setTotal(resp.data.pagination.total);
      setPages(resp.data.pagination.pages);
    } catch (err) {
      console.error("Failed to query alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severity, status, source, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(tempSearch);
    setSeverity(tempSeverity);
    setStatus(tempStatus);
    setSource(tempSource);
    setSort(tempSort);
  };

  const handleAlertUpdated = (updatedAlert) => {
    setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? { ...a, ...updatedAlert } : a));
  };

  const clearFilters = () => {
    setTempSearch('');
    setTempSeverity('');
    setTempStatus('');
    setTempSource('');
    setTempSort('created_at_desc');

    setSearch('');
    setSeverity('');
    setStatus('');
    setSource('');
    setSort('created_at_desc');
    setPage(1);
  };

  // Convert role to standard string representation
  const userRoleStr = user?.role?.value || user?.role || 'viewer';

  return (
    <div className="space-y-6 relative">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-xs text-text-secondary font-mono mt-1">Real-time syslog ingestion classification audit logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" size="sm" onClick={fetchAlerts} className="font-mono text-xs uppercase">
            <RefreshCw size={14} className="mr-1.5" /> Reload
          </Button>
          <Badge variant="critical">{total} alerts total</Badge>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <Card className="p-4 bg-dark-panel/40 border border-dark-border">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row md:items-end">
          {/* Search bar */}
          <div className="flex-1">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Search Query</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={tempSearch}
                onChange={(e) => setTempSearch(e.target.value)}
                placeholder="Search alert title or source IP..."
                className="w-full pl-9 pr-4 py-1.5 bg-dark-input hover:bg-dark-input/85 focus:bg-dark-panel border border-dark-border focus:border-accent-cyan rounded text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Severity selector */}
          <div className="w-full md:w-36">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Severity</label>
            <select
              value={tempSeverity}
              onChange={(e) => setTempSeverity(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="">ALL LEVELS</option>
              <option value="critical">CRITICAL</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>
          </div>

          {/* Status selector */}
          <div className="w-full md:w-36">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Status</label>
            <select
              value={tempStatus}
              onChange={(e) => setTempStatus(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="">ALL STATES</option>
              <option value="new">NEW</option>
              <option value="in_review">IN REVIEW</option>
              <option value="escalated">ESCALATED</option>
              <option value="closed">CLOSED</option>
            </select>
          </div>

          {/* Source selector */}
          <div className="w-full md:w-36">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Log Source</label>
            <select
              value={tempSource}
              onChange={(e) => setTempSource(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="">ALL LOGS</option>
              <option value="firewall">FIREWALL</option>
              <option value="ids">IDS</option>
              <option value="endpoint">ENDPOINT</option>
              <option value="auth">AUTH LOG</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="w-full md:w-40">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Sort order</label>
            <select
              value={tempSort}
              onChange={(e) => setTempSort(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="created_at_desc">TIME DESC (NEWEST)</option>
              <option value="created_at_asc">TIME ASC (OLDEST)</option>
              <option value="severity_desc">SEVERITY DESC</option>
              <option value="severity_asc">SEVERITY ASC</option>
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

      {/* Table Data Card */}
      <Card className="p-0 border border-dark-border overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs font-mono text-accent-cyan tracking-widest uppercase">
            Filtering Ingested Logs...
          </div>
        ) : alerts.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs font-mono text-text-secondary">
            NO AUDIT ENTRIES FOUND MATCHING SEARCH QUERY
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-base/40 border-b border-dark-border text-[9px] font-mono text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">ID</th>
                  <th className="py-3 px-4 w-24">Severity</th>
                  <th className="py-3 px-4">Headline Title</th>
                  <th className="py-3 px-4 w-28">Source</th>
                  <th className="py-3 px-4 w-36">Source IP</th>
                  <th className="py-3 px-4 w-44">Inferred Timestamp</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {alerts.map((a, idx) => (
                  <tr 
                    key={a.id} 
                    onClick={() => setSelectedAlertId(a.id)}
                    className={`hover:bg-dark-hover/20 cursor-pointer transition-colors ${selectedAlertId === a.id ? 'bg-accent-cyan/5 border-l border-l-accent-cyan' : ''}`}
                  >
                    <td className="py-3 px-4 text-center font-mono text-text-secondary text-[10px]">
                      {(page - 1) * 15 + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={a.severity}>{a.severity}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-text-primary hover:text-accent-cyan transition-colors">
                      {a.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-[9px] text-text-secondary uppercase">
                      {a.source}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-accent-blue">
                      {a.source_ip || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-text-secondary font-mono text-[10px]">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={a.status}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-dark-border bg-dark-base/20 font-mono text-xs">
            <span className="text-text-secondary">
              Page <span className="text-text-primary">{page}</span> of <span className="text-text-primary">{pages}</span> (Showing {alerts.length} of {total} items)
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

      {/* Details Drawer Overlay */}
      {selectedAlertId && (
        <AlertDetailsDrawer
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
          userRole={userRoleStr}
          onAlertUpdated={handleAlertUpdated}
        />
      )}
    </div>
  );
};

export default AlertsPage;
