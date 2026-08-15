import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'
import { supabase, supabaseConfigured } from './lib/supabase'
import type { Application, ApplicationStatus, PlatformSettings, Profile } from './lib/types'

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your name.'),
  mobile: z.string().trim().min(8, 'Please enter a mobile number.'),
  suburb: z.string().trim().min(2, 'Please enter your suburb.'),
  food: z.string().trim().min(3, 'Tell us what kind of food you make.'),
  signatureDishes: z.string().trim().min(3, 'Tell us about your signature dishes.'),
  cookingFrom: z.string().min(1, 'Please choose where you cook.'),
  soldBefore: z.string().min(1, 'Please choose an option.'),
  whyLaunch: z.string().trim().min(10, 'Please share a little more.'),
  consent: z.literal(true, { error: 'Please confirm we can contact you.' }),
})

type View = 'apply' | 'account' | 'admin' | 'settings'
type Notice = { kind: 'error' | 'success'; text: string } | null
const statusLabel: Record<ApplicationStatus, string> = {
  submitted: 'Submitted', under_review: 'Under review', more_information_required: 'More information needed', approved: 'Approved', declined: 'Not selected',
}

function App() {
  const [view, setView] = useState<View>('apply')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [selected, setSelected] = useState<Application | null>(null)
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-up')
  const [showAuth, setShowAuth] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const loadData = async () => {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setProfile(null); setApplication(null); setApplications([]); setLoading(false); return }
    const { data: account } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(account as Profile | null)
    if (account?.role === 'admin') {
      const { data } = await supabase.from('kitchen_applications').select('*').order('created_at', { ascending: false })
      setApplications((data ?? []) as Application[])
      const { data: platformSettings } = await supabase.from('platform_settings').select('signature_meal_price_cents, platform_fee_bps, pickup_fee_cents, free_delivery_enabled, delivery_fee_cents').single()
      setSettings(platformSettings as PlatformSettings | null)
    } else {
      const { data } = await supabase.from('kitchen_applications').select('*').eq('applicant_id', user.id).maybeSingle()
      setApplication(data as Application | null)
    }
    setLoading(false)
  }
  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    void loadData()
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadData() })
    return () => listener.subscription.unsubscribe()
  }, [])

  const navigate = (next: View) => { setNotice(null); setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const logout = async () => { await supabase?.auth.signOut(); setProfile(null); navigate('apply') }
  const openAuth = (mode: 'sign-in' | 'sign-up') => { setAuthMode(mode); setShowAuth(true); setNotice(null) }
  const activeTitle = useMemo(() => view === 'admin' ? 'Admin' : view === 'settings' ? 'Platform settings' : view === 'account' ? 'Your kitchen' : 'Founding Kitchens', [view])

  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="/" aria-label="SSU Australia home"><span>S<span className="arrow">↑</span>SU</span><small>AUSTRALIA</small></a><nav>
      <button className={view === 'apply' ? 'active' : ''} onClick={() => navigate('apply')}>Apply</button>
      {profile && <button className={view === 'account' ? 'active' : ''} onClick={() => navigate('account')}>My account</button>}
      {isAdmin && <button className={view === 'admin' ? 'active' : ''} onClick={() => navigate('admin')}>Admin</button>}
      {isAdmin && <button className={view === 'settings' ? 'active' : ''} onClick={() => navigate('settings')}>Settings</button>}
      {profile ? <button onClick={() => void logout()}>Sign out</button> : <button className="button-small" onClick={() => openAuth('sign-in')}>Sign in</button>}
    </nav></header>
    <main><div className="eyebrow">SSU Australia · Serve Something Unique.</div><h1>{activeTitle}</h1>
      {!supabaseConfigured && <div className="notice error">This app needs its Supabase environment variables before accounts and applications can be used.</div>}
      {notice && <div className={`notice ${notice.kind}`}>{notice.text}</div>}
      {loading ? <p>Loading your secure workspace…</p> : view === 'apply' ? <ApplyView profile={profile} application={application} openAuth={openAuth} done={(a) => { setApplication(a); setProfile((p) => p ? { ...p, role: 'kitchen_founder' } : p); setNotice({ kind: 'success', text: 'Your application has been received. We’ll be in touch personally.' }); navigate('account') }} /> : view === 'account' ? <AccountView profile={profile} application={application} openAuth={openAuth} /> : view === 'settings' ? <SettingsView settings={settings} saved={(next) => { setSettings(next); setNotice({ kind: 'success', text: 'Platform pricing settings saved.' }) }} /> : <AdminView applications={applications} selected={selected} setSelected={setSelected} refreshed={loadData} notify={setNotice} />}
    </main>
    <footer><strong>SSU Australia</strong><span>Serve Something Unique.</span><span>The home of branded local kitchens.</span><span>Made in Ballina, Australia.</span></footer>
    {showAuth && <AuthModal mode={authMode} close={() => setShowAuth(false)} success={(message) => { setShowAuth(false); setNotice({ kind: 'success', text: message }) }} />}
  </div>
}

function ApplyView({ profile, application, openAuth, done }: { profile: Profile | null; application: Application | null; openAuth: (m: 'sign-in'|'sign-up') => void; done: (a: Application) => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); if (!profile) { openAuth('sign-up'); return }
    const fd = new FormData(event.currentTarget); const values = { fullName: String(fd.get('fullName') ?? ''), mobile: String(fd.get('mobile') ?? ''), suburb: String(fd.get('suburb') ?? ''), food: String(fd.get('food') ?? ''), signatureDishes: String(fd.get('signatureDishes') ?? ''), cookingFrom: String(fd.get('cookingFrom') ?? ''), soldBefore: String(fd.get('soldBefore') ?? ''), whyLaunch: String(fd.get('whyLaunch') ?? ''), consent: fd.get('consent') === 'on' }
    const parsed = applicationSchema.safeParse(values); if (!parsed.success) { setError(parsed.error.issues[0].message); return }
    if (!supabase) { setError('Supabase is not configured yet.'); return }; setBusy(true)
    const { data, error: rpcError } = await supabase.rpc('submit_kitchen_application', { p_full_name: values.fullName, p_mobile: values.mobile, p_suburb: values.suburb, p_food: values.food, p_signature_dishes: values.signatureDishes, p_cooking_from: values.cookingFrom, p_previously_sold_food: values.soldBefore === 'yes', p_why_launch: values.whyLaunch, p_proposed_name: String(fd.get('proposedName') ?? '') || null })
    setBusy(false); if (rpcError) { setError(rpcError.message); return }; done(data as Application)
  }
  if (application) return <section className="panel"><h2>You’ve already applied.</h2><p>Your application is <strong>{statusLabel[application.status]}</strong>. Visit <button className="text-button" onClick={() => location.hash = 'account'}>your account</button> to see the latest status.</p></section>
  return <section className="application-layout"><div className="intro"><h2>Be one of our first five kitchens.</h2><p>We’re looking for cooks in the Northern Rivers who want to build a food brand of their own.</p><p>Tell us what you cook, where you’re based and what you’d like your kitchen to become. You don’t need to have everything figured out yet.</p></div><form className="application-form panel" onSubmit={submit}><h2>Apply to become a Founding Kitchen</h2>{error && <p className="field-error">{error}</p>}<div className="form-grid"><Field name="fullName" label="Name" defaultValue={profile?.full_name}/><Field name="mobile" label="Email / mobile" type="tel"/><Field name="suburb" label="Suburb"/><Field name="food" label="What kind of food do you make?"/><Field name="signatureDishes" label="What are your best/signature dishes?"/><label>Where do you cook now?<select name="cookingFrom" defaultValue=""><option value="" disabled>Select one</option><option>Home kitchen</option><option>Cafe or restaurant</option><option>Commercial kitchen</option><option>Another kitchen</option></select></label><Field name="proposedName" label="Kitchen name (optional)" required={false}/><label>Have you ever sold food before?<select name="soldBefore" defaultValue=""><option value="" disabled>Select one</option><option value="yes">Yes</option><option value="no">No</option></select></label></div><label>Why would you like to launch your own kitchen?<textarea name="whyLaunch" rows={5}/></label><label className="checkbox"><input name="consent" type="checkbox"/> I’m happy for SSU Australia to contact me about this application.</label><button className="primary" disabled={busy}>{busy ? 'Submitting…' : profile ? 'Apply to become a Founding Kitchen' : 'Create an account to apply'}</button><p className="form-footnote">We’ll ask about food photos and any compliance details personally after we review your application.</p></form></section>
}
function Field({ name, label, type = 'text', defaultValue, required = true }: { name: string; label: string; type?: string; defaultValue?: string | null; required?: boolean }) { return <label>{label}<input name={name} type={type} defaultValue={defaultValue ?? undefined} required={required}/></label> }
function AccountView({ profile, application, openAuth }: { profile: Profile | null; application: Application | null; openAuth: (m: 'sign-in'|'sign-up') => void }) { if (!profile) return <section className="panel"><h2>Your kitchen account</h2><p>Create an account or sign in to see your application.</p><button className="primary" onClick={() => openAuth('sign-in')}>Sign in</button></section>; if (!application) return <section className="panel"><h2>No application yet</h2><p>Start your Founding Kitchen application from the Apply page.</p></section>; return <section className="panel status-card"><div><div className={`status ${application.status}`}>{statusLabel[application.status]}</div><h2>{application.proposed_name || 'Your Founding Kitchen application'}</h2><p>Submitted {new Date(application.created_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}.</p></div>{application.admin_note && <div className="review-note"><strong>Message from SSU Australia</strong><p>{application.admin_note}</p></div>}<p className="contact">Need to update something? Email <a href="mailto:ssuaustralia@gmail.com">ssuaustralia@gmail.com</a>.</p></section> }
function AdminView({ applications, selected, setSelected, refreshed, notify }: { applications: Application[]; selected: Application | null; setSelected: (a: Application | null) => void; refreshed: () => Promise<void>; notify: (n: Notice) => void }) { const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const review = async (status: ApplicationStatus) => { if (!selected || !supabase) return; setBusy(true); const { error } = await supabase.rpc('review_kitchen_application', { p_application_id: selected.id, p_status: status, p_note: note || null }); setBusy(false); if (error) { notify({kind:'error', text:error.message}); return }; notify({kind:'success', text:`Application marked ${statusLabel[status].toLowerCase()}.`}); await refreshed(); setSelected(null); setNote('') }; return <section className="admin-grid"><div className="panel"><h2>Applications <span className="count">{applications.length}</span></h2><div className="application-list">{applications.map(a => <button key={a.id} className={selected?.id === a.id ? 'selected' : ''} onClick={() => { setSelected(a); setNote(a.admin_note ?? '') }}><strong>{a.full_name}</strong><span>{a.suburb} · {statusLabel[a.status]}</span><small>{new Date(a.created_at).toLocaleDateString('en-AU')}</small></button>)}{applications.length === 0 && <p>No applications yet.</p>}</div></div><div className="panel detail">{selected ? <><div className={`status ${selected.status}`}>{statusLabel[selected.status]}</div><h2>{selected.full_name}</h2><dl><dt>Contact</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a><br />{selected.mobile}</dd><dt>Based in</dt><dd>{selected.suburb}</dd><dt>Food</dt><dd>{selected.food}</dd><dt>Signature dishes</dt><dd>{selected.signature_dishes}</dd><dt>Cooking from</dt><dd>{selected.cooking_from}</dd><dt>Sold before</dt><dd>{selected.previously_sold_food ? 'Yes' : 'No'}</dd><dt>Why launch</dt><dd>{selected.why_launch}</dd></dl><label>Message to applicant<textarea rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note shown in their account"/></label><div className="review-actions"><button disabled={busy} onClick={() => void review('under_review')}>Mark under review</button><button disabled={busy} onClick={() => void review('more_information_required')}>Request information</button><button disabled={busy} onClick={() => void review('declined')}>Decline</button><button className="primary" disabled={busy} onClick={() => void review('approved')}>Approve application</button></div></> : <p>Select an application to review it.</p>}</div></section> }
function SettingsView({ settings, saved }: { settings: PlatformSettings | null; saved: (settings: PlatformSettings) => void }) { const [busy, setBusy] = useState(false); const [error, setError] = useState(''); if (!settings) return <section className="panel"><p>Loading pricing settings…</p></section>; const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!supabase) return; const form = new FormData(event.currentTarget); const signature = Math.round(Number(form.get('signaturePrice')) * 100); const fee = Math.round(Number(form.get('platformFee')) * 100); const pickup = Math.round(Number(form.get('pickupFee')) * 100); const delivery = Math.round(Number(form.get('deliveryFee')) * 100); if ([signature, fee, pickup, delivery].some(Number.isNaN) || signature < 0 || fee < 0 || fee > 10000 || pickup < 0 || delivery < 0) { setError('Please enter valid non-negative amounts and a fee between 0% and 100%.'); return }; setBusy(true); setError(''); const { data, error: rpcError } = await supabase.rpc('update_platform_settings', { p_signature_meal_price_cents: signature, p_platform_fee_bps: fee, p_pickup_fee_cents: pickup, p_free_delivery_enabled: form.get('freeDelivery') === 'on', p_delivery_fee_cents: delivery }); setBusy(false); if (rpcError) { setError(rpcError.message); return }; saved(data as PlatformSettings) }; return <section className="panel settings"><h2>Commercial settings</h2><p>These values are the single source of truth for the SSU marketplace. Kitchen founders cannot alter them.</p><form onSubmit={submit}>{error && <p className="field-error">{error}</p>}<div className="form-grid"><Field name="signaturePrice" label="SSU Signature Meal price (AUD)" type="number" defaultValue={(settings.signature_meal_price_cents / 100).toFixed(2)}/><Field name="platformFee" label="SSU platform fee (%)" type="number" defaultValue={(settings.platform_fee_bps / 100).toFixed(2)}/><Field name="pickupFee" label="Pickup fee (AUD)" type="number" defaultValue={(settings.pickup_fee_cents / 100).toFixed(2)}/><Field name="deliveryFee" label="Delivery fee (AUD)" type="number" defaultValue={(settings.delivery_fee_cents / 100).toFixed(2)}/></div><label className="checkbox"><input type="checkbox" name="freeDelivery" defaultChecked={settings.free_delivery_enabled}/> FREE LOCAL DELIVERY — FOUNDING KITCHENS LAUNCH</label><div className="settings-note"><strong>12% applies to food only.</strong> Payment processing is recorded separately and delivery never contributes to the platform fee.</div><button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Save pricing settings'}</button></form></section> }
function AuthModal({ mode, close, success }: { mode: 'sign-in'|'sign-up'; close: () => void; success: (text: string) => void }) { const [currentMode, setCurrentMode] = useState(mode); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const submit = async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setError(''); const fd = new FormData(e.currentTarget); const email = String(fd.get('email')); const password = String(fd.get('password')); if (!supabase) { setError('Supabase is not configured yet.'); return }; setBusy(true); if (currentMode === 'sign-up') { const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: String(fd.get('name') || '') } } }); setBusy(false); if (authError) setError(authError.message); else if (!data.session) success('Check your email to confirm your account, then sign in to apply.'); else success('Your account is ready. You can now submit your application.') } else { const { error: authError } = await supabase.auth.signInWithPassword({ email, password }); setBusy(false); if (authError) setError(authError.message); else success('You’re signed in.') } }; return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true"><button className="close" onClick={close} aria-label="Close">×</button><div className="eyebrow">SSU Australia</div><h2>{currentMode === 'sign-up' ? 'Create your account' : 'Welcome back'}</h2><form onSubmit={submit}>{currentMode === 'sign-up' && <Field name="name" label="Your name"/>}<Field name="email" label="Email address" type="email"/><Field name="password" label="Password" type="password"/>{error && <p className="field-error">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Please wait…' : currentMode === 'sign-up' ? 'Create account' : 'Sign in'}</button></form><p>{currentMode === 'sign-up' ? 'Already have an account?' : 'New to SSU Australia?'} <button className="text-button" onClick={() => { setCurrentMode(currentMode === 'sign-up' ? 'sign-in' : 'sign-up'); setError('') }}>{currentMode === 'sign-up' ? 'Sign in' : 'Create an account'}</button></p></section></div> }
export default App
