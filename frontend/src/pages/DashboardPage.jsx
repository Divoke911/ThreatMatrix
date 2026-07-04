import React from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Security Operations Center Dashboard</h1>
        <Badge variant="closed">DEMO ACTIVE</Badge>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverGlow>
          <h3 className="text-xs font-mono text-text-secondary uppercase mb-2">System Integrity</h3>
          <p className="text-2xl font-semibold text-emerald-400">OPERATIONAL</p>
        </Card>
        <Card hoverGlow>
          <h3 className="text-xs font-mono text-text-secondary uppercase mb-2">Seeded Log Entries</h3>
          <p className="text-2xl font-semibold text-accent-cyan">750 Logs Loaded</p>
        </Card>
        <Card hoverGlow>
          <h3 className="text-xs font-mono text-text-secondary uppercase mb-2">Escalated Tickets</h3>
          <p className="text-2xl font-semibold text-severity-critical shadow-glow-critical inline-block px-1">40 Active</p>
        </Card>
      </div>

      {/* Skeleton Frame Panel */}
      <Card className="h-64 flex items-center justify-center text-center">
        <div className="space-y-3 p-4">
          <p className="text-sm text-text-secondary font-mono max-w-lg">
            Dashboard metrics and trend charts will be initialized here in Phase 2. Core database tables and login credentials are fully validated and running.
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" size="sm">System Configuration</Button>
            <Button variant="primary" size="sm">Launch Analyst Console</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
