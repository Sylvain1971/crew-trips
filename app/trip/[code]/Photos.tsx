'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { compressPhoto, formatBytes, storagePct, LIMITE_BYTES } from '@/lib/compress'
import type { Photo, Membre } from '@/lib/types'

export default function Photos({tripId,membre}:{tripId:string,membre:Membre}) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [usedBytes, setUsedBytes] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lb, setLb] = useState<Photo|null>(null)
  const [caption, setCaption] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pending, setPending] = useState<File|null>(null)
  const [preview, setPreview] = useState<string|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    supabase.from('photos').select('*').eq('trip_id',tripId)
      .order('created_at',{ascending:false}).then(({data})=>data&&setPhotos(data))
    supabase.from('trip_storage_usage').select('total_bytes').eq('trip_id',tripId).single()
      .then(({data})=>data&&setUsedBytes(data.total_bytes||0))
  },[tripId])

  function onFile(e:React.ChangeEvent<HTMLInputElement>) {
    const f=e.target.files?.[0];if(!f)return
    setPending(f);setPreview(URL.createObjectURL(f));setCaption('');setSheetOpen(true)
  }

  async function upload() {
    if(!pending)return
    if(usedBytes>=LIMITE_BYTES){alert('Limite 1 GB atteinte.');return}
    setUploading(true);setProgress(15)
    try {
      const comp = await compressPhoto(pending);setProgress(45)
      const ext = comp.name.split('.').pop()||'jpg'
      const path = `${tripId}/${Date.now()}-${membre.prenom.toLowerCase().replace(/\s/g,'')}.${ext}`
      const {error:upErr} = await supabase.storage.from('trip-photos').upload(path,comp)
      if(upErr)throw upErr
      setProgress(80)
      const {data:{publicUrl}} = supabase.storage.from('trip-photos').getPublicUrl(path)
      const {data:photo} = await supabase.from('photos').insert({
        trip_id:tripId,storage_path:path,url:publicUrl,
        caption:caption.trim()||null,taille_bytes:comp.size,
        membre_id:membre.id,membre_prenom:membre.prenom,
      }).select().single()
      if(photo){
        setPhotos(p=>[photo,...p])
        setUsedBytes(b=>b+comp.size)
        await supabase.from('messages').insert({
          trip_id:tripId,type:'photo',photo_url:publicUrl,
          photo_caption:caption.trim()||null,
          membre_id:membre.id,membre_prenom:membre.prenom,membre_couleur:membre.couleur,
        })
      }
      setProgress(100);setSheetOpen(false);setPending(null);setPreview(null);setCaption('')
    } catch(e:any){alert('Erreur upload: '+(e.message||e))}
    finally{setUploading(false);setProgress(0);if(fileRef.current)fileRef.current.value=''}
  }

  async function delPhoto(p:Photo) {
    if(!confirm('Supprimer ?'))return
    await supabase.storage.from('trip-photos').remove([p.storage_path])
    await supabase.from('photos').delete().eq('id',p.id)
    setPhotos(prev=>prev.filter(x=>x.id!==p.id))
    setUsedBytes(b=>b-(p.taille_bytes||0))
    setLb(null)
  }

  function ago(ts:string){const d=Date.now()-new Date(ts).getTime();if(d<3600000)return`${Math.floor(d/60000)}min`;if(d<86400000)return`${Math.floor(d/3600000)}h`;return new Date(ts).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})}
  const pct = storagePct(usedBytes,LIMITE_BYTES)

  return (
    <>
      {lb&&(
        <div className="lb open" onClick={()=>setLb(null)}>
          <button className="lb-close" onClick={()=>setLb(null)}>×</button>
          <img src={lb.url} alt={lb.caption||''} onClick={e=>e.stopPropagation()} />
          {lb.caption&&<div className="lb-cap">{lb.caption}</div>}
          <div style={{marginTop:10,display:'flex',gap:8}}>
            <a href={lb.url} download target="_blank" rel="noreferrer"
              style={{color:'#fff',fontSize:12,padding:'6px 14px',background:'rgba(255,255,255,.15)',borderRadius:20,textDecoration:'none'}}>
              ⬇ Télécharger
            </a>
            {lb.membre_id===membre.id&&(
              <button onClick={()=>delPhoto(lb)} style={{color:'#fff',fontSize:12,padding:'6px 14px',background:'rgba(255,80,80,.25)',border:'none',borderRadius:20,cursor:'pointer'}}>
                🗑 Supprimer
              </button>
            )}
          </div>
          <div style={{color:'#666',fontSize:11,marginTop:8}}>{lb.membre_prenom} · {ago(lb.created_at)}{lb.taille_bytes?` · ${formatBytes(lb.taille_bytes)}`:''}</div>
        </div>
      )}
      <div style={{padding:'14px 14px 100px'}}>
        <div style={{background:'#fff',borderRadius:12,padding:'12px 14px',marginBottom:14,border:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)',marginBottom:7}}>
            <span>{photos.length} photo{photos.length!==1?'s':''}</span>
            <span>{formatBytes(usedBytes)} / 1 GB</span>
          </div>
          <div style={{height:4,background:'var(--bg)',borderRadius:2,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:pct>90?'#e24b4a':pct>70?'#ba7517':'#1D9E75',borderRadius:2,transition:'width .4s'}} />
          </div>
        </div>
        {photos.length===0 ? (
          <div className="empty"><span className="empty-icon">📷</span>Aucune photo encore.<br/>Appuyez sur 📷 pour partager !</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3,borderRadius:12,overflow:'hidden'}}>
            {photos.map(p=>(
              <div key={p.id} onClick={()=>setLb(p)} style={{aspectRatio:'1',overflow:'hidden',cursor:'pointer',background:'var(--bg)'}}>
                <img src={p.url} alt={p.caption||''} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
                  onError={e=>(e.currentTarget.style.display='none')} />
              </div>
            ))}
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFile} />
      <button className="fab" onClick={()=>fileRef.current?.click()}>📷</button>
      <div className={`overlay ${sheetOpen?'open':''}`} onClick={()=>{if(!uploading){setSheetOpen(false);setPending(null);setPreview(null)}}} />
      <div className={`sheet ${sheetOpen?'open':''}`}>
        <div className="sheet-handle" />
        <div className="sheet-title">Partager cette photo</div>
        {preview&&<img src={preview} alt="" style={{width:'100%',borderRadius:12,marginBottom:14,maxHeight:240,objectFit:'cover'}} />}
        <div className="field"><label>Légende (optionnel)</label>
          <input className="input" placeholder="Ex: Babine matin — 3 steelheads !" value={caption} onChange={e=>setCaption(e.target.value)} disabled={uploading} />
        </div>
        {uploading&&(
          <div style={{marginBottom:14}}>
            <div style={{height:4,background:'var(--bg)',borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${progress}%`,background:'var(--text)',borderRadius:2,transition:'width .3s'}} />
            </div>
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',marginTop:6}}>Compression et envoi…</div>
          </div>
        )}
        <button className="btn btn-dark" onClick={upload} disabled={uploading||!pending}>
          {uploading?`Envoi… ${progress}%`:'📤 Partager'}
        </button>
        {!uploading&&<button className="btn btn-ghost" style={{marginTop:8}} onClick={()=>{setSheetOpen(false);setPending(null);setPreview(null)}}>Annuler</button>}
      </div>
    </>
  )
}
