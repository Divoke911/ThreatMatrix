import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { Shield, AlertCircle, KeyRound, Mail, Terminal } from 'lucide-react';
import loginAccentBg from '../assets/login_accent_bg.jpg';

const LoginPage = () => {
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="flex items-center justify-center min-h-screen bg-dark-base px-4 relative overflow-hidden font-sans">
      {/* Subtle glow highlight in background */}
      <div className="absolute w-[600px] h-[600px] bg-accent-lime/5 blur-[150px] rounded-full pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

      {/* Main card panel with 24px border radius and custom split layout */}
      <Card className="w-full max-w-4xl p-0 overflow-hidden relative z-10 grid grid-cols-1 md:grid-cols-2 min-h-[580px] shadow-[0_8px_30px_rgb(0,0,0,0.6)]" hoverGlow={false}>
        {/* Left Side: Modern 3D Rods Graphic Sidebar (Hidden on mobile) */}
        <div className="hidden md:block relative overflow-hidden select-none">
          <img 
            src={loginAccentBg} 
            alt="Security Cyber Visualization" 
            className="absolute inset-0 w-full h-full object-cover brightness-[0.7]"
          />
          {/* Neon overlay vignette */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a]/95 via-transparent to-[#0a0a0a]/80" />
          
          <div className="absolute bottom-10 left-10 right-10 z-20 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-lime/10 border border-accent-lime/20 text-accent-lime font-mono text-[10px] tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-lime animate-pulse" />
              <span>Next-Gen Cybersecurity Core</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white leading-tight font-sans tracking-tight">
              Threat Intelligence <br />
              & Incident Response
            </h2>
            <p className="text-xs text-text-secondary font-mono leading-relaxed max-w-xs uppercase">
              // Real-time AI triage engine with multi-role privilege escalation monitoring protocols.
            </p>
          </div>
        </div>

        {/* Right Side: Form Controls */}
        <div className="p-8 md:p-12 flex flex-col justify-between bg-[#161616]">
          {/* Logo Section */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-accent-lime/10 border border-accent-lime/30 flex items-center justify-center shadow-glow-lime">
              <Shield className="w-5 h-5 text-accent-lime" />
            </div>
            <span className="text-xl font-bold tracking-widest text-white uppercase font-sans">
              Threat<span className="text-accent-lime">Matrix</span>
            </span>
          </div>

          <div className="my-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-xs text-text-secondary mt-1">Please enter your analyst credentials.</p>
            </div>

            {/* Error display */}
            {error && (
              <div className="flex items-start space-x-2.5 p-3.5 rounded-2xl border border-severity-critical/20 bg-severity-critical/10 text-severity-critical text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="font-mono leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5 ml-1">
                  E-mail
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your e-mail"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] hover:bg-[#202020] focus:bg-[#1a1a1a] border border-white/[0.04] focus:border-accent-lime rounded-2xl text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-text-secondary">
                    <KeyRound size={16} />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-[#1a1a1a] hover:bg-[#202020] focus:bg-[#1a1a1a] border border-white/[0.04] focus:border-accent-lime rounded-2xl text-xs text-text-primary placeholder-text-secondary/30 focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-secondary ml-1 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    className="rounded border-white/[0.04] bg-[#1a1a1a] text-accent-lime focus:ring-accent-lime/30 focus:ring-offset-[#161616] w-3.5 h-3.5"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" className="hover:text-accent-lime transition-colors">Forgot the password?</a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-4 font-mono tracking-widest text-xs uppercase shadow-lg shadow-accent-lime/10"
              >
                {loading ? 'Verifying Credentials...' : 'Log in'}
              </Button>
            </form>
          </div>

          {/* Console Audit Line */}
          <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-text-secondary">
            <div className="flex items-center space-x-1.5">
              <Terminal size={10} className="text-accent-lime" />
              <span>SOC_PORTAL // SECURE_LINK</span>
            </div>
            <span>VER_1.1.0</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
