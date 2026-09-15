'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, DEFAULT_SETTINGS, type WeddingSettings, type RsvpRow } from '@/lib/supabase';

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<WeddingSettings>(DEFAULT_SETTINGS);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/admin/login');
        return;
      }
      setChecking(false);
      loadData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    if (!supabase) return;
    const [{ data: settingsRow }, { data: rsvpRows }] = await Promise.all([
      supabase.from('wedding_settings').select('*').eq('id', 1).single(),
      supabase.from('rsvps').select('*').order('created_at', { ascending: false }),
    ]);
    if (settingsRow) setSettings(settingsRow as WeddingSettings);
    if (rsvpRows) setRsvps(rsvpRows as RsvpRow[]);
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
    router.push('/admin/login');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setSaveMsg('');
    const { id, updated_at, ...rest } = settings;
    const { error } = await supabase
      .from('wedding_settings')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', 1);
    setSaving(false);
    setSaveMsg(error ? 'Gagal menyimpan. Coba lagi.' : 'Tersimpan.');
  };

  const handleDeleteRsvp = async (id: string) => {
    if (!supabase) return;
    await supabase.from('rsvps').delete().eq('id', id);
    setRsvps((r) => r.filter((row) => row.id !== id));
  };

  if (checking) return <main className="admin-loading">Loading…</main>;

  if (!supabase) {
    return (
      <main className="admin-auth">
        <div className="admin-auth-card">
          <p className="eyebrow">ADMIN</p>
          <h1>Belum terhubung</h1>
          <p className="copy">
            Supabase belum dikonfigurasi. Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code>, lalu jalankan{' '}
            <code>supabase/schema.sql</code> di Supabase SQL Editor. Lihat README untuk panduan lengkap.
          </p>
        </div>
      </main>
    );
  }

  const attendingCount = rsvps.filter((r) => r.attending === 'yes').reduce((sum, r) => sum + r.guests, 0);
  const yesCount = rsvps.filter((r) => r.attending === 'yes').length;
  const noCount = rsvps.filter((r) => r.attending === 'no').length;

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <p className="eyebrow">ADMIN DASHBOARD</p>
        <button className="admin-signout" onClick={handleSignOut}>SIGN OUT</button>
      </header>

      <section className="admin-section">
        <h2>RSVP Summary</h2>
        <div className="admin-stats">
          <div><strong>{yesCount}</strong><span>ACCEPTED</span></div>
          <div><strong>{attendingCount}</strong><span>TOTAL GUESTS</span></div>
          <div><strong>{noCount}</strong><span>DECLINED</span></div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Status</th><th>Guests</th><th>Message</th><th>Submitted</th><th></th></tr>
            </thead>
            <tbody>
              {rsvps.length === 0 && (
                <tr><td colSpan={6} className="admin-empty">Belum ada RSVP masuk.</td></tr>
              )}
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td><span className={`admin-badge ${r.attending}`}>{r.attending === 'yes' ? 'Accepted' : 'Declined'}</span></td>
                  <td>{r.guests}</td>
                  <td className="admin-message">{r.message || '—'}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><button className="admin-delete" onClick={() => handleDeleteRsvp(r.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Wedding Details</h2>
        <p className="copy">Edit di sini akan langsung tampil di halaman undangan — tanpa perlu ubah kode.</p>
        <form className="admin-form" onSubmit={handleSaveSettings}>
          <div className="admin-form-grid">
            <div className="field">
              <label htmlFor="a">NAMA MEMPELAI A</label>
              <input id="a" value={settings.couple_name_a} onChange={(e) => setSettings((s) => ({ ...s, couple_name_a: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="b">NAMA MEMPELAI B</label>
              <input id="b" value={settings.couple_name_b} onChange={(e) => setSettings((s) => ({ ...s, couple_name_b: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="date">TANGGAL &amp; JAM</label>
              <input
                id="date"
                type="datetime-local"
                value={settings.wedding_date?.slice(0, 16)}
                onChange={(e) => setSettings((s) => ({ ...s, wedding_date: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="tagline">TAGLINE</label>
              <input id="tagline" value={settings.eyebrow_tagline} onChange={(e) => setSettings((s) => ({ ...s, eyebrow_tagline: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="venue">NAMA VENUE</label>
              <input id="venue" value={settings.venue_name} onChange={(e) => setSettings((s) => ({ ...s, venue_name: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="address">ALAMAT</label>
              <input id="address" value={settings.venue_address} onChange={(e) => setSettings((s) => ({ ...s, venue_address: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="mapsQuery">GOOGLE MAPS QUERY</label>
              <input id="mapsQuery" value={settings.venue_maps_query} onChange={(e) => setSettings((s) => ({ ...s, venue_maps_query: e.target.value }))} placeholder="Nama tempat sesuai Google Maps" />
            </div>
            <div className="field">
              <label htmlFor="ceremony">JAM CEREMONY</label>
              <input id="ceremony" value={settings.ceremony_time} onChange={(e) => setSettings((s) => ({ ...s, ceremony_time: e.target.value }))} />
            </div>
            <div className="field">
              <label htmlFor="reception">JAM RECEPTION</label>
              <input id="reception" value={settings.reception_time} onChange={(e) => setSettings((s) => ({ ...s, reception_time: e.target.value }))} />
            </div>
          </div>
          {saveMsg && <p className="admin-save-msg">{saveMsg}</p>}
          <button type="submit" className="rsvp-button" disabled={saving}>
            {saving ? 'MENYIMPAN…' : 'SIMPAN PERUBAHAN'} <span>↗</span>
          </button>
        </form>
      </section>
    </main>
  );
}
