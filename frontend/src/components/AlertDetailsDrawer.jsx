import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Badge from './Badge';
import Button from './Button';
import { X, ShieldAlert, Terminal, Link2, Sparkles } from 'lucide-react';

const AlertDetailsDrawer = ({ alertId, onClose, userRole, onAlertUpdated }) => {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Staged states for status and severity updates
  const [tempStatus, setTempStatus] = useState('');
  const [tempSeverity, setTempSeverity] = useState('');

  const isViewer = userRole === 'viewer';

  useEffect(() => {
    if (!alertId) return;
    
    const fetchAlertDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await api.get(`/alerts/${alertId}`);
        setAlert(resp.data);
        setTempStatus(resp.data.status);
        setTempSeverity(resp.data.severity);
      } catch (err) {
        setError('Failed to load alert payload details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertDetails();
  }, [alertId]);

  const handleSaveChanges = async () => {
    if (isViewer) return;
    setUpdating(true);
    try {
      const resp = await api.patch(`/alerts/${alertId}`, {
        status: tempStatus,
        severity: tempSeverity
      });
      setAlert(prev => ({
        ...prev,
        status: tempStatus,
        severity: tempSeverity
      }));
      if (onAlertUpdated) {
        onAlertUpdated(resp.data);
      }
    } catch (err) {
      console.error("Failed to update alert parameters", err);
      alert("Unauthorized or database failure while modifying alert.");
    } finally {
      setUpdating(false);
    }
  };

  if (!alertId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-dark-panel border-l border-dark-border shadow-2xl z-50 flex flex-col transition-all duration-300 transform translate-x-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark-border bg-dark-base/40">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-accent-cyan" />
          <span className="font-mono text-[10px] text-text-secondary uppercase tracking-widest">Alert Inspector</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-dark-hover rounded transition-colors text-text-secondary hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-xs font-mono text-accent-cyan tracking-widest uppercase">
          Injecting Alert Payload Context...
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center text-xs font-mono text-severity-critical">
          {error}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Headline */}
          <div>
            <h2 className="text-md font-bold text-text-primary leading-tight mb-2">{alert.title}</h2>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={alert.severity}>{alert.severity}</Badge>
              <Badge variant={alert.status}>{alert.status}</Badge>
              <span className="text-[9px] font-mono text-text-secondary px-2 py-0.5 bg-dark-hover border border-dark-border rounded">
                SRC: {alert.source.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded bg-dark-base/30 border border-dark-border font-mono text-[10px]">
            <div>
              <span className="text-text-secondary block mb-1">ALERT ID</span>
              <span className="text-text-primary select-all">{alert.id}</span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1">SOURCE IP ADDRESS</span>
              <span className="text-accent-blue font-semibold">{alert.source_ip || 'N/A'}</span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1">INGESTED AT</span>
              <span className="text-text-primary">{new Date(alert.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-text-secondary block mb-1">LAST AUDITED</span>
              <span className="text-text-primary">{new Date(alert.updated_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Associated Incident Tickets */}
          <div>
            <h4 className="text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
              <Link2 size={12} className="text-accent-cyan" />
              <span>Correlated Incidents</span>
            </h4>
            {alert.incidents && alert.incidents.length > 0 ? (
              <div className="space-y-2">
                {alert.incidents.map(inc => (
                  <div key={inc.id} className="flex items-center justify-between p-3 rounded bg-dark-hover/40 border border-dark-border text-xs">
                    <span className="font-semibold text-text-primary">{inc.title}</span>
                    <Badge variant={inc.status}>{inc.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] font-mono text-text-secondary p-4 bg-dark-hover/10 rounded border border-dashed border-dark-border text-center">
                NO CORRELATED INCIDENT ASSIGNMENTS
              </div>
            )}
          </div>

          {/* RBAC Update Dropdowns */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-wider mb-2">Change Status</label>
                <select
                  disabled={isViewer || updating}
                  value={tempStatus}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                >
                  <option value="new">NEW</option>
                  <option value="in_review">IN REVIEW</option>
                  <option value="escalated">ESCALATED</option>
                  <option value="closed">CLOSED</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-wider mb-2">Change Severity</label>
                <select
                  disabled={isViewer || updating}
                  value={tempSeverity}
                  onChange={(e) => setTempSeverity(e.target.value)}
                  className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                >
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="critical">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Staged Apply Button */}
            {!isViewer && (tempStatus !== alert.status || tempSeverity !== alert.severity) && (
              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleSaveChanges}
                  disabled={updating}
                  variant="primary"
                  size="sm"
                  className="font-mono text-[9px] uppercase px-3 py-1.5"
                >
                  {updating ? 'Applying...' : 'Apply Status/Severity Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* Raw Log payload */}
          <div>
            <h4 className="text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Terminal size={12} className="text-accent-cyan" />
              <span>Raw Syslog Payload</span>
            </h4>
            <pre className="p-4 rounded bg-dark-base border border-dark-border overflow-auto max-h-48 text-[10px] font-mono text-accent-cyan/90 leading-relaxed scrollbar-thin select-all">
              {JSON.stringify(alert.raw_log, null, 2)}
            </pre>
          </div>

          {/* Pre-seeded AI Reports */}
          <div>
            <h4 className="text-[10px] font-mono text-text-secondary uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles size={12} className="text-accent-cyan" />
              <span>AI Analyst Insights</span>
            </h4>
            {alert.ai_reports && alert.ai_reports.length > 0 ? (
              <div className="space-y-4">
                {alert.ai_reports.map(report => (
                  <div key={report.id} className="p-4 rounded bg-gradient-to-br from-dark-panel to-dark-base border border-accent-cyan/15 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-accent-cyan/10 border-l border-b border-accent-cyan/20 text-[8px] font-mono px-2 py-0.5 text-accent-cyan uppercase">
                      {report.model_used}
                    </div>
                    <span className="text-[9px] font-mono text-accent-cyan/85 uppercase block mb-2">{report.report_type} REPORT</span>
                    <div className="text-xs space-y-2 text-text-primary leading-relaxed">
                      {report.report_type === 'explanation' && (
                        <>
                          <p><strong>Summary:</strong> {report.content.summary}</p>
                          <p><strong>Details:</strong> {report.content.details}</p>
                        </>
                      )}
                      {report.report_type === 'recommendation' && (
                        <ul className="list-disc pl-4 space-y-1.5">
                          {report.content.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      )}
                      {report.report_type === 'mitre_mapping' && (
                        <div className="space-y-2 font-mono text-[9px] mt-2">
                          {report.content.techniques.map((tech, idx) => (
                            <div key={idx} className="p-2 bg-dark-base border border-dark-border rounded">
                              <p className="text-accent-cyan font-semibold">{tech.id}: {tech.name}</p>
                              <p className="text-text-secondary text-[8px]">Tactic: {tech.tactic}</p>
                              <p className="text-text-primary mt-1">{tech.rationale}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {report.report_type === 'log_summary' && (
                        <>
                          <p>{report.content.summary}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {report.content.indicators.map((ind, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-dark-base border border-dark-border text-[9px] font-mono text-text-secondary">
                                {ind}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] font-mono text-text-secondary p-4 bg-dark-hover/10 rounded border border-dashed border-dark-border text-center">
                NO GENERATED INSIGHTS AVAILABLE
              </div>
            )}
          </div>

          {/* Escalations Footer */}
          <div className="pt-4 border-t border-dark-border flex flex-col gap-3">
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                disabled 
                className="flex-1 font-mono text-[10px] uppercase cursor-not-allowed"
                title="Incident linking is locked in Phase 2a"
              >
                Link Incident
              </Button>
              <Button 
                variant="outline" 
                disabled 
                className="flex-1 font-mono text-[10px] uppercase cursor-not-allowed"
                title="Incident creation is locked in Phase 2a"
              >
                Create Incident
              </Button>
            </div>
            <Button
              variant="primary"
              disabled
              className="w-full font-mono text-[10px] uppercase cursor-not-allowed"
              title="AI Analysis Trigger will unlock in Phase 3"
            >
              Run AI Analyst Agent (Phase 3)
            </Button>
          </div>

        </div>
      )}
    </div>
  );
};

export default AlertDetailsDrawer;
