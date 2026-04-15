'use client'
import { useState, useEffect } from 'react'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export default function ProfilePage() {
  const [lang, setLang] = useState('en')
  const [role, setRole] = useState<'open' | 'admin' | 'collaborator' | 'viewer'>('open')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [authMode, setAuthMode] = useState('open')

  useEffect(() => {
    // Load language from localStorage
    const saved = localStorage.getItem('flashpro_lang')
    if (saved) setLang(saved)

    // Load profile + auth config
    fetch('/api/config').then(r => r.json()).then(c => {
      if (c) {
        setAuthMode(c.authMode || 'open')
        setRole(c.authMode === 'open' ? 'open' : 'admin')
      }
    }).catch(() => {})

    // Try to get session user info if available
    fetch('/api/presence').then(r => r.json()).then(d => {
      const me = d.users?.[0]
      if (me) { setName(me.name || ''); setEmail(me.email || '') }
    }).catch(() => {})
  }, [])

  const saveLanguage = (code: string) => {
    setLang(code)
    localStorage.setItem('flashpro_lang', code)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) { setPwMsg('Enter a new password.'); return }
    if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match.'); return }
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: newPassword })
    }).then(r => r.json()).then(() => {
      setPwMsg('Password updated!')
      setOldPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPwMsg(''), 3000)
    }).catch(() => setPwMsg('Failed to update password.'))
  }

  const selectedLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0]

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', fontFamily:'system-ui,-apple-system,sans-serif', padding:'24px 16px' }}>
      {/* Header */}
      <div style={{ maxWidth:680, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <a href="/" style={{ fontSize:12, color:'#2563EB', textDecoration:'none', fontWeight:600 }}>← Back to Board</a>
          <span style={{ color:'#E2E8F0' }}>|</span>
          <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>👤 Profile & Settings</span>
        </div>

        {/* My Profile Section */}
        <div style={{ background:'#FFFFFF', borderRadius:12, border:'1px solid #e5e5e5', padding:'20px 24px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#0F172A' }}>My Profile</h2>

          {authMode === 'open' ? (
            <div style={{ padding:'12px 14px', background:'#F8FAFC', border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#475569' }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>Open / Local mode</div>
              <div>No login required. You are accessing the board as an anonymous user on this device.</div>
              <div style={{ marginTop:8, fontSize:11, color:'#94A3B8' }}>To add authentication, go to ⚙ Config → Access Control.</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>Display Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, boxSizing:'border-box' as 'border-box' }} />
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>Email</label>
                  <input value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com" type="email"
                    style={{ width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, boxSizing:'border-box' as 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>Role</label>
                <span style={{ display:'inline-block', padding:'3px 12px', fontSize:12, fontWeight:600, borderRadius:20, background: role === 'admin' ? '#EFF6FF' : '#F0FDF4', color: role === 'admin' ? '#2563EB' : '#16A34A', border: `1px solid ${role === 'admin' ? '#BFDBFE' : '#bbf7d0'}` }}>
                  {role === 'admin' ? '🔑 Admin' : role === 'collaborator' ? '✏ Collaborator' : '👁 Viewer'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Change Password (for non-open modes) */}
        {authMode !== 'open' && (
          <div style={{ background:'#FFFFFF', borderRadius:12, border:'1px solid #e5e5e5', padding:'20px 24px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin:'0 0 16px', fontSize:16, fontWeight:700, color:'#0F172A' }}>Change Password</h2>
            <form onSubmit={handleChangePassword} style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>Current Password</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                  placeholder="Current password"
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, boxSizing:'border-box' as 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="New password"
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, boxSizing:'border-box' as 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  style={{ width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, boxSizing:'border-box' as 'border-box' }} />
              </div>
              {pwMsg && (
                <div style={{ fontSize:12, padding:'6px 10px', borderRadius:6, background: pwMsg.includes('!') ? '#F0FDF4' : '#FEF2F2', color: pwMsg.includes('!') ? '#16A34A' : '#DC2626', border: `1px solid ${pwMsg.includes('!') ? '#bbf7d0' : '#FECACA'}` }}>
                  {pwMsg}
                </div>
              )}
              <button type="submit"
                style={{ padding:'9px', background:'#2563EB', color:'#FFFFFF', border:'none', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* Language Selector */}
        <div style={{ background:'#FFFFFF', borderRadius:12, border:'1px solid #e5e5e5', padding:'20px 24px', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <h2 style={{ margin:'0 0 4px', fontSize:16, fontWeight:700, color:'#0F172A' }}>Language</h2>
          <p style={{ margin:'0 0 14px', fontSize:12, color:'#94A3B8' }}>Display language preference. Translation is coming soon — your selection is saved for when it lands.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {LANGUAGES.map(l => (
              <button key={l.code} onClick={() => saveLanguage(l.code)}
                style={{
                  padding:'8px 16px', fontSize:13, fontWeight:600, borderRadius:8, cursor:'pointer',
                  background: lang === l.code ? '#2563EB' : '#F8FAFC',
                  color: lang === l.code ? '#FFFFFF' : '#475569',
                  border: `1.5px solid ${lang === l.code ? '#2563EB' : '#E2E8F0'}`,
                  display:'flex', alignItems:'center', gap:6
                }}>
                <span style={{ fontSize:18 }}>{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop:10, fontSize:11, color:'#94A3B8' }}>
            Selected: {selectedLang.flag} {selectedLang.label} — stored in browser as <code>flashpro_lang</code>
          </div>
        </div>

        {/* Access Control */}
        <div style={{ background:'#FFFFFF', borderRadius:12, border:'1px solid #E2E8F0', padding:'20px 24px', marginBottom:16, boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
          <h2 style={{ margin:'0 0 4px', fontSize:16, fontWeight:600, color:'#0F172A' }}>Access Control</h2>
          <p style={{ margin:'0 0 14px', fontSize:12, color:'#94A3B8' }}>Current authentication mode for this board.</p>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:600, background: authMode==='open'?'#F1F5F9': authMode==='okta'?'#EFF6FF':'#FFF7ED', color: authMode==='open'?'#475569': authMode==='okta'?'#2563EB':'#D97706', border:`1px solid ${authMode==='open'?'#E2E8F0': authMode==='okta'?'#BFDBFE':'#FDE68A'}` }}>
              {authMode === 'open' ? '🌐 Local / Open' : authMode === 'okta' ? '🏢 ThoughtWorks SSO' : '🔒 Password Protected'}
            </span>
          </div>
          <a href="/settings#access" style={{ fontSize:12, color:'#2563EB', fontWeight:500, textDecoration:'none' }}>Change access settings →</a>
        </div>

        {/* Admin: Manage Users */}
        {role === 'admin' && authMode !== 'open' && (
          <div style={{ background:'#FFFFFF', borderRadius:12, border:'1px solid #e5e5e5', padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#0F172A' }}>Manage Users</h2>
            <p style={{ margin:'0 0 14px', fontSize:12, color:'#94A3B8' }}>As an admin you can manage team access.</p>
            <a href="/admin"
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', background:'#2563EB', color:'#FFFFFF', borderRadius:8, fontSize:13, fontWeight:700, textDecoration:'none' }}>
              👥 Go to User Management →
            </a>
          </div>
        )}

        {/* App info for open mode */}
        {authMode === 'open' && (
          <div style={{ background:'#FFFFFF', borderRadius:12, border:'1px solid #e5e5e5', padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
            <h2 style={{ margin:'0 0 8px', fontSize:16, fontWeight:700, color:'#0F172A' }}>About FlashPro Release Planner</h2>
            <p style={{ margin:'0 0 10px', fontSize:13, color:'#475569', lineHeight:1.6 }}>
              A fast, visual sprint planning tool for product teams. Import your story map, drag stories onto a 2D grid, and export your release plan.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <a href="/intro" style={{ fontSize:12, color:'#2563EB', fontWeight:600, textDecoration:'none' }}>? Setup Guide →</a>
              <a href="/admin" style={{ fontSize:12, color:'#2563EB', fontWeight:600, textDecoration:'none' }}>👥 Manage Users →</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
