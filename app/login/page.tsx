'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'

function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const invite = params.get('invite')
  const inviteEmail = params.get('email') || ''
  const [mode, setMode] = useState<'login'|'accept-invite'|'create-admin'>('login')
  const [authMode, setAuthMode] = useState<string>('password')
  const [email, setEmail] = useState(inviteEmail)
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFirstUser, setIsFirstUser] = useState(false)

  useEffect(() => {
    fetch('/api/config').then(r=>r.json()).then(c=>setAuthMode(c.authMode||'open'))
    fetch('/api/users').then(r=>r.json()).then(d=>{ if(d.users?.length===0) setIsFirstUser(true) })
    if(invite) setMode('accept-invite')
  }, [invite])

  const handleSubmit = async () => {
    setLoading(true); setError('')
    if(isFirstUser && mode==='login') { setMode('create-admin'); setLoading(false); return }
    if(mode==='create-admin') {
      if(!email||!password||!name) { setError('All fields required'); setLoading(false); return }
      const r = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',email,name,password,role:'admin'})})
      const d = await r.json()
      if(!d.ok) { setError(d.error||'Failed'); setLoading(false); return }
      await signIn('credentials',{email,password,redirect:false})
      router.push('/'); return
    }
    if(mode==='accept-invite') {
      if(!name||!password) { setError('Name and password required'); setLoading(false); return }
      const r = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'accept_invite',token:invite,email,name,password})})
      const d = await r.json()
      if(!d.ok) { setError(d.error||'Invalid invite'); setLoading(false); return }
      await signIn('credentials',{email,password,redirect:false})
      router.push('/'); return
    }
    const res = await signIn('credentials',{email,password,redirect:false})
    if(res?.error) { setError('Incorrect email or password'); setLoading(false); return }
    router.push('/')
  }

  const title = mode==='create-admin'?'Create Admin Account':mode==='accept-invite'?'Accept Invitation':'Sign In'

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,-apple-system,sans-serif'}}>
      <div style={{background:'#FFFFFF',borderRadius:12,border:'1px solid #e5e5e5',padding:32,width:380,boxShadow:'0 4px 24px rgba(0,0,0,0.06)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:700,color:'#94A3B8',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>FlashPro Release Planner</div>
          <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'#0F172A'}}>{title}</h1>
          {isFirstUser&&mode==='login'&&<p style={{margin:'6px 0 0',fontSize:12,color:'#2563EB'}}>First time? Create your admin account →</p>}
          {mode==='accept-invite'&&<p style={{margin:'6px 0 0',fontSize:12,color:'#94A3B8'}}>You've been invited to collaborate</p>}
        </div>
        {authMode==='okta'&&(
          <button onClick={()=>signIn('okta',{callbackUrl:'/'})} style={{width:'100%',padding:11,background:'#00297a',border:'none',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:600,color:'#FFFFFF',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:12,boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}>
            <svg width="20" height="20" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#007DC1"/><circle cx="100" cy="100" r="45" fill="white"/></svg>
            Continue with ThoughtWorks SSO (Okta)
          </button>
        )}
        {error&&<div style={{background:'#FEF2F2',border:'1px solid #fda4af',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#DC2626'}}>⚠ {error}</div>}
        {(mode==='create-admin'||mode==='accept-invite')&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e5e5',borderRadius:8,fontSize:13,marginBottom:10,boxSizing:'border-box'as const}}/>}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" type="email" disabled={!!inviteEmail} style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e5e5',borderRadius:8,fontSize:13,marginBottom:10,boxSizing:'border-box'as const,background:inviteEmail?'#F8FAFC':'#FFFFFF'}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" onKeyDown={e=>e.key==='Enter'&&handleSubmit()} style={{width:'100%',padding:'10px 12px',border:'1px solid #e5e5e5',borderRadius:8,fontSize:13,marginBottom:16,boxSizing:'border-box'as const}}/>
        <button onClick={handleSubmit} disabled={loading} style={{width:'100%',padding:11,background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:8,cursor:loading?'default':'pointer',fontSize:13,fontWeight:700,opacity:loading?0.7:1}}>
          {loading?'Please wait…':mode==='create-admin'?'Create Admin Account':mode==='accept-invite'?'Accept & Join':'Sign In'}
        </button>
        <div style={{marginTop:16,textAlign:'center',fontSize:11,color:'#94A3B8'}}><a href="/intro" style={{color:'#2563EB',textDecoration:'none'}}>? Setup guide</a></div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm/></Suspense>
}
