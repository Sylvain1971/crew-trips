'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { COULEURS } from '@/lib/types'
import type { Trip, Membre } from '@/lib/types'

const ICONS: Record<string,string> = {peche:'🎣',ski:'⛷',autre:'🏕'}

export default function JoinScreen({trip,onJoin}:{trip:Trip,onJoin:(m:Membre)=>void}) {
  const [prenom, setPrenom] = useState('')
  const [loading, setLoading] = useState(false)

  async function rejoindre() {
    if (!prenom.trim()) return
    setLoading(true)
    const { data: existing } = await supabase.from('membres')
      .select('*').eq('trip_id',trip.id).ilike('prenom',prenom.trim()).single()
    if (existing) { onJoin(existing); return }
    const couleur = COULEURS[Math.floor(Math.random()*COULEURS.length)]
    const { data, error } = await supabase.from('membres')
      .insert({trip_id:trip.id,prenom:prenom.trim(),couleur})
      .select().single()
    if (!error && data) onJoin(data)
    else { alert('Erreur de connexion.'); setLoading(false) }
  }

  function fmtDate(d?:string) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-CA',{day:'numeric',month:'long'})
  }

  return (
    <main style={{minHeight:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px',background:'var(--bg)'}}>
      <div style={{marginBottom:32,textAlign:'center'}}>
        <div style={{fontSize:52,marginBottom:10}}>{ICONS[trip.type]||'🏕'}</div>
        <h1 style={{fontSize:22,fontWeight:800,letterSpacing:'-.3px'}}>{trip.nom}</h1>
        {trip.destination && <p style={{fontSize:14,color:'var(--text-3)',marginTop:4}}>{trip.destination}</p>}
        {trip.date_debut && (
          <p style={{fontSize:13,color:'var(--text-3)',marginTop:2}}>
            {fmtDate(trip.date_debut)}{trip.date_fin?` → ${fmtDate(trip.date_fin)}`:''}
          </p>
        )}
      </div>
      <div className="card" style={{width:'100%',maxWidth:360,padding:20}}>
        <div className="field">
          <label>Votre prénom</label>
          <input className="input" placeholder="Ex: Sylvain" value={prenom}
            onChange={e=>setPrenom(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&rejoindre()}
            autoFocus
            style={{fontSize:17,textAlign:'center',fontWeight:600}} />
        </div>
        <button className="btn btn-dark" onClick={rejoindre} disabled={loading||!prenom.trim()}>
          {loading ? 'Connexion…' : 'Entrer dans le trip →'}
        </button>
      </div>
      <p style={{fontSize:12,color:'var(--text-3)',marginTop:20,textAlign:'center'}}>
        Pas besoin de mot de passe.<br/>Entrez juste votre prénom.
      </p>
    </main>
  )
}
