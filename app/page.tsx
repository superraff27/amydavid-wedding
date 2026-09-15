'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Lenis from 'lenis';
import { supabase, DEFAULT_SETTINGS, type WeddingSettings } from '@/lib/supabase';

const NAV_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'story', label: 'Story' },
  { id: 'details', label: 'Details' },
  { id: 'location', label: 'Location' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'rsvp', label: 'RSVP' },
];

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

export default function Home() {
  const [settings, setSettings] = useState<WeddingSettings>(DEFAULT_SETTINGS);
  const [opened, setOpened] = useState(false);
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({ name: '', attending: 'yes' as 'yes' | 'no', guests: 1, message: '' });
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Pull editable content from Supabase (couple names, date, venue…).
  // Falls back to DEFAULT_SETTINGS if Supabase isn't configured yet or the
  // fetch fails, so the site never breaks.
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('wedding_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setSettings(data as WeddingSettings);
      });
  }, []);

  const weddingDate = new Date(settings.wedding_date);
  const dateShort = weddingDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', ' · ');
  const dateLong = weddingDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  const venueMapsQuery = encodeURIComponent(settings.venue_maps_query);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    let frame = 0;
    const raf = (t: number) => { lenis.raf(t); frame = requestAnimationFrame(raf); };
    frame = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(frame); lenis.destroy(); };
  }, []);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, weddingDate.getTime() - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor(diff / 3600000) % 24,
        minutes: Math.floor(diff / 60000) % 60,
        seconds: Math.floor(diff / 1000) % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings.wedding_date]);

  useEffect(() => {
    if (!opened || !pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.reveal',
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.15, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
      );
      gsap.fromTo('.hero-photo',
        { scale: 1.08 },
        { scale: 1, duration: 2.2, ease: 'power3.out' }
      );
    }, pageRef);
    return () => ctx.revert();
  }, [opened]);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (musicOn) {
      audio.pause();
      setMusicOn(false);
    } else {
      audio.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpForm.name.trim()) {
      setRsvpError('Please enter your name.');
      return;
    }
    setRsvpError('');
    setRsvpSubmitting(true);
    const entry = {
      name: rsvpForm.name.trim(),
      attending: rsvpForm.attending,
      guests: rsvpForm.attending === 'yes' ? rsvpForm.guests : 0,
      message: rsvpForm.message.trim(),
    };

    if (supabase) {
      const { error } = await supabase.from('rsvps').insert(entry);
      if (error) {
        setRsvpError("Sorry, that didn't go through. Please try again.");
        setRsvpSubmitting(false);
        return;
      }
    } else {
      // Supabase not configured yet — keep working locally so the form is
      // still testable during development.
      try {
        const existing = JSON.parse(localStorage.getItem('amy-david-rsvp') || '[]');
        existing.push({ ...entry, submittedAt: new Date().toISOString() });
        localStorage.setItem('amy-david-rsvp', JSON.stringify(existing));
      } catch {
        // storage unavailable — still show confirmation to the guest
      }
    }

    setRsvpSubmitting(false);
    setRsvpSubmitted(true);
  };

  return (
    <main ref={pageRef}>
      {!opened && (
        <section className="opening">
          <div className="opening-photo" />
          <div className="opening-shade" />
          <div className="film-grain" />
          <div className="opening-inner">
            <p className="eyebrow">THE WEDDING OF</p>
            <h1><span>{settings.couple_name_a.toUpperCase()}</span><i>&amp;</i><span>{settings.couple_name_b.toUpperCase()}</span></h1>
            <div className="opening-rule" />
            <p className="date">{dateShort}</p>
            <button className="enter" onClick={() => setOpened(true)}>
              <span>OPEN INVITATION</span><b>↗</b>
            </button>
          </div>
          <div className="scroll-hint">SCROLL TO DISCOVER</div>
        </section>
      )}

      {opened && (
        <>
          <audio ref={audioRef} src="/audio/song.mp3" loop preload="none" />
          <nav className="site-nav">
            <button className="nav-monogram" onClick={() => scrollTo('home')}>{settings.couple_name_a[0]} <i>&amp;</i> {settings.couple_name_b[0]}</button>
            <div className="nav-tools">
              <button className={`music-toggle ${musicOn ? 'is-on' : ''}`} onClick={toggleMusic} aria-label={musicOn ? 'Pause music' : 'Play music'}>
                <span /><span /><span />
              </button>
              <button className={`nav-burger ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
                <span /><span />
              </button>
            </div>
          </nav>
          <div className={`nav-overlay ${menuOpen ? 'nav-overlay--open' : ''}`}>
            <ul>
              {NAV_LINKS.map((link, i) => (
                <li key={link.id} style={{ transitionDelay: `${i * 45}ms` }}>
                  <button onClick={() => scrollTo(link.id)}>{link.label}</button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <div className={`site ${opened ? 'site--visible' : ''}`}>
        <section className="hero" id="home">
          <img className="hero-photo" src="/images/hero.jpg" alt={`${settings.couple_name_a} and ${settings.couple_name_b} holding hands outdoors`} />
          <div className="hero-vignette" />
          <div className="hero-copy">
            <Reveal><p className="eyebrow">{dateLong} · {settings.venue_address.toUpperCase()}</p></Reveal>
            <Reveal><h2>{settings.couple_name_a} <em>&amp;</em> {settings.couple_name_b}</h2></Reveal>
            <Reveal><p className="hero-sub">{settings.eyebrow_tagline}</p></Reveal>
          </div>
          <button className="menu-pill" onClick={() => scrollTo('details')}>EXPLORE ↓</button>
        </section>

        <section className="manifesto section" id="story">
          <div className="section-number">01 / 06</div>
          <Reveal><p className="eyebrow">THE BEGINNING</p></Reveal>
          <Reveal><h3>Some stories are<br/><em>worth celebrating.</em></h3></Reveal>
          <Reveal><p className="copy">With grateful hearts and our favorite people by our side, we invite you to celebrate the beginning of our forever.</p></Reveal>
        </section>

        <section className="statement-image">
          <img src="/images/golden-hour.jpg" alt="Amy and David beneath a veil in golden hour light" />
          <div className="image-caption">LOVE, IN ITS SOFTEST LIGHT</div>
        </section>

        <section className="details section" id="details">
          <div className="section-number">02 / 06</div>
          <Reveal><p className="eyebrow">THE DAY</p></Reveal>
          <Reveal><h3>Save<br/><em>the date.</em></h3></Reveal>
          <div className="countdown reveal">
            {[
              [time.days, 'DAYS'], [time.hours, 'HOURS'], [time.minutes, 'MIN'], [time.seconds, 'SEC']
            ].map(([n, label]) => (
              <div key={label}><strong>{String(n).padStart(2, '0')}</strong><span>{label}</span></div>
            ))}
          </div>
          <div className="events">
            <article className="event reveal"><span>THE CEREMONY</span><strong>{settings.ceremony_time}</strong><small>{settings.venue_name} · {settings.venue_address}</small></article>
            <article className="event reveal"><span>THE RECEPTION</span><strong>{settings.reception_time}</strong><small>Champagne · Dinner · Dancing</small></article>
          </div>
        </section>

        <section className="location section" id="location">
          <div className="section-number">03 / 06</div>
          <Reveal><p className="eyebrow">FIND US</p></Reveal>
          <Reveal><h3>The<br/><em>venue.</em></h3></Reveal>
          <div className="location-grid reveal">
            <div className="location-info">
              <p className="copy">Ceremony and reception both take place at {settings.venue_name}, set within {settings.venue_address} — easy parking on site and step-free access throughout.</p>
              <dl className="location-facts">
                <div><dt>ADDRESS</dt><dd>{settings.venue_name}, {settings.venue_address}</dd></div>
                <div><dt>CEREMONY</dt><dd>{settings.ceremony_time}</dd></div>
                <div><dt>RECEPTION</dt><dd>{settings.reception_time}</dd></div>
              </dl>
              <a className="rsvp-button" href={`https://www.google.com/maps/dir/?api=1&destination=${venueMapsQuery}`} target="_blank" rel="noopener noreferrer">
                GET DIRECTIONS <span>↗</span>
              </a>
            </div>
            <div className="location-map">
              <iframe
                title="Wedding venue map"
                src={`https://www.google.com/maps?q=${venueMapsQuery}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="editorial-gallery" id="gallery">
          <div className="gallery-intro"><p className="eyebrow">04 / 06 · MOMENTS</p><h3>A little<br/><em>in between.</em></h3></div>
          <figure className="photo photo-a"><img src="/images/veil-kiss.jpg" alt="Couple sharing a kiss beneath a veil" /></figure>
          <figure className="photo photo-b"><img src="/images/hands.jpg" alt="Wedding rings and bouquet" /></figure>
          <figure className="photo photo-c"><img src="/images/celebration.jpg" alt="Couple celebrating outdoors" /></figure>
          <figure className="photo photo-d"><img src="/images/ring.jpg" alt="Wedding ring detail" /></figure>
        </section>

        <section className="rsvp section" id="rsvp">
          <div className="section-number">05 / 06</div>
          <Reveal><p className="eyebrow">YOUR PRESENCE</p></Reveal>
          <Reveal><h3>Will you<br/><em>join us?</em></h3></Reveal>
          {!rsvpSubmitted ? (
            <>
              <Reveal><p className="copy">Kindly let us know if you can celebrate with us. We would be honored to have you there.</p></Reveal>
              <form className="rsvp-form reveal" onSubmit={handleRsvpSubmit}>
                <div className="field">
                  <label htmlFor="rsvp-name">FULL NAME</label>
                  <input
                    id="rsvp-name"
                    type="text"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>

                <div className="field">
                  <label>WILL YOU ATTEND?</label>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill ${rsvpForm.attending === 'yes' ? 'is-active' : ''}`}
                      onClick={() => setRsvpForm((f) => ({ ...f, attending: 'yes' }))}
                    >JOYFULLY ACCEPTS</button>
                    <button
                      type="button"
                      className={`pill ${rsvpForm.attending === 'no' ? 'is-active' : ''}`}
                      onClick={() => setRsvpForm((f) => ({ ...f, attending: 'no' }))}
                    >REGRETFULLY DECLINES</button>
                  </div>
                </div>

                {rsvpForm.attending === 'yes' && (
                  <div className="field">
                    <label htmlFor="rsvp-guests">NUMBER OF GUESTS</label>
                    <select
                      id="rsvp-guests"
                      value={rsvpForm.guests}
                      onChange={(e) => setRsvpForm((f) => ({ ...f, guests: Number(e.target.value) }))}
                    >
                      {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="rsvp-message">A NOTE FOR THE COUPLE (OPTIONAL)</label>
                  <textarea
                    id="rsvp-message"
                    rows={3}
                    value={rsvpForm.message}
                    onChange={(e) => setRsvpForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Leave a wish, song request, or note"
                  />
                </div>

                {rsvpError && <p className="rsvp-error">{rsvpError}</p>}

                <button type="submit" className="rsvp-button" disabled={rsvpSubmitting}>
                  {rsvpSubmitting ? 'SENDING…' : 'SEND RSVP'} <span>↗</span>
                </button>
              </form>
            </>
          ) : (
            <Reveal className="rsvp-thanks">
              <p className="copy">
                {rsvpForm.attending === 'yes'
                  ? `Thank you, ${rsvpForm.name}. We can't wait to celebrate with you.`
                  : `Thank you, ${rsvpForm.name}. You'll be missed — we appreciate you letting us know.`}
              </p>
            </Reveal>
          )}
        </section>

        <footer className="footer">
          <div className="footer-monogram">{settings.couple_name_a[0]} <i>&amp;</i> {settings.couple_name_b[0]}</div>
          <p>FOREVER BEGINS HERE</p>
          <small>{dateShort}</small>
        </footer>
      </div>
    </main>
  );
}
