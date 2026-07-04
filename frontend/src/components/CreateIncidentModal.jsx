import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from './Button';
import Card from './Card';
import { X, ShieldAlert } from 'lucide-react';

const CreateIncidentModal = ({ isOpen, onClose, onCreated, preLinkedAlerts = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [analysts, setAnalysts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch active analysts & admins
    const fetchAnalysts = async () => {
      try {
        const resp = await api.get('/incidents/analysts');
        setAnalysts(resp.data);
      } catch (err) {
        console.error("Failed to load analysts", err);
      }
    };
    fetchAnalysts();
    
    // Reset values
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setError('');
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title parameter is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        alert_ids: preLinkedAlerts.map(a => a.id)
      };
      if (assignedTo) {
        payload.assigned_to = assignedTo;
      }

      const resp = await api.post('/incidents', payload);
      if (onCreated) {
        onCreated(resp.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to initialize incident.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-base/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6 glass-panel relative overflow-hidden" hoverGlow={false}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent shadow-glow-cyan" />
        
        {/* Title bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-text-primary">Initialize Incident</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-dark-hover">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded border border-severity-critical/20 bg-severity-critical/10 text-severity-critical text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Incident Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. INC-1002: Credentials harvesting detection"
              className="w-full px-3 py-2 bg-dark-input border border-dark-border focus:border-accent-cyan rounded text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Description Context</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summarize target assets affected, impact, and initial audit logs..."
              className="w-full px-3 py-2 bg-dark-input border border-dark-border focus:border-accent-cyan rounded text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Assign Analyst Responder</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-dark-input border border-dark-border focus:border-accent-cyan rounded px-2.5 py-2 text-xs text-text-primary focus:outline-none font-mono"
            >
              <option value="">LEAVE UNASSIGNED (OPEN)</option>
              {analysts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.role.toUpperCase()})</option>
              ))}
            </select>
          </div>

          {preLinkedAlerts.length > 0 && (
            <div className="p-3 bg-dark-base border border-dark-border rounded">
              <span className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">Escalated Alerts Context</span>
              <ul className="space-y-1 text-[10px] font-mono text-accent-cyan">
                {preLinkedAlerts.map(a => (
                  <li key={a.id} className="truncate">• {a.title}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-dark-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="font-mono text-xs uppercase">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} variant="primary" size="sm" className="font-mono text-xs uppercase">
              {loading ? 'Initializing...' : 'Confirm Incident'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateIncidentModal;
