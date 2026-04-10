'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CAT_ICONS, CAT_LABELS } from '@/lib/types'
import type { ArchiveItem, Membre } from '@/lib/types'

const CATS = ['avion','lodge','note','equip','autre']

export default function Archive({tripId,membre}:{tripId:string,membre:Membre}) {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [tab, setTab] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const [cat, setCat] = useState('avion')
  const [titre, setTitre] = useState('')
  const [details, setDetails] = useState('')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    supabase.from('archive').select('*').eq('trip_id',tripId)
      .order('created_at',{ascending:false})
      .then(({data})=>data&&setItems(data))
  },[tripId])

  const filtered = tab==='all' ? items : items.filter(i=>i.categorie===tab)

  async function save() {
    if (!titre.trim()) return
    setSaving(true)
    const {data,error} = await supabase.from('archive').insert({
      trip_id:tripId,categorie:cat,titre:titre.trim(),
      details:details.trim()||null,url:url.trim()||null,
      membre_prenom:membre.prenom,
    }).select().single()
    if (!error&&data) {
      setItems(p=>[data,...p])
      setTitre('');setDetails('');setUrl('')
      setOpen(false)
    }
    setSaving(false)
  }

  async function remove(id:string) {
    await supabase.from('archive').delete().eq('id',id)
    setItems(p=>p.filter(i=>i.id!==id))
  }

  function ago(ts:string) {
    const d=Date.now()-new Date(ts).getTime()
    if(d<3600000) return `${Math.floor(d/60000)}min`
    if(d<86400000) return `${Math.floor(d/3600000)}h`
    return new Date(ts).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})
  }

  const tabStyle = (t:string) => ({
    padding:'10px 13px',fontSize:13,fontWeight:600,border:'none',background:'none',
    color:tab===t?'var(--text)':'var(--text-3)',cursor:'pointer',whiteSpace:'nowrap' as const,
    borderBottom:`3px solid ${tab===t?'var(--text)':'transparent'}`,flexShrink:0
  })

  return (
    <>
      <div style={{display:'flex',background:'#fff',borderBottom:'1px solid var(--border)',overflowX:'auto',padding:'0 10px',gap:2,position:'sticky',top:104,zIndex:30}}>
        <button style={tabStyle('all')} onClick={()=>setTab('all')}>Tout</button>
        {CATS.map(c=>(
          <button key={c} style={tabStyle(c)} onClick={()=>setTab(c)}>
            {CAT_ICONS[c]} {CAT_LABELS[c]}
          </button>
        ))}
      </div>
      <div style={{padding:'14px 14px 100px'}}>
        {filtered.length===0 ? (
          <div className="empty">
            <span className="empty-icon">{tab==='all'?'📂':CAT_ICONS[tab]}</span>
            {tab==='all'?'Aucun élément archivé.':'Aucun élément ici.'}<br/>
            Appuyez sur <strong>+</strong> pour ajouter.
          </div>
        ) : (
          <div className="card">
            {filtered.map(item=>(
              <div key={item.id} style={{display:'flex',gap:12,padding:'13px 14px',borderBottom:'1px solid var(--border-light)'}}>
                <div style={{width:40,height:40,borderRadius:10,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
                  {CAT_ICONS[item.categorie]}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14}}>{item.titre}</div>
                  {item.details&&<div style={{fontSize:13,color:'var(--text-2)',marginTop:3,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{item.details}</div>}
                  {item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{fontSize:12,color:'var(--blue)',display:'inline-block',marginTop:5}}>🔗 Ouvrir ↗</a>}
                  <div style={{fontSize:11,color:'var(--text-3)',marginTop:6}}>{item.membre_prenom} · {ago(item.created_at)}</div>
                </div>
                <button onClick={()=>remove(item.id)} style={{background:'none',border:'none',fontSize:20,color:'#ddd',cursor:'pointer'}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="fab" onClick={()=>setOpen(true)}>+</button>
      <div className={`overlay ${open?'open':''}`} onClick={()=>setOpen(false)} />
      <div className={`sheet ${open?'open':''}`}>
        <div className="sheet-handle" />
        <div className="sheet-title">Ajouter un élément</div>
        <div className="field"><label>Catégorie</label>
          <select className="input" value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="avion">✈ Billet / Vol</option>
            <option value="lodge">🏠 Lodge / Hébergement</option>
            <option value="note">📝 Pense-bête / Note</option>
            <option value="equip">🎒 Liste d'équipement</option>
            <option value="autre">📎 Autre document</option>
          </select>
        </div>
        <div className="field"><label>Titre</label>
          <input className="input" placeholder="Ex: Vol YQB → YVR, Confirmation lodge…" value={titre} onChange={e=>setTitre(e.target.value)} />
        </div>
        <div className="field"><label>Détails</label>
          <textarea className="input" placeholder="Numéro de vol, horaire, liste, adresse…" value={details} onChange={e=>setDetails(e.target.value)} rows={3} />
        </div>
        <div className="field"><label>Lien (optionnel)</label>
          <input className="input" type="url" placeholder="https://…" value={url} onChange={e=>setUrl(e.target.value)} />
        </div>
        <button className="btn btn-dark" onClick={save} disabled={saving||!titre.trim()}>{saving?'Ajout…':'Ajouter'}</button>
        <button className="btn btn-ghost" style={{marginTop:8}} onClick={()=>setOpen(false)}>Annuler</button>
      </div>
    </>
  )
}
