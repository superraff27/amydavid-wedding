'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase belum dikonfigurasi. Isi dulu .env.local (lihat README).');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Email atau password salah.');
      return;
    }
    router.push('/admin');
  };

  return (
    <main className="admin-auth">
      <form onSubmit={handleSubmit} className="admin-auth-card">
        <p className="eyebrow">ADMIN</p>
        <h1>Sign in</h1>
        <div className="field">
          <label htmlFor="email">EMAIL</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="password">PASSWORD</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="rsvp-error">{error}</p>}
        <button type="submit" className="rsvp-button" disabled={loading}>
          {loading ? 'SIGNING IN…' : 'SIGN IN'} <span>↗</span>
        </button>
      </form>
    </main>
  );
}
