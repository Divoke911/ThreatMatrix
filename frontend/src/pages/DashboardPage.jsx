import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import AlertDetailsDrawer from '../components/AlertDetailsDrawer';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  Activity,
  ShieldAlert,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [toast, setToast] = useState(null);

  // Staged select alert id for drawer popup
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const fetchDashboardStats = async (lookbackDays = days, silent = false) => {
    if (!silent) setError('');
    try {
      const resp = await api.get('/dashboard/stats', { params: { days: lookbackDays } });
      setStats(resp.data);
    } catch (err) {
      if (!silent) setError('Failed to fetch Security Operations statistics.');
      console.error(err);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchDashboardStats(days);

    // Silent background updates polling every 20 seconds
    const interval = setInterval(() => {
      fetchDashboardStats(days, true);
    }, 20000);

    return () => clearInterval(interval);
  }, [days]);

  const handleReload = () => {
    setRefreshing(true);
    fetchDashboardStats(days);
  };

  const handleSimulateTraffic = async () => {
    setSimulating(true);
    setToast(null);
    try {
      const resp = await api.post('/logs/simulate');
      const data = resp.data;
      if (data.alert_triggered) {
        setToast({
          visible: true,
          type: 'threat',
          title: 'Threat Detected!',
          msg: `Log: ${data.log_created.source.toUpperCase()} -> Alert: "${data.alert.title}" (Severity: ${data.alert.severity.toUpperCase()})`
        });
      } else {
        setToast({
          visible: true,
          type: 'info',
          title: 'Log Ingested',
          msg: `Source: ${data.log_created.source.toUpperCase()}. No threat correlated.`
        });
      }
      fetchDashboardStats(days, true);
    } catch (err) {
      const errMsg = err.response?.data?.msg || err.message || 'Simulation failed.';
      setToast({
        visible: true,
        type: 'error',
        title: 'Simulation Error',
        msg: errMsg
      });
      console.error(err);
    } finally {
      setSimulating(false);
      setTimeout(() => {
        setToast(prev => prev ? { ...prev, visible: false } : null);
      }, 4000);
    }
  };

  const handleToggleDays = (val) => {
    setDays(val);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-xs font-mono text-accent-lime tracking-widest uppercase">
        Loading System Telemetry Ingestions...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 text-center text-xs font-mono text-severity-critical">
        {error || 'Telemetry parameters not resolved.'}
      </div>
    );
  }

  const userRoleStr = user?.role?.value || user?.role || 'viewer';

  // Cyber styling colors mapping
  const sourceColors = {
    firewall: '#b3ff00',  // Bright Lime
    ids: '#ff9d3d',       // Orange
    endpoint: '#e3b341',  // Yellow
    auth: '#a855f7'       // Purple
  };

  // Convert source_distribution counts dict to Recharts Pie list
  const pieData = Object.keys(stats.source_distribution || {}).map(src => ({
    name: src.toUpperCase(),
    value: stats.source_distribution[src],
    color: sourceColors[src] || '#58a6ff'
  }));

  // Convert incident_status_breakdown to Recharts Bar list
  const barData = [
    { name: 'OPEN', count: stats.incident_status_breakdown?.open || 0, fill: '#ef4444' },
    { name: 'INVESTIGATING', count: stats.incident_status_breakdown?.investigating || 0, fill: '#f59e0b' },
    { name: 'RESOLVED', count: stats.incident_status_breakdown?.resolved || 0, fill: '#10b981' },
    { name: 'CLOSED', count: stats.incident_status_breakdown?.closed || 0, fill: '#6b7280' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header: Title & System Health Checks */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-dark-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary uppercase font-mono">
            Security Operations Center (SOC) Console
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-1">
            Active session monitor: {user?.name || 'Analyst'} ({(userRoleStr).toUpperCase()})
          </p>
        </div>
        
        {/* System Health Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2.5 bg-dark-panel/40 border border-dark-border px-3 py-1.5 rounded text-[10px] font-mono">
            <span className="text-text-secondary uppercase">Health Status:</span>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">API</span>
            </div>
            <div className="flex items-center space-x-1 border-l border-dark-border pl-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">DB</span>
            </div>
            <div className="flex items-center space-x-1 border-l border-dark-border pl-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">AI AGENT</span>
            </div>
          </div>
          {userRoleStr === 'admin' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSimulateTraffic}
              disabled={simulating}
              className="font-mono text-xs uppercase h-8 bg-accent-lime/10 border border-accent-lime text-accent-lime hover:bg-accent-lime/20 flex items-center rounded-full px-3 py-1"
            >
              <Activity size={13} className={`mr-1 ${simulating ? 'animate-pulse' : ''}`} /> Simulate Traffic
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handleReload} disabled={refreshing} className="font-mono text-xs uppercase h-8">
            <RefreshCw size={13} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Reload
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Ingested Log Streams</span>
            <Server size={14} className="text-accent-lime" />
          </div>
          <p className="text-2xl font-bold text-text-primary mt-1.5 font-mono">{stats.total_logs}</p>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Correlated Alerts</span>
            <ShieldAlert size={14} className="text-severity-critical" />
          </div>
          <p className="text-2xl font-bold text-severity-critical mt-1.5 font-mono">{stats.total_alerts}</p>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Active Incident Response</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-1.5 font-mono">{stats.active_incidents}</p>
        </Card>

        <Card hoverGlow>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Resolved Tickets</span>
            <Database size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5 font-mono">{stats.resolved_incidents}</p>
        </Card>
      </div>

      {/* Charts Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Trend Time Series Line/Area */}
        <Card className="lg:col-span-2 p-5 bg-dark-panel/40 border border-dark-border flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-dark-border/40 pb-3 mb-4">
            <h3 className="text-xs font-mono text-text-primary uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp size={14} className="text-accent-lime" />
              <span>Log Ingestion Volume Trend</span>
            </h3>
            
            {/* Days Toggle */}
            <div className="flex bg-dark-base border border-dark-border rounded-full p-0.5 font-mono text-[9px] font-semibold">
              <button 
                onClick={() => handleToggleDays(7)}
                className={`px-2 py-0.5 rounded-full transition-colors uppercase ${days === 7 ? 'bg-accent-lime text-black font-bold' : 'text-text-secondary hover:text-text-primary'}`}
              >
                7D
              </button>
              <button 
                onClick={() => handleToggleDays(30)}
                className={`px-2 py-0.5 rounded-full transition-colors uppercase ${days === 30 ? 'bg-accent-lime text-black font-bold' : 'text-text-secondary hover:text-text-primary'}`}
              >
                30D
              </button>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.alerts_trend || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="alertGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b3ff00" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#b3ff00" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#161b22" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8b949e" 
                  tickFormatter={(val) => val.substring(5)} 
                  tick={{ fontSize: 9, fontFamily: 'monospace' }}
                />
                <YAxis stroke="#8b949e" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161616', borderColor: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: 10, fontFamily: 'monospace', borderRadius: '12px' }} 
                  labelClassName="text-accent-lime font-bold"
                />
                <Area type="monotone" dataKey="count" name="Alerts" stroke="#b3ff00" strokeWidth={1.5} fillOpacity={1} fill="url(#alertGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ingestion Source Distribution Donut Pie Chart */}
        <Card className="p-5 bg-dark-panel/40 border border-dark-border flex flex-col justify-between">
          <h3 className="text-xs font-mono text-text-primary uppercase tracking-widest border-b border-dark-border/40 pb-3 mb-4">
            Ingested Log Sources
          </h3>
          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={70}
                  paddingAngle={6}
                  cornerRadius={6}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', borderColor: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: 10, fontFamily: 'monospace', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono text-text-secondary uppercase">Total Sources</span>
              <span className="text-lg font-bold font-mono text-text-primary">{pieData.length}</span>
            </div>
          </div>

          {/* Custom Labels List */}
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-text-secondary pt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Incidents lifecycle workload bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-5 bg-dark-panel/40 border border-dark-border">
          <h3 className="text-xs font-mono text-text-primary uppercase tracking-widest border-b border-dark-border/40 pb-3 mb-4">
            Incident Workload Overview
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161b22" opacity={0.3} />
                <XAxis dataKey="name" stroke="#8b949e" tick={{ fontSize: 7, fontFamily: 'monospace' }} />
                <YAxis stroke="#8b949e" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', borderColor: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: 10, fontFamily: 'monospace', borderRadius: '12px' }}
                />
                <Bar dataKey="count" name="Incidents" radius={[999, 999, 999, 999]} barSize={12}>
                  {barData.map((entry, index) => {
                    const maxCount = Math.max(...barData.map(d => d.count), 1);
                    const isMax = entry.count === maxCount && entry.count > 0;
                    return <Cell key={`cell-${index}`} fill={isMax ? '#b3ff00' : '#262626'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Split feeds panel: 5 recent alerts & 5 recent incidents */}
        <Card className="lg:col-span-2 p-5 bg-dark-panel/40 border border-dark-border space-y-4">
          <h3 className="text-xs font-mono text-text-primary uppercase tracking-widest border-b border-dark-border/40 pb-3 flex items-center justify-between">
            <span>Recent Threat Activities Ingestions</span>
            <Clock size={13} className="text-accent-lime animate-pulse" />
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 5 Recent Alerts */}
            <div className="space-y-2.5">
              <span className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Latest Log Alerts</span>
                <span className="text-severity-critical">● Ingested</span>
              </span>
              
              {stats.recent_alerts?.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-dark-border text-center text-[10px] text-text-secondary font-mono">
                  NO ALERTS INGESTED
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {stats.recent_alerts?.map(alert => (
                    <div 
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      className="p-2.5 bg-dark-base/40 border border-dark-border hover:border-accent-lime/40 rounded flex flex-col justify-between cursor-pointer hover:bg-dark-hover/10 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-text-primary truncate flex-1">{alert.title}</span>
                        <Badge variant={alert.severity}>{alert.severity}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-text-secondary">
                        <span>SOURCE IP: {alert.source_ip || 'N/A'}</span>
                        <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5 Recent Incidents */}
            <div className="space-y-2.5">
              <span className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1 flex items-center justify-between">
                <span>Latest Incident Tickets</span>
                <span className="text-accent-lime font-bold">● Escalated</span>
              </span>

              {stats.recent_incidents?.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-dark-border text-center text-[10px] text-text-secondary font-mono">
                  NO INCIDENTS ESCALATED
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {stats.recent_incidents?.map(inc => (
                    <div 
                      key={inc.id}
                      onClick={() => navigate(`/incidents/${inc.id}`)}
                      className="p-2.5 bg-dark-base/40 border border-dark-border hover:border-accent-lime/40 rounded flex flex-col justify-between cursor-pointer hover:bg-dark-hover/10 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold text-text-primary truncate flex-1">{inc.title}</span>
                        <Badge variant={inc.status}>{inc.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono text-text-secondary">
                        <span>OWNER: {inc.assignee_name}</span>
                        <span>{new Date(inc.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Slide-out details drawer overlay for recent alert inspection */}
      {selectedAlertId && (
        <AlertDetailsDrawer
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
          userRole={userRoleStr}
          onAlertUpdated={handleReload} // Reload stats if status modified inside drawer
        />
      )}

      {toast && toast.visible && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-2xl border p-4 shadow-lg font-mono text-xs transition-all duration-300 ${
          toast.type === 'threat'
            ? 'bg-dark-panel/95 border-severity-critical/50 text-severity-critical animate-slide-in shadow-[0_4px_20px_rgba(248,81,73,0.15)]'
            : toast.type === 'error'
            ? 'bg-dark-panel/95 border-severity-critical/50 text-severity-critical animate-slide-in shadow-[0_4px_20px_rgba(248,81,73,0.15)]'
            : 'bg-dark-panel/95 border-accent-lime/50 text-text-primary animate-slide-in shadow-[0_4px_20px_rgba(179,255,0,0.15)]'
        }`}
        >
          <div className="flex items-start gap-2.5">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
              toast.type === 'threat' || toast.type === 'error'
                ? 'bg-severity-critical animate-pulse'
                : 'bg-accent-lime animate-pulse'
            }`} />
            <div>
              <h4 className="font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>{toast.title}</span>
                <button 
                  onClick={() => setToast(prev => prev ? { ...prev, visible: false } : null)}
                  className="text-[9px] text-text-secondary hover:text-text-primary ml-4"
                >
                  ✕
                </button>
              </h4>
              <p className="text-[10px] text-text-secondary leading-relaxed">
                {toast.msg}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
