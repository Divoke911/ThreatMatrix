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
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  ShieldAlert,
  Server,
  Database,
  RefreshCw,
  Clock,
  TrendingUp,
  ChevronRight,
  User as UserIcon,
  Play
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

  return (
    <div className="space-y-6">
      {/* Top Header: Title & System Health Checks */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/[0.02] pb-4">
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
          <div className="flex flex-wrap items-center gap-2.5 bg-dark-panel/40 border border-white/[0.02] px-3 py-1.5 rounded-full text-[9px] font-mono">
            <span className="text-text-secondary uppercase">Health Status:</span>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">API</span>
            </div>
            <div className="flex items-center space-x-1 border-l border-white/[0.02] pl-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">DB</span>
            </div>
            <div className="flex items-center space-x-1 border-l border-white/[0.02] pl-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400">AI AGENT</span>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleReload} disabled={refreshing} className="font-mono text-xs uppercase h-8 rounded-full border border-white/[0.04]">
            <RefreshCw size={13} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Reload
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards Row (From original dashboard, but styled with new card panels) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Ingested Log Streams</span>
            <Server size={14} className="text-accent-lime" />
          </div>
          <p className="text-2xl font-bold text-text-primary mt-1.5 font-mono">{stats.total_logs}</p>
        </Card>

        <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Correlated Alerts</span>
            <ShieldAlert size={14} className="text-severity-critical" />
          </div>
          <p className="text-2xl font-bold text-severity-critical mt-1.5 font-mono">{stats.total_alerts}</p>
        </Card>

        <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Active Incidents</span>
            <Activity size={14} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-1.5 font-mono">{stats.active_incidents}</p>
        </Card>

        <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">Resolved Tickets</span>
            <Database size={14} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5 font-mono">{stats.resolved_incidents}</p>
        </Card>
      </div>

      {/* Main Grid Workspace: Left Span (2 columns) & Right Span (1 column) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side Workspace (Spans 2 columns on large displays) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Ingestion Area Chart (Large display format from original) */}
          <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px]">
            <div className="flex items-center justify-between border-b border-white/[0.02] pb-3 mb-4">
              <h3 className="text-xs font-mono text-text-primary uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp size={14} className="text-accent-lime" />
                <span>Log Ingestion Volume Trend</span>
              </h3>
              
              {/* Days Selector */}
              <div className="flex bg-[#0d0d0d] border border-white/[0.02] rounded-full p-0.5 font-mono text-[8px] font-semibold">
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

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.alerts_trend || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="alertGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00bfff" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00bfff" stopOpacity={0.0}/>
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
                  <Area 
                    type="linear" 
                    dataKey="count" 
                    name="Ingested Events" 
                    stroke="#00bfff" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#alertGlow)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Card 2: Recent Threat Activities Split Feeds (Original functional content, styled like new rides history lists) */}
          <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px] space-y-4">
            <h3 className="text-xs font-mono text-text-primary uppercase tracking-widest border-b border-white/[0.02] pb-3 flex items-center justify-between">
              <span>Recent Threat Ingestions Feed</span>
              <Clock size={13} className="text-accent-lime animate-pulse" />
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Latest Log Alerts */}
              <div className="space-y-3">
                <span className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Latest Log Alerts</span>
                  <span className="text-severity-critical">● Ingested</span>
                </span>
                
                {stats.recent_alerts?.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-dark-border text-center text-[10px] text-text-secondary font-mono">
                    NO ALERTS INGESTED
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[17.5rem] overflow-y-auto pr-1 scrollbar-thin">
                    {stats.recent_alerts?.map(alert => (
                      <div 
                        key={alert.id}
                        onClick={() => setSelectedAlertId(alert.id)}
                        className="p-3 bg-[#0d0d0d]/40 border border-white/[0.02] hover:border-accent-lime/20 rounded-xl flex items-center justify-between cursor-pointer hover:bg-dark-hover/10 transition-all text-xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-[#161616] flex items-center justify-center text-severity-critical shrink-0 border border-white/[0.02]">
                            <ShieldAlert size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-white block truncate text-[11px] leading-tight">{alert.title}</span>
                            <span className="text-[9px] font-mono text-text-secondary mt-0.5 block truncate">IP: {alert.source_ip || 'N/A'} • {new Date(alert.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-text-secondary shrink-0 ml-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latest Incident Tickets */}
              <div className="space-y-3">
                <span className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Latest Incident Tickets</span>
                  <span className="text-accent-lime font-bold">● Escalated</span>
                </span>

                {stats.recent_incidents?.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-dark-border text-center text-[10px] text-text-secondary font-mono">
                    NO INCIDENTS ESCALATED
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[17.5rem] overflow-y-auto pr-1 scrollbar-thin">
                    {stats.recent_incidents?.map(inc => (
                      <div 
                        key={inc.id}
                        onClick={() => navigate(`/incidents/${inc.id}`)}
                        className="p-3 bg-[#0d0d0d]/40 border border-white/[0.02] hover:border-accent-lime/20 rounded-xl flex items-center justify-between cursor-pointer hover:bg-dark-hover/10 transition-all text-xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-[#161616] flex items-center justify-center text-amber-500 shrink-0 border border-white/[0.02]">
                            <UserIcon size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-white block truncate text-[11px] leading-tight">{inc.title}</span>
                            <span className="text-[9px] font-mono text-text-secondary mt-0.5 block truncate">Owner: {inc.assignee_name} • {new Date(inc.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-text-secondary shrink-0 ml-1.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side Workspace (Spans 1 column) - Brings in screenshot design components */}
        <div className="space-y-6">
          {/* Card 1: Active Threat Focus ("Next Ride" Style card) */}
          <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px]">
            <div className="flex items-center justify-between border-b border-white/[0.02] pb-3 mb-4">
              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">Active Threat Focus</span>
              <span className="w-1.5 h-1.5 rounded-full bg-severity-critical animate-pulse" />
            </div>

            {/* Analyst profile section */}
            <div className="flex items-center space-x-3 mb-4 bg-[#0d0d0d] p-3 rounded-xl border border-white/[0.02]">
              <div className="w-9 h-9 rounded-full bg-accent-lime/10 flex items-center justify-center text-accent-lime font-mono font-bold text-xs border border-accent-lime/20 shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0 leading-none">
                <span className="text-xs font-bold text-white block truncate">{user?.name || 'Lead Analyst'}</span>
                <span className="text-[9px] font-mono text-accent-lime uppercase tracking-wider mt-1 block">{(userRoleStr).toUpperCase()}</span>
              </div>
            </div>

            {/* Vector details */}
            <div className="space-y-3 font-sans text-xs">
              <div>
                <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider block mb-1">Target Vector</span>
                <span className="text-white font-semibold">192.168.1.105 (Internal Database SQL Node)</span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.02] gap-3">
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => navigate('/incidents')}
                  className="font-mono text-[10px] uppercase h-8 px-4 font-bold rounded-full flex-1"
                >
                  View Details
                </Button>
                {userRoleStr === 'admin' && (
                  <button 
                    onClick={handleSimulateTraffic}
                    disabled={simulating}
                    className="w-8 h-8 rounded-full bg-[#161616] hover:bg-dark-hover flex items-center justify-center text-accent-lime border border-white/[0.04] transition-colors shrink-0"
                    title="Simulate Ingestion"
                  >
                    <Play size={10} className="fill-current ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Card 2: Security Health Indicators & Circular Gauges (Energy Level Style) */}
          <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px] space-y-4">
            <span className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-white/[0.02] pb-3">
              Console Energy Levels
            </span>

            <div className="grid grid-cols-2 gap-4">
              {/* Gauge Ring 1 */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-[#1a1a1a]" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-amber-500" strokeDasharray="75, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-amber-500">
                    75%
                  </div>
                </div>
                <span className="text-[9px] font-mono text-text-secondary uppercase">API Load</span>
              </div>

              {/* Gauge Ring 2 */}
              <div className="flex flex-col items-center text-center space-y-2.5">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-[#1a1a1a]" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-cyan-400" strokeDasharray="98, 100" strokeWidth="2.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                    4.9
                  </div>
                </div>
                <span className="text-[9px] font-mono text-text-secondary uppercase">Console Health</span>
              </div>
            </div>
          </Card>

          {/* Card 3: Global Threat Origins Map (Distance Traveled Map style) */}
          <Card className="p-5 bg-dark-panel border border-white/[0.02] rounded-[24px] space-y-4 flex flex-col justify-between">
            <span className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest border-b border-white/[0.02] pb-3">
              Attack Origin Vectors
            </span>

            {/* Dotted Map Simulation */}
            <div className="h-36 w-full relative flex items-center justify-center bg-[#0d0d0d] rounded-2xl border border-white/[0.02] p-2 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 200 100" fill="none" className="opacity-70">
                <style>{`
                  @keyframes drawArc {
                    to { stroke-dashoffset: -40; }
                  }
                  .arc-flow {
                    stroke-dasharray: 4 4;
                    animation: drawArc 2.5s linear infinite;
                  }
                  @keyframes pulseDot {
                    0% { r: 1.5; opacity: 0.3; }
                    50% { r: 3.5; opacity: 1; }
                    100% { r: 1.5; opacity: 0.3; }
                  }
                  .pulse-dot {
                    animation: pulseDot 2.5s ease-in-out infinite;
                  }
                `}</style>
                {/* Dotted paths representing grid/map paths */}
                <path d="M20,30 Q40,32 50,45 T90,40 T130,50 T180,35" stroke="#222" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                <path d="M30,60 Q60,65 80,75 T140,65 T170,70" stroke="#222" strokeWidth="1" strokeDasharray="2 2" fill="none" />
                
                {/* Attack Pins (Origins) */}
                <circle cx="35" cy="40" r="2.2" fill="#ef4444" className="pulse-dot" style={{ animationDelay: '0s' }} />
                <circle cx="85" cy="25" r="2.2" fill="#f59e0b" className="pulse-dot" style={{ animationDelay: '0.6s' }} />
                <circle cx="170" cy="35" r="2.2" fill="#10b981" className="pulse-dot" style={{ animationDelay: '1.2s' }} />
                <circle cx="150" cy="75" r="2.2" fill="#3b82f6" className="pulse-dot" style={{ animationDelay: '1.8s' }} />
                
                {/* Target Pin (Database Center) */}
                <circle cx="120" cy="55" r="3.2" fill="#b3ff00" className="pulse-dot" style={{ animationDelay: '0.3s' }} />
                
                {/* Arc connections with running dashes */}
                {/* North America to Center */}
                <path d="M35,40 Q77.5,15 120,55" stroke="#ef4444" strokeWidth="1" className="arc-flow" fill="none" opacity="0.8" />
                {/* Europe to Center */}
                <path d="M85,25 Q102.5,35 120,55" stroke="#f59e0b" strokeWidth="1" className="arc-flow" fill="none" opacity="0.8" />
                {/* East Asia to Center */}
                <path d="M170,35 Q145,45 120,55" stroke="#10b981" strokeWidth="1" className="arc-flow" fill="none" opacity="0.8" />
                {/* Australia to Center */}
                <path d="M150,75 Q135,65 120,55" stroke="#3b82f6" strokeWidth="1" className="arc-flow" fill="none" opacity="0.8" />
              </svg>

              <div className="absolute top-2 left-2 flex items-center space-x-1.5 text-[8px] font-mono bg-black/60 px-2 py-0.5 rounded border border-white/[0.04] text-text-secondary uppercase select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-ping" />
                <span>Monitoring Live Map</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-end justify-between font-mono">
              <div>
                <span className="text-[10px] text-text-secondary uppercase block leading-none">Mitigation Load</span>
                <span className="text-lg font-bold text-white block mt-1.5 tracking-tight">1,745 Events/s</span>
              </div>
              <span className="text-[9px] text-text-secondary uppercase leading-none pb-0.5">Last 30 Days</span>
            </div>

            {/* Horizontal progress meter bar */}
            <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden">
              <div className="bg-accent-lime h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(179,255,0,0.4)]" />
            </div>
          </Card>
        </div>
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
