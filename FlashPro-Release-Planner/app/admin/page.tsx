'use client'
import { useState, useEffect } from 'react'
import type { User, Role } from '@/lib/users'

const ROLE_COLORS: Record<Role, string> = { admin:'#DC2626', collaborator:'#2563EB', viewer:'#16A34A' }
const ROLE_BG: Record<Role, string> = { admin:'#FEF2F2', collaborator:'#EFF6FF', viewer:'#F0FDF4' }

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Role>('collaborator')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<Role>('collaborator')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState('')
  const [tab, setTab] = useState<'users'|'invite'>('users')

  const load = () => {
    fetch('/api/users').then(r=>r.json()).then(d=>{
      setUsers(d.users||[])
      setInvites(d.invites||[])
    })
  }

  useEffect(()=>{ load() }, [])

  const sendInvite = async () => {
    setMsg(''); setError('')
    if(!inviteEmail.trim()) { setError('Email required'); return }
    const r = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'invite',email:inviteEmail,role:inviteRole,invitedBy:'admin'})})
    const d = await r.json()
    if(!d.ok) { setError(d.error||'Failed'); return }
    setCopiedLink(d.inviteUrl)
    await navigator.clipboard.writeText(d.inviteUrl).catch(()=>{})
    setMsg(`Invite link generated for ${inviteEmail}. Link copied to clipboard.`)
    setInviteEmail('')
    load()
  }

  const createUser = async () => {
    setMsg(''); setError('')
    if(!newUserEmail||!newUserName||!newUserPassword) { setError('All fields required'); return }
    const r = await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',email:newUserEmail,name:newUserName,password:newUserPassword,role:newUserRole})})
    const d = await r.json()
    if(!d.ok) { setError(d.error||'Failed'); return }
    setMsg(`User ${newUserEmail} created as ${newUserRole}`)
    setNewUserEmail(''); setNewUserName(''); setNewUserPassword('')
    load()
  }

  const changeRole = async (email: string, role: Role) => {
    await fetch('/api/users',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,role})})
    load()
  }

  const removeUser = async (email: string) => {
    if(!confirm(`Remove ${email}?`)) return
    await fetch('/api/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})})
    load()
  }

  return (
    <div style={{minHeight:'100vh',background:'#F8FAFC',fontFamily:'system-ui,-apple-system,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#0F172A',padding:'12px 24px',display:'flex',alignItems:'center',gap:16}}>
        <a href="/" style={{color:'#94A3B8',fontSize:12,textDecoration:'none'}}>← Board</a>
        <span style={{color:'#F8FAFC',fontSize:15,fontWeight:700}}>User Management</span>
        <span style={{fontSize:11,color:'#475569',background:'#0F172A',padding:'2px 8px',borderRadius:10}}>{users.length} users</span>
      </div>

      <div style={{maxWidth:860,margin:'32px auto',padding:'0 16px'}}>

        {msg&&<div style={{background:'#F0FDF4',border:'1px solid #86efac',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#16A34A'}}>✓ {msg}</div>}
        {error&&<div style={{background:'#FEF2F2',border:'1px solid #fda4af',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12,color:'#DC2626'}}>⚠ {error}</div>}

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:20,background:'#f1f5f9',borderRadius:8,padding:3,width:'fit-content'}}>
          {['users','invite'].map(t=>(
            <button key={t} onClick={()=>setTab(t as any)} style={{padding:'6px 18px',fontSize:12,fontWeight:tab===t?700:400,background:tab===t?'#2563EB':'transparent',color:tab===t?'#FFFFFF':'#475569',border:'none',borderRadius:6,cursor:'pointer',textTransform:'capitalize'}}>{t==='invite'?'Invite / Add User':'Users'}</button>
          ))}
        </div>

        {/* Users list */}
        {tab==='users'&&(
          <div style={{background:'#FFFFFF',borderRadius:10,border:'1px solid #e5e5e5',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',fontSize:12,fontWeight:600,color:'#475569',textTransform:'uppercase',letterSpacing:1}}>Active Users</div>
            {users.length===0&&<div style={{padding:24,textAlign:'center',color:'#94A3B8',fontSize:13}}>No users yet. Add users via the Invite tab.</div>}
            {users.map(u=>(
              <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:'1px solid #f8fafc'}}>
                <div style={{width:36,height:36,borderRadius:18,background:ROLE_BG[u.role],display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:ROLE_COLORS[u.role]}}>
                  {u.name[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:'#0F172A'}}>{u.name}</div>
                  <div style={{fontSize:11,color:'#94A3B8'}}>{u.email} · {u.provider} · {u.lastSeen?`last seen ${new Date(u.lastSeen).toLocaleDateString()}`:'never signed in'}</div>
                </div>
                <select value={u.role} onChange={e=>changeRole(u.email,e.target.value as Role)}
                  style={{padding:'4px 8px',fontSize:11,fontWeight:700,color:ROLE_COLORS[u.role],background:ROLE_BG[u.role],border:`1px solid ${ROLE_COLORS[u.role]}40`,borderRadius:6,cursor:'pointer'}}>
                  <option value="admin">Admin</option>
                  <option value="collaborator">Collaborator</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={()=>removeUser(u.email)} style={{padding:'4px 10px',fontSize:11,background:'#FEF2F2',color:'#DC2626',border:'1px solid #fda4af',borderRadius:5,cursor:'pointer'}}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {/* Invite / Add User */}
        {tab==='invite'&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {/* Invite by email */}
            <div style={{background:'#FFFFFF',borderRadius:10,border:'1px solid #e5e5e5',padding:20}}>
              <h3 style={{margin:'0 0 4px',fontSize:14,fontWeight:700,color:'#0F172A'}}>Send Invite Link</h3>
              <p style={{margin:'0 0 16px',fontSize:11,color:'#94A3B8'}}>User gets a link to create their account (works with Google/SSO or password login).</p>
              <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email"
                style={{width:'100%',padding:'9px 10px',border:'1px solid #e5e5e5',borderRadius:7,fontSize:13,marginBottom:10,boxSizing:'border-box'as const}}/>
              <select value={inviteRole} onChange={e=>setInviteRole(e.target.value as Role)}
                style={{width:'100%',padding:'9px 10px',border:'1px solid #e5e5e5',borderRadius:7,fontSize:13,marginBottom:12,boxSizing:'border-box'as const}}>
                <option value="collaborator">Collaborator (can edit)</option>
                <option value="viewer">Viewer (read-only)</option>
                <option value="admin">Admin (full access)</option>
              </select>
              <button onClick={sendInvite} style={{width:'100%',padding:10,background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:700}}>Generate Invite Link</button>
              {copiedLink&&<div style={{marginTop:10,padding:8,background:'#F8FAFC',borderRadius:6,fontSize:10,fontFamily:'monospace',wordBreak:'break-all',color:'#475569',border:'1px solid #e5e5e5'}}>{copiedLink}</div>}
            </div>

            {/* Create user directly (password mode) */}
            <div style={{background:'#FFFFFF',borderRadius:10,border:'1px solid #e5e5e5',padding:20}}>
              <h3 style={{margin:'0 0 4px',fontSize:14,fontWeight:700,color:'#0F172A'}}>Add User Directly</h3>
              <p style={{margin:'0 0 16px',fontSize:11,color:'#94A3B8'}}>Create a password-based account immediately (local/password mode).</p>
              <input value={newUserName} onChange={e=>setNewUserName(e.target.value)} placeholder="Full name"
                style={{width:'100%',padding:'9px 10px',border:'1px solid #e5e5e5',borderRadius:7,fontSize:13,marginBottom:10,boxSizing:'border-box'as const}}/>
              <input value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} placeholder="Email" type="email"
                style={{width:'100%',padding:'9px 10px',border:'1px solid #e5e5e5',borderRadius:7,fontSize:13,marginBottom:10,boxSizing:'border-box'as const}}/>
              <input value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} placeholder="Password" type="password"
                style={{width:'100%',padding:'9px 10px',border:'1px solid #e5e5e5',borderRadius:7,fontSize:13,marginBottom:10,boxSizing:'border-box'as const}}/>
              <select value={newUserRole} onChange={e=>setNewUserRole(e.target.value as Role)}
                style={{width:'100%',padding:'9px 10px',border:'1px solid #e5e5e5',borderRadius:7,fontSize:13,marginBottom:12,boxSizing:'border-box'as const}}>
                <option value="collaborator">Collaborator (can edit)</option>
                <option value="viewer">Viewer (read-only)</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={createUser} style={{width:'100%',padding:10,background:'#16A34A',color:'#FFFFFF',border:'none',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:700}}>Create User</button>
            </div>

            {/* Pending invites */}
            {invites.length>0&&(
              <div style={{gridColumn:'1/-1',background:'#FFFFFF',borderRadius:10,border:'1px solid #e5e5e5',overflow:'hidden'}}>
                <div style={{padding:'10px 16px',borderBottom:'1px solid #f1f5f9',fontSize:12,fontWeight:600,color:'#475569'}}>Pending Invites ({invites.length})</div>
                {invites.map((inv,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',borderBottom:'1px solid #f8fafc',fontSize:12}}>
                    <span style={{flex:1,color:'#0F172A'}}>{inv.email}</span>
                    <span style={{color:ROLE_COLORS[inv.role as Role],background:ROLE_BG[inv.role as Role],padding:'1px 8px',borderRadius:10,fontSize:11,fontWeight:600}}>{inv.role}</span>
                    <span style={{color:'#94A3B8'}}>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
