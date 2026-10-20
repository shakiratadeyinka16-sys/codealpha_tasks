'use strict';
/* ==========================================================================
   AUTOMATIC PHOTOS
   Just put image files in the images/ folder, using any file names you like.
   - Photos directly in images/ go in the "Photos" category.
   - Photos inside a subfolder (images/nature/, images/city/ ...) are
     grouped by the folder name, and each folder becomes a filter chip.
   - The title comes from the file name: "forest-mist.jpg" -> "Forest mist".
   The page finds your files by itself when served by Live Server. If you see
   "No photos found", run:  node make-list.js   (it writes photos.js), then refresh.
   ========================================================================== */
const IMG_RE=/\.(jpe?g|png|gif|webp|avif|svg)$/i;

async function listDir(dirUrl,rel,depth){
  const res=await fetch(dirUrl,{headers:{Accept:'text/html'}});
  if(!res.ok)throw new Error('no listing');
  const doc=new DOMParser().parseFromString(await res.text(),'text/html');
  const out=[];
  for(const a of doc.querySelectorAll('a[href]')){
    const u=new URL(a.getAttribute('href'),dirUrl);
    if(u.origin!==dirUrl.origin||!u.pathname.startsWith(dirUrl.pathname)||u.pathname===dirUrl.pathname)continue;
    const name=decodeURIComponent(u.pathname.slice(dirUrl.pathname.length)).replace(/\/$/,'');
    if(!name||name.includes('/'))continue;
    if(IMG_RE.test(name))out.push({rel:rel+name,src:u.pathname});
    else if(depth<2&&(u.pathname.endsWith('/')||!name.includes('.'))){
      const sub=new URL(u.pathname.replace(/\/?$/,'/'),dirUrl);
      out.push(...await listDir(sub,rel+name+'/',depth+1).catch(()=>[]));
    }
  }
  return out;
}
async function discover(){
  let found=[];
  if(Array.isArray(window.PHOTO_LIST)&&window.PHOTO_LIST.length){
    found=window.PHOTO_LIST.map(p=>({rel:p.replace(/^images\//,''),src:encodeURI(p)}));
  }else{
    try{found=await listDir(new URL('images/',location.href),'',0)}catch(e){found=[]}
  }
  const seen=new Set();
  return found.filter(f=>!seen.has(f.rel)&&seen.add(f.rel))
    .sort((a,b)=>a.rel.localeCompare(b.rel,undefined,{numeric:true,sensitivity:'base'}))
    .map(f=>{
      const parts=f.rel.split('/'),file=parts.pop();
      const title=file.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ').trim().replace(/^./,m=>m.toUpperCase());
      return{id:f.src,title,desc:'',cat:parts.length?parts[0].toLowerCase():'photos',tags:title.toLowerCase().split(/\s+/),src:f.src};
    });
}

/* ---------- State ---------- */
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let photos=[];
const favs=new Set(store.get('lumina-favs',[]));
const state={cat:'all',q:'',fav:false,view:store.get('lumina-view','grid')};
let list=[];
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=c=>String(c).replace(/[-_]+/g,' ').replace(/^./,m=>m.toUpperCase());

/* ---------- Render ---------- */
const gallery=$('gallery');
function filtered(){
  const q=state.q.trim().toLowerCase();
  return photos.filter(p=>(state.cat==='all'||p.cat===state.cat)&&(!state.fav||favs.has(p.id))
    &&(!q||(p.title+' '+p.desc+' '+p.tags.join(' ')).toLowerCase().includes(q)));
}
function render(){
  list=filtered();gallery.innerHTML='';
  list.forEach((p,i)=>{
    const c=document.createElement('article');c.className='card';c.style.setProperty('--d',Math.min(i*40,400)+'ms');
    c.innerHTML=`<button class="open" aria-label="Open ${esc(p.title)}"><img src="${esc(p.src)}" alt="${esc(p.title)}" loading="lazy"><div class="cap"><b>${esc(p.title)}</b><span>${esc(p.desc)}</span></div></button>
      <span class="badge">${esc(label(p.cat))}</span>
      <button class="heart" aria-label="Favorite ${esc(p.title)}" aria-pressed="${favs.has(p.id)}">${favs.has(p.id)?'♥':'♡'}</button>`;
    c.querySelector('.open').onclick=()=>openLb(i,c.querySelector('.open'));
    c.querySelector('img').addEventListener('error',e=>{
      const m=document.createElement('div');m.className='missing';m.innerHTML='<span>Add this file:</span><code>'+esc(p.src)+'</code>';
      e.target.replaceWith(m);c.querySelector('.open').disabled=true;c.querySelector('.cap').remove()});
    const h=c.querySelector('.heart');
    h.onclick=()=>{toggleFav(p.id);if(state.fav)render();else syncHeart(h,p.id)};
    gallery.appendChild(c);
  });
  $('empty').textContent=photos.length?'No photos match. Try another search or category.':'No photos found. Put images in the images folder and refresh. If they still do not appear, run: node make-list.js';
  $('empty').hidden=list.length>0;
}
function syncHeart(el,id){const on=favs.has(id);el.setAttribute('aria-pressed',on);el.textContent=on?'♥':'♡'}
function toggleFav(id){favs.has(id)?favs.delete(id):favs.add(id);store.set('lumina-favs',[...favs]);updateCount()}
function updateCount(){$('favCount').textContent=photos.filter(p=>favs.has(p.id)).length}

/* ---------- Controls ---------- */
const chips=$('chips');
function buildChips(cats){
  chips.innerHTML='';
  [['all','All Photos'],...cats.map(c=>[c,label(c)])].forEach(([k,l])=>{
    const b=document.createElement('button');b.className='chip';b.dataset.cat=k;b.textContent=l;b.setAttribute('aria-pressed',k===state.cat);
    b.onclick=()=>{state.cat=k;chips.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===b));render()};
    chips.appendChild(b);
  });
  $('addCat').innerHTML='';
  (cats.length?cats:['photos']).forEach(c=>$('addCat').add(new Option(label(c),c)));
}
$('search').addEventListener('input',e=>{state.q=e.target.value;render()});
$('favBtn').onclick=e=>{state.fav=!state.fav;e.currentTarget.setAttribute('aria-pressed',state.fav);render()};
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{
  state.view=b.dataset.view;store.set('lumina-view',state.view);applyView();
});
function applyView(){
  gallery.className='gallery view-'+state.view;
  document.querySelectorAll('.seg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
}
function applyTheme(t){document.documentElement.dataset.theme=t;$('themeBtn').textContent=t==='dark'?'☾':'☀';store.set('lumina-theme',t)}
$('themeBtn').onclick=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');

/* ---------- Add photos ---------- */
const dlg=$('addDlg'),files=$('files');
$('addBtn').onclick=()=>{$('addForm').reset();$('fileInfo').textContent='';dlg.showModal()};
$('addCancel').onclick=()=>dlg.close();
files.onchange=()=>{$('fileInfo').textContent=files.files.length?files.files.length+' selected':''};
const drop=$('drop');
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,()=>drop.classList.remove('over')));
drop.addEventListener('drop',e=>{e.preventDefault();files.files=e.dataTransfer.files;files.onchange()});
$('addForm').onsubmit=e=>{
  e.preventDefault();
  const imgs=[...files.files].filter(f=>f.type.startsWith('image/'));
  if(!imgs.length){$('fileInfo').textContent='Choose at least one image.';return}
  const tags=$('addTags').value.split(',').map(t=>t.trim()).filter(Boolean),cat=$('addCat').value;
  imgs.forEach((f,i)=>photos.unshift({id:'u'+Date.now()+'-'+i,title:f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '),desc:'Added by you',cat,tags,src:URL.createObjectURL(f)}));
  state.cat='all';state.q='';state.fav=false;$('search').value='';$('favBtn').setAttribute('aria-pressed','false');
  chips.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x.dataset.cat==='all'));
  if(!chips.querySelector('[data-cat="'+cat+'"]'))buildChips([...new Set(photos.map(p=>p.cat))]);
  dlg.close();updateCount();render();
};

/* ---------- Lightbox ---------- */
const lb=$('lb'),lbImg=$('lbImg');let pos=0,opener=null;
function show(p,instant){
  pos=(p+list.length)%list.length;const d=list[pos];
  const apply=()=>{lbImg.src=d.src;lbImg.alt=d.title;$('lbTitle').textContent=d.title;$('lbDesc').textContent=d.desc;
    $('lbMeta').textContent=`${label(d.cat)} · ${pos+1} of ${list.length}`;syncHeart($('lbFav'),d.id);lbImg.classList.remove('swap')};
  if(instant)apply();else{lbImg.classList.add('swap');setTimeout(apply,180)}
}
function openLb(i,t){opener=t;show(i,true);lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('lbClose').focus()}
function closeLb(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.style.overflow='';if(opener&&opener.isConnected)opener.focus();render_hearts()}
function render_hearts(){document.querySelectorAll('.card').forEach((c,i)=>list[i]&&syncHeart(c.querySelector('.heart'),list[i].id));if(state.fav)render()}
$('lbNext').onclick=()=>show(pos+1);$('lbPrev').onclick=()=>show(pos-1);$('lbClose').onclick=closeLb;
$('lbFav').onclick=()=>{toggleFav(list[pos].id);syncHeart($('lbFav'),list[pos].id)};
lb.addEventListener('click',e=>{if(e.target===lb||/stage|info/.test(e.target.className))closeLb()});
document.addEventListener('keydown',e=>{
  if(!lb.classList.contains('open'))return;
  if(e.key==='Escape')closeLb();
  else if(e.key==='ArrowRight')show(pos+1);
  else if(e.key==='ArrowLeft')show(pos-1);
  else if(e.key==='Tab'){const f=[...lb.querySelectorAll('button')],a=document.activeElement;
    if(e.shiftKey&&a===f[0]){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&a===f[f.length-1]){e.preventDefault();f[0].focus()}}
});
let x0=null;
lb.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
lb.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)show(pos+(dx<0?1:-1));x0=null});

/* ---------- Start ---------- */
applyTheme(store.get('lumina-theme',matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));
applyView();updateCount();render();
(async()=>{
  photos=await discover();
  buildChips([...new Set(photos.map(p=>p.cat))]);
  updateCount();render();
})();
