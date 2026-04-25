import { useState } from 'react';
import { Truck, Lock, AlertCircle } from 'lucide-react';

interface PasswordGateProps {
  onAuthenticate: () => void;
}

export function PasswordGate({ onAuthenticate }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onAuthenticate();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Incorrect password');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError('Could not reach server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-bg-primary">
      <div className={`w-full max-w-sm transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-scania-blue px-5 py-3 rounded-xl mb-4">
            <Truck className="w-8 h-8 text-blue-400" />
            <div className="text-left">
              <div className="font-bold text-lg tracking-wide text-text-primary">ConAI</div>
              <div className="text-xs text-text-secondary">AINA LLM Tester</div>
            </div>
          </div>
          <p className="text-sm text-text-muted">Enter password to access the tool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(null); }}
              placeholder="Password"
              autoFocus
              disabled={submitting}
              className={`w-full bg-bg-secondary border rounded-lg pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none placeholder:text-text-muted ${
                error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
