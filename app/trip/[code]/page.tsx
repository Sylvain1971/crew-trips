'use client'
import { useEffect, useState, useCallback, use } from 'react'
import { supabase } from '@/lib/supabase'
import type { Trip, Membre } from '@/lib/types'
import JoinScreen from './JoinScreen'
import Archive from './Archive'
import Live from './Live'
import Photos from './Photos'

const ICONS:Record<string,string>={peche:'🎣',ski:'⛷',autre:'🏕'}
type Tab='archive'|'live'|'photos'

export default function TripPage({params: paramsPromise}:{params:Promise<{code:string}>}) {
  const params = use(paramsPromise)
  const [trip, setTrip] = useState<Trip|null>(null)
  const [membre, setMembre] = useState<Membre|null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<Tab>('live')

  const load = useCallback(async()=>{
    const {data} = await supabase.from('trips').select('*').eq('code',params.code).single()
    if(!data){setError(true);setLoading(false);return}
    setTrip(data)
    const stored = localStorage.getItem(`crew-${params.code}`)
    if(stored){try{setMembre(JSON.parse(stored))}catch{}}
    setLoading(false)
  },[params.code])

  useEffect(()=>{load()},[load])

  function saveMembre(m:Membre){
    setMembre(m)
    localStorage.setItem(`crew-${params.code}`,JSON.stringify(m))
  }

  if(loading) return <div style={{minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-3)',fontSize:14}}>Chargement…</div>
  if(error||!trip) return (
    <div style={{minHeight:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:24,textAlign:'center'}}>
      <span style={{fontSize:48}}>🔍</span>
      <div style={{fontWeight:700,fontSize:18}}>Trip introuvable</div>
      <div style={{color:'var(--text-3)',fontSize:14}}>Ce lien ne correspond à aucun trip actif.</div>
      <a href="/" style={{marginTop:8,fontSize:14,color:'var(--blue)'}}>← Créer un nouveau trip</a>
    </div>
  )
  if(!membre) return <JoinScreen trip={trip} onJoin={saveMembre} />

  function fmtDate(d?:string){if(!d)return'';return new Date(d).toLocaleDateString('fr-CA',{day:'numeric',month:'long'})}

  const tabBtn=(t:Tab,label:string)=>(
    <button key={t} onClick={()=>setTab(t)} style={{
      padding:'11px 8px',fontSize:13,fontWeight:600,border:'none',background:'none',
      color:tab===t?'var(--text)':'var(--text-3)',
      borderBottom:`3px solid ${tab===t?'var(--text)':'transparent'}`,
      transition:'color .15s',cursor:'pointer',flex:1
    }}>{label}</button>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100dvh'}}>
      <div style={{background:'#fff',borderBottom:'1px solid var(--border)',position:'sticky',top:0,zIndex:50}}>
        <div style={{padding:'10px 16px 8px',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>{ICONS[trip.type]||'🏕'}</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:15,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{trip.nom}</div>
            {(trip.destination||trip.date_debut)&&(
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>
                {trip.destination}{trip.destination&&trip.date_debut?' · ':''}{fmtDate(trip.date_debut)}{trip.date_fin?` → ${fmtDate(trip.date_fin)}`:''}
              </div>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg)',padding:'5px 10px',borderRadius:20,flexShrink:0}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:membre.couleur}} />
            <span style={{fontSize:12,fontWeight:600,color:'var(--text-2)'}}>{membre.prenom}</span>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',borderTop:'1px solid var(--border-light)'}}>
          {tabBtn('archive','📂 Archive')}
          {tabBtn('live','💬 Live')}
          {tabBtn('photos','📷 Photos')}
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:tab==='live'?'hidden':'auto'}}>
        {tab==='archive'&&<Archive tripId={trip.id} membre={membre} />}
        {tab==='live'&&<Live tripId={trip.id} membre={membre} />}
        {tab==='photos'&&<Photos tripId={trip.id} membre={membre} />}
      </div>
    </div>
  )
}
