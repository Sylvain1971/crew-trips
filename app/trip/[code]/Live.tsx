'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Message, Membre } from '@/lib/types'

export default function Live({tripId,membre}:{tripId:string,membre:Membre}) {
  const [msgs, setMsgs] = useState<Message[]>([])
  const [txt, setTxt] = useState('')
  const [lb, setLb] = useState<{url:string,cap:string}|null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(()=>{
    supabase.from('messages').select('*').eq('trip_id',tripId)
      .order('created_at',{ascending:true}).limit(200)
      .then(({data})=>{if(data){setMsgs(data);scroll()}})
    const ch = supabase.channel(`live-${tripId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`trip_id=eq.${tripId}`},
        p=>{setMsgs(prev=>[...prev,p.new as Message]);scroll()})
      .subscribe()
    return ()=>{supabase.removeChannel(ch)}
  },[tripId])

  function scroll(){setTimeout(()=>{feedRef.current?.scrollTo({top:feedRef.current.scrollHeight,behavior:'smooth'})},60)}

  async function send() {
    const t=txt.trim();if(!t)return
    setTxt('')
    if(inputRef.current)inputRef.current.style.height='40px'
    await supabase.from('messages').insert({
      trip_id:tripId,type:'text',contenu:t,
      membre_id:membre.id,membre_prenom:membre.prenom,membre_couleur:membre.couleur,
    })
  }

  function onKey(e:React.KeyboardEvent){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}
  function grow(el:HTMLTextAreaElement){el.style.height='40px';el.style.height=Math.min(el.scrollHeight,120)+'px'}

  function ago(ts:string){
    const d=Date.now()-new Date(ts).getTime()
    if(d<60000)return"À l'instant"
    if(d<3600000)return`${Math.floor(d/60000)}min`
    const dt=new Date(ts)
    if(d<86400000)return dt.toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'})
    return dt.toLocaleDateString('fr-CA',{day:'numeric',month:'short'})
  }

  const isMine=(m:Message)=>m.membre_id===membre.id

  return (
    <>
      {lb&&(
        <div className="lb open" onClick={()=>setLb(null)}>
          <button className="lb-close" onClick={()=>setLb(null)}>×</button>
          <img src={lb.url} alt={lb.cap} />
          {lb.cap&&<div className="lb-cap">{lb.cap}</div>}
        </div>
      )}
      <div ref={feedRef} style={{flex:1,overflowY:'auto',padding:'14px 14px 100px',display:'flex',flexDirection:'column',gap:14}}>
        {msgs.length===0&&(
          <div className="empty"><span className="empty-icon">💬</span>Dites bonjour au groupe !</div>
        )}
        {msgs.map(m=>(
          <div key={m.id} style={{display:'flex',gap:8,alignItems:'flex-end',flexDirection:isMine(m)?'row-reverse':'row'}}>
            <div style={{width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,background:`${m.membre_couleur||'#888'}22`,color:m.membre_couleur||'#888'}}>
              {(m.membre_prenom||'?')[0].toUpperCase()}
            </div>
            <div style={{display:'flex',flexDirection:'column',maxWidth:'76%',alignItems:isMine(m)?'flex-end':'flex-start'}}>
              {!isMine(m)&&<div style={{fontSize:10,color:'var(--text-3)',marginBottom:3,paddingLeft:4}}>{m.membre_prenom}</div>}
              {m.type==='photo'&&m.photo_url ? (
                <div style={{borderRadius:14,overflow:'hidden',border:'1px solid var(--border)',maxWidth:220}}>
                  <img src={m.photo_url} alt={m.photo_caption||''} style={{width:'100%',display:'block',cursor:'pointer'}}
                    onClick={()=>setLb({url:m.photo_url!,cap:m.photo_caption||''})} />
                  {m.photo_caption&&<div style={{padding:'7px 10px',fontSize:12,color:'var(--text-2)',background:'#fff'}}>{m.photo_caption}</div>}
                </div>
              ) : (
                <div style={{padding:'9px 13px',fontSize:14,lineHeight:1.55,wordBreak:'break-word',borderRadius:18,
                  background:isMine(m)?'var(--text)':'#fff',color:isMine(m)?'#fff':'var(--text)',
                  border:isMine(m)?'none':'1px solid var(--border)',
                  borderBottomRightRadius:isMine(m)?4:18,borderBottomLeftRadius:isMine(m)?18:4}}>
                  {m.contenu}
                </div>
              )}
              <div style={{fontSize:10,color:'var(--text-3)',marginTop:3,paddingLeft:4,paddingRight:4}}>{ago(m.created_at)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{position:'fixed',bottom:0,left:0,right:0,background:'#fff',borderTop:'1px solid var(--border)',
        padding:`9px 12px calc(env(safe-area-inset-bottom,0px) + 9px)`,display:'flex',gap:8,alignItems:'flex-end',zIndex:30}}>
        <textarea ref={inputRef} style={{flex:1,padding:'9px 13px',border:'1px solid var(--border)',borderRadius:20,fontSize:14,fontFamily:'inherit',resize:'none',height:40,lineHeight:1.4,maxHeight:120,outline:'none'}}
          placeholder="Message…" value={txt}
          onChange={e=>{setTxt(e.target.value);grow(e.target)}}
          onKeyDown={onKey} />
        <button onClick={send} style={{width:38,height:38,borderRadius:'50%',background:txt.trim()?'var(--text)':'var(--border)',color:'#fff',border:'none',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .15s',cursor:'pointer'}}>↑</button>
      </div>
    </>
  )
}
