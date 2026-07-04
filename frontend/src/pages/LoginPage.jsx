import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { Shield, AlertCircle, Terminal, KeyRound, Mail } from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide all authentication values.');
      return;
    }

    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-base px-4 relative overflow-hidden">
      {/* Glow highlight in the center background */}
      <div className="absolute w-[500px] h-[500px] bg-accent-cyan/5 blur-[120px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

      <Card className="w-full max-w-md p-8 glass-panel relative overflow-hidden z-10" hoverGlow={false}>
        {/* Neon style cyan top indicator line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent shadow-glow-cyan" />

        {/* Header Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center mb-3 shadow-glow-cyan">
            <Shield className="w-6 h-6 text-accent-cyan" />
          </div>
          <h1 className="text-2xl font-bold tracking-wider text-text-primary uppercase">
            Threat<span className="text-accent-cyan">Matrix</span>
          </h1>
          <p className="text-[10px] text-text-secondary font-mono tracking-wider mt-1.5 uppercase">
            Analyst Console // Secure Session Init
          </p>
        </div>

        {/* Error Panel (FR-1.7 Generic Responses) */}
        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 mb-5 rounded border border-severity-critical/20 bg-severity-critical/10 text-severity-critical text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="font-mono leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">
              Identity Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@threatmatrix.com"
                required
                className="w-full pl-10 pr-4 py-2 bg-dark-input hover:bg-dark-input/85 focus:bg-dark-panel border border-dark-border focus:border-accent-cyan rounded text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">
              Access Code (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2 bg-dark-input hover:bg-dark-input/85 focus:bg-dark-panel border border-dark-border focus:border-accent-cyan rounded text-sm text-text-primary placeholder-text-secondary/30 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 font-mono tracking-widest text-xs uppercase"
          >
            {loading ? 'Verifying Identity...' : 'Establish Connection'}
          </Button>
        </form>

        {/* Technical audit log line */}
        <div className="mt-8 pt-4 border-t border-dark-border flex items-center justify-between text-[9px] font-mono text-text-secondary">
          <div className="flex items-center space-x-1.5">
            <Terminal size={10} className="text-accent-cyan" />
            <span>DB_CONNECTED // TLS_ACTIVE</span>
          </div>
          <span>PORTAL_V1.0</span>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
