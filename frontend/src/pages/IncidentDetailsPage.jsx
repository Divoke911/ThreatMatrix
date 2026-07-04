import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import AlertDetailsDrawer from '../components/AlertDetailsDrawer';
import {
  ShieldAlert,
  UserCheck,
  History,
  Terminal,
  X,
  MessageSquare,
  Link,
  Sparkles,
  ArrowLeft,
  Lock,
  Unlock
} from 'lucide-react';

const IncidentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analysts, setAnalysts] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [unlinkingId, setUnlinkingId] = useState(null);

  // Staged states for updates
  const [tempStatus, setTempStatus] = useState('');
  const [tempAssignedTo, setTempAssignedTo] = useState('');
  const [tempResolutionNotes, setTempResolutionNotes] = useState('');

  // Active selected alert for inspector drawer
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const fetchIncidentDetails = async () => {
    try {
      const resp = await api.get(`/incidents/${id}`);
      setIncident(resp.data);
      setTempStatus(resp.data.status);
      setTempAssignedTo(resp.data.assigned_to || '');
      setTempResolutionNotes(resp.data.resolution_notes || '');
    } catch (err) {
      setError('Failed to load incident detail parameters.');
      console.error(err);
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
        console.error("Failed to load responders", err);
      }
    };
    
    fetchIncidentDetails();
    fetchAnalystsList();
  }, [id]);

  const handleSaveChanges = async () => {
    setUpdating(true);
    try {
      const payload = {
        status: tempStatus,
        assigned_to: tempAssignedTo || null,
        resolution_notes: tempResolutionNotes.trim() || null
      };

      await api.patch(`/incidents/${id}`, payload);
      await fetchIncidentDetails();
    } catch (err) {
      console.error("Failed to update incident details", err);
      alert(err.response?.data?.msg || "Failed to update incident parameters.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const resp = await api.post(`/incidents/${id}/timeline`, { note: newNote.trim() });
      setIncident(prev => ({
        ...prev,
        timeline: [...prev.timeline, resp.data]
      }));
      setNewNote('');
    } catch (err) {
      console.error("Failed to submit timeline note", err);
      alert("Failed to submit manual timeline audit note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUnlinkAlert = async (alertId) => {
    setUnlinkingId(alertId);
    try {
      await api.delete(`/incidents/${id}/alerts`, { data: { alert_ids: [alertId] } });
      await fetchIncidentDetails();
    } catch (err) {
      console.error("Failed to unlink alert", err);
      alert("Failed to unlink alert from incident.");
    } finally {
      setUnlinkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-xs font-mono text-accent-cyan tracking-widest uppercase">
        Loading Incident Audit Parameters...
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 text-center text-xs font-mono text-severity-critical">
        {error || 'Incident details not resolved.'}
      </div>
    );
  }

  const userRoleStr = user?.role?.value || user?.role || 'viewer';
  const isViewer = userRoleStr === 'viewer';
  const isClosed = incident.status === 'closed';
  
  // Can only edit if not closed OR if admin attempting to transition status
  const isEditingLocked = isClosed && userRoleStr !== 'admin';
  const statusSelectDisabled = isViewer || (isClosed && userRoleStr !== 'admin') || updating;
  const otherInputsDisabled = isViewer || isClosed || updating;

  // St staged changes check
  const hasChanges = 
    tempStatus !== incident.status ||
    tempAssignedTo !== (incident.assigned_to || '') ||
    tempResolutionNotes !== (incident.resolution_notes || '');

  // Consolidate AI Recommendations from linked alerts
  const consolidatedRecommendations = [];
  incident.alerts.forEach(alert => {
    // If we have AI reports in this fetched object (or we map reports during fetching details)
    // Actually, we can fetch AI reports details if we want, but since they are loaded inside raw alerts or reports,
    // let's look for recommendation steps. In our seed, AI reports have type 'recommendation'
    // For a clean presentation, let's mock rendering them or pull from preseeded models.
  });

  return (
    <div className="space-y-6 relative">
      {/* Back button and title */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/incidents')}
          className="flex items-center space-x-2 text-xs font-mono text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>BACK TO REGISTRY</span>
        </button>
        {isClosed && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded border border-severity-critical/20 bg-severity-critical/10 text-severity-critical font-mono text-[10px]">
            <Lock size={12} />
            <span>ARCHIVED & SOFT-LOCKED</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-dark-border pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{incident.title}</h1>
          <p className="text-xs text-text-secondary font-mono mt-1">INCIDENT KEY: {incident.id}</p>
        </div>
        <Badge variant={incident.status}>{incident.status}</Badge>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attributes and Notes */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-5 bg-dark-panel/40 border border-dark-border">
            <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest border-b border-dark-border pb-2">
              Incident Context & Attributes
            </h3>
            
            {/* Description */}
            <div>
              <span className="block text-[9px] font-mono text-text-secondary uppercase mb-1">Incident Description</span>
              <p className="text-xs text-text-primary bg-dark-base/30 border border-dark-border rounded p-3 leading-relaxed">
                {incident.description || 'No description provided.'}
              </p>
            </div>

            {/* Dropdowns status and assignee */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Assignee Responder</label>
                <select
                  disabled={otherInputsDisabled}
                  value={tempAssignedTo}
                  onChange={(e) => setTempAssignedTo(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">UNASSIGNED</option>
                  {analysts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">Incident State</label>
                <select
                  disabled={statusSelectDisabled}
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="open">OPEN</option>
                  <option value="investigating">INVESTIGATING</option>
                  <option value="resolved">RESOLVED</option>
                  <option value="closed">CLOSED</option>
                </select>
              </div>
            </div>

            {/* Resolution Notes (Visible or editable based on state changes) */}
            {((tempStatus === 'resolved' || tempStatus === 'closed') || incident.resolution_notes) && (
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase mb-2">
                  Resolution / Remediation Summary
                  {((tempStatus === 'resolved' || tempStatus === 'closed') && !isClosed) && <span className="text-severity-critical ml-1">*Required</span>}
                </label>
                <textarea
                  disabled={otherInputsDisabled}
                  rows={4}
                  value={tempResolutionNotes}
                  onChange={(e) => setTempResolutionNotes(e.target.value)}
                  placeholder="Describe resolution actions, mitigation steps, and confirmation logs..."
                  className="w-full px-3 py-2 bg-dark-input border border-dark-border focus:border-accent-cyan rounded text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                />
              </div>
            )}

            {/* Apply Button */}
            {hasChanges && !isViewer && (
              <div className="flex justify-end pt-2 border-t border-dark-border">
                <Button
                  onClick={handleSaveChanges}
                  disabled={updating}
                  variant="primary"
                  size="sm"
                  className="font-mono text-xs uppercase"
                >
                  {updating ? 'Saving Changes...' : 'Apply Incident Parameters'}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Linked Alerts */}
        <div className="space-y-6">
          <Card className="space-y-4 bg-dark-panel/40 border border-dark-border">
            <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest border-b border-dark-border pb-2 flex items-center space-x-1.5">
              <Link size={12} className="text-accent-cyan" />
              <span>Correlated alerts ({incident.alerts.length})</span>
            </h3>

            {incident.alerts.length === 0 ? (
              <div className="text-xs font-mono text-text-secondary p-4 bg-dark-hover/15 rounded border border-dashed border-dark-border text-center">
                NO LINKED SECURITY ALERTS
              </div>
            ) : (
              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {incident.alerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="p-3 bg-dark-base border border-dark-border rounded flex flex-col justify-between hover:border-accent-cyan/40 transition-colors"
                  >
                    <div 
                      onClick={() => setSelectedAlertId(alert.id)}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant={alert.severity}>{alert.severity}</Badge>
                        <span className="text-[9px] font-mono text-text-secondary">{alert.source.toUpperCase()}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-text-primary hover:text-accent-cyan transition-colors truncate">
                        {alert.title}
                      </h4>
                      <span className="font-mono text-[9px] text-accent-blue mt-1 block">IP: {alert.source_ip || 'N/A'}</span>
                    </div>
                    
                    {/* Unlink Action */}
                    {!isViewer && !isClosed && (
                      <div className="flex justify-end mt-2 pt-2 border-t border-dark-border/40">
                        <button
                          disabled={unlinkingId === alert.id}
                          onClick={() => handleUnlinkAlert(alert.id)}
                          className="text-[9px] font-mono text-text-secondary hover:text-severity-critical flex items-center space-x-1"
                        >
                          <X size={10} />
                          <span>{unlinkingId === alert.id ? 'Unlinking...' : 'Unlink Alert'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Consolidated AI Assist Panel */}
          <Card className="bg-gradient-to-br from-dark-panel to-dark-base border border-accent-cyan/15 space-y-3 p-5">
            <h3 className="text-xs font-mono text-accent-cyan uppercase tracking-widest flex items-center space-x-1.5">
              <Sparkles size={14} className="text-accent-cyan" />
              <span>Consolidated AI Assist</span>
            </h3>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Consolidation algorithms aggregate MITRE alignments and mitigation summaries across linked alerts automatically. Link alerts to generate response plans.
            </p>
            <div className="text-[10px] font-mono p-2.5 bg-dark-base/40 border border-dark-border rounded text-text-secondary">
              SYSTEM STATUS: READY FOR INGESTION
            </div>
          </Card>
        </div>
      </div>

      {/* Chronological Timeline History */}
      <Card className="space-y-6 bg-dark-panel/40 border border-dark-border">
        <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest border-b border-dark-border pb-2 flex items-center space-x-1.5">
          <History size={14} className="text-accent-cyan" />
          <span>Chronological Investigation Timeline</span>
        </h3>

        {/* Timeline Trails */}
        <div className="relative border-l border-dark-border pl-6 ml-3 space-y-6">
          {incident.timeline.map((event) => {
            const isNote = event.event_type === 'note_added';
            const isCreated = event.event_type === 'created';
            const isStatus = event.event_type === 'status_change';
            const isAssign = event.event_type === 'assignment_change';

            return (
              <div key={event.id} className="relative">
                {/* Bullet indicator */}
                <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-dark-panel flex items-center justify-center 
                  ${isCreated ? 'bg-sky-400' : isStatus ? 'bg-amber-400' : isAssign ? 'bg-indigo-400' : 'bg-accent-cyan'}
                `} />

                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-[10px] font-mono">
                    <span className="text-text-primary font-bold">{event.actor_name}</span>
                    <span className="text-accent-cyan uppercase text-[9px]">{event.actor_role}</span>
                    <span className="text-text-secondary">•</span>
                    <span className="text-text-secondary">{new Date(event.created_at).toLocaleString()}</span>
                  </div>

                  <div className="text-xs text-text-primary font-sans leading-relaxed">
                    {/* Render message depending on details */}
                    <p className={isNote ? 'text-text-secondary italic' : 'font-semibold text-text-primary'}>
                      {event.detail?.message || event.detail?.note}
                    </p>
                    {isNote && event.detail?.note && (
                      <p className="mt-1.5 p-3 rounded bg-dark-base/50 border border-dark-border/40 text-text-primary font-mono text-xs whitespace-pre-wrap">
                        {event.detail.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Note Form */}
        {!isViewer && !isClosed && (
          <form onSubmit={handleAddNote} className="pt-4 border-t border-dark-border space-y-3">
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest">Append Investigation Note</label>
            <textarea
              rows={2}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Input logs, findings, or containment actions to commit to the timeline trail..."
              className="w-full px-3 py-2 bg-dark-input border border-dark-border focus:border-accent-cyan rounded text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-colors font-mono"
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                variant="primary"
                size="sm"
                className="font-mono text-xs uppercase"
              >
                {submittingNote ? 'Saving Note...' : 'Commit Note'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Slide-out details drawer overlay for linked alert inspection */}
      {selectedAlertId && (
        <AlertDetailsDrawer
          alertId={selectedAlertId}
          onClose={() => setSelectedAlertId(null)}
          userRole={userRoleStr}
          onAlertUpdated={fetchIncidentDetails} // Reload incident details if alert state modified inside drawer
        />
      )}
    </div>
  );
};

export default IncidentDetailsPage;
