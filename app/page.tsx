'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function genCode() {
  const c = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join('')
}

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nom, setNom] = useState('')
  const [type, setType] = useState('peche')
  const [dest, setDest] = useState('')
  const [d1, setD1] = useState('')
  const [d2, setD2] = useState('')

  async function creer() {
    if (!nom.trim()) return
    setLoading(true)
    const code = genCode()
    const { error } = await supabase.from('trips').insert({
      code, nom: nom.trim(), type,
      destination: dest.trim()||null,
      date_debut: d1||null, date_fin: d2||null,
    })
    if (!error) router.push(`/trip/${code}`)
    else { alert('Erreur: '+error.message); setLoading(false) }
  }

  return (
    <main style={{minHeight:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'var(--bg)'}}>
      <div style={{marginBottom:32,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:8}}>🏕</div>
        <h1 style={{fontSize:26,fontWeight:800,letterSpacing:'-.5px'}}>Crew Trips</h1>
        <p style={{fontSize:14,color:'var(--text-3)',marginTop:6}}>Créez un trip — partagez le lien — c'est tout.</p>
      </div>
      <div className="card" style={{width:'100%',maxWidth:420,padding:20}}>
        <div className="field">
          <label>Nom du trip</label>
          <input className="input" placeholder="Ex: Babine River — oct. 2025" value={nom} onChange={e=>setNom(e.target.value)} />
        </div>
        <div className="field">
          <label>Activité</label>
          <select className="input" value={type} onChange={e=>setType(e.target.value)}>
            <option value="peche">🎣 Pêche à la mouche</option>
            <option value="ski">⛷ Ski</option>
            <option value="autre">🏕 Autre</option>
          </select>
        </div>
        <div className="field">
          <label>Destination</label>
          <input className="input" placeholder="Ex: Rivière Babine, Whistler…" value={dest} onChange={e=>setDest(e.target.value)} />
        </div>
        <div className="field">
          <label>Dates</label>
          <div style={{display:'flex',gap:8}}>
            <input className="input" type="date" value={d1} onChange={e=>setD1(e.target.value)} style={{flex:1}} />
            <input className="input" type="date" value={d2} onChange={e=>setD2(e.target.value)} style={{flex:1}} />
          </div>
        </div>
        <button className="btn btn-dark" onClick={creer} disabled={loading||!nom.trim()}>
          {loading ? 'Création…' : 'Créer le trip →'}
        </button>
      </div>
      <p style={{fontSize:12,color:'var(--text-3)',marginTop:20,textAlign:'center',lineHeight:1.6}}>
        Un lien unique sera généré.<br/>Partagez-le dans votre groupe Messenger.
      </p>
    </main>
  )
}
