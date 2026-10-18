/* Social 63 v1.1.0 • Self-hosted social workspace. No third-party UI dependencies. */
(() => {
'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const a = e;
const fmt = (n, digits=0) => new Intl.NumberFormat('en-GB',{maximumFractionDigits:digits}).format(Number(n)||0);
const compact = n => new Intl.NumberFormat('en-GB',{notation:'compact',maximumFractionDigits:1}).format(Number(n)||0);
const currency = n => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number(n)||0);
const parse = d => d ? new Date(d) : null;
const dateText = (d,opts={day:'numeric',month:'short',year:'numeric'}) => { const x=parse(d);return x && !isNaN(x)?new Intl.DateTimeFormat('en-GB',opts).format(x):'—'; };
const dateOnly = d => {const y=d instanceof Date?d:new Date(d);return y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');};
const timeText = d => dateText(d,{hour:'2-digit',minute:'2-digit'});
const relative = d => {const ms=Date.now()-new Date(d).getTime(); if(!Number.isFinite(ms))return '—';const min=Math.round(ms/60000);if(min<2)return 'just now';if(min<60)return min+'m ago';if(min<1440)return Math.floor(min/60)+'h ago';if(min<10080)return Math.floor(min/1440)+'d ago';return dateText(d,{day:'numeric',month:'short'});};
const first = s => String(s||'').trim().split(/\s+/)[0] || 'there';
const initials = s => String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const slug = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
const escText = s => e(s).replace(/\n/g,'<br>');
const platformList=['Instagram','Facebook','TikTok','YouTube','LinkedIn','X','Google','Tripadvisor','Yelp','Pinterest','Threads'];
const postPlatforms=['Instagram','Facebook','X','LinkedIn','TikTok','YouTube','Pinterest','Threads'];
const state={data:null,user:null,csrf:'',view:'dashboard',search:'',filter:'',tab:'all',range:7,weekOffset:0,selectedDate:dateOnly(new Date()),calendarShift:0,lock:false,hcaptcha:{enabled:false,site_key:'',secret_configured:false}};
const PATHS={
 dashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
 star:'<path d="m12 2 3 6.3 7 .9-5 4.9 1.2 6.9L12 17.6 5.8 21l1.2-6.9-5-4.9 7-.9Z"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
 channels:'<rect x="3" y="3" width="12" height="12" rx="2"/><path d="M9 19h11V9M9 9h2M19 15h-4v4"/>',
 campaigns:'<path d="m3 11 18-8-6 18-3.5-7L3 11Z"/><path d="m11.5 14 4-4"/>',
 analytics:'<path d="M3 3v18h18M8 17v-6M13 17V7M18 17v-9"/>',
 team:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.9 1.9-.1-.1a1.7 1.7 0 0 0-1.9-.3l-1 .4-.3 2.1h-2.8l-.3-2.1-1-.4a1.7 1.7 0 0 0-1.9.3l-.1.1-1.9-1.9.1-.1A1.7 1.7 0 0 0 7 15l-.4-1-2.1-.3v-2.8l2.1-.3.4-1a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.9-1.9.1.1a1.7 1.7 0 0 0 1.9.3l1-.4.3-2.1h2.8l.3 2.1 1 .4a1.7 1.7 0 0 0 1.9-.3l.1-.1 1.9 1.9-.1.1A1.7 1.7 0 0 0 19.4 9l.4 1 2.1.3v2.8l-2.1.3Z" transform="translate(-1 0) scale(1 1)"/>',
 reviews:'<path d="m12 2 3 6.3 7 .9-5 4.9 1.2 6.9L12 17.6 5.8 21l1.2-6.9-5-4.9 7-.9Z"/>',
 inbox:'<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8 8 0 0 1-4.1-1.1L3 21l1.8-5A8.5 8.5 0 1 1 21 11.5Z"/>',
 videos:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3Z"/>',
 media:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m21 15-5-5-9 11"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 heart:'<path d="M20.8 4.6a5.6 5.6 0 0 0-7.9 0L12 5.5l-.9-.9a5.6 5.6 0 0 0-7.9 7.9L12 21l8.8-8.5a5.6 5.6 0 0 0 0-7.9Z"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1.3 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
 trending:'<path d="m3 17 7-7 4 4 7-7M15 7h6v6"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 chevron:'<path d="m9 18 6-6-6-6"/>',
 more:'<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
 edit:'<path d="m16 4 4 4-11 11-5 1 1-5Z"/><path d="m14 6 4 4"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
 download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-2 2M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21l2-2"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 shield:'<path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5Z"/><path d="m9 12 2 2 4-4"/>',
 moon:'<path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 play:'<path d="m8 5 11 7-11 7Z"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M3 16v5h18v-5"/>',
 refresh:'<path d="M20 11a8 8 0 0 0-14-5L3 9m0-6v6h6M4 13a8 8 0 0 0 14 5l3-3m0 6v-6h-6"/>',
 chart:'<path d="M3 20V4M3 20h18M7 16l4-5 3 2 6-8"/>',
 arrowleft:'<path d="M19 12H5m7-7-7 7 7 7"/>',
 arrowright:'<path d="M5 12h14m-7-7 7 7-7 7"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 5-6 13 0 18M12 3c6 5 6 13 0 18"/>',
 spark:'<path d="M12 2 9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5Z"/>',
 filter:'<path d="M4 5h16l-6 7v7l-4 2v-9Z"/>',
 sort:'<path d="m7 16-4 4-3-4M3 20V4m11 0 4-3 4 3M18 1v19"/>',
 send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
 alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>'
};
const icon=(name,c='')=>`<svg class="icon ${c}" viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]||PATHS.info}</svg>`;
const platform=(name,sz='')=>{const n=String(name||'Other');const symbols={Instagram:'◎',Facebook:'f',TikTok:'♪',YouTube:'▶',LinkedIn:'in',X:'𝕏',Google:'G',Tripadvisor:'◉',Yelp:'✱',Pinterest:'P',Threads:'@',Other:'•'};return `<span class="platform-icon ${slug(n)} ${sz}" title="${a(n)}" aria-label="${a(n)}">${e(symbols[n]||'•')}</span>`;};
const pill=(s)=>{const tones={positive:'green',replied:'green',active:'green',published:'green',youtube_api:'green',scheduled:'green',manual:'gray',demo:'orange',negative:'red',failed:'red',neutral:'orange',pending:'orange',draft:'gray',paused:'orange',unread:'blue',read:'gray',completed:'blue',owner:'green',editor:'blue',viewer:'gray'};const label={youtube_api:'API synced',scheduled:'Planned',demo:'Demo',manual:'Manual'};return `<span class="pill ${tones[s]||'gray'}">${e(label[s]||s||'—')}</span>`;};
const avatar=(name,n=0)=>`<span class="avatar a${n%5}">${e(initials(name))}</span>`;
const demoMark=r=>r.source==='demo'?'<span class="pill orange">Demo</span>':'';
const sortDesc = (arr,key='created_at')=>[...arr].sort((a,b)=>String(b[key]||'').localeCompare(String(a[key]||'')));
const getData = k => state.data?.[k]||[];
const canEdit = ()=>state.user?.role!=='viewer';
const isOwner = ()=>state.user?.role==='owner';
const linkButton=(text,action)=>`<button class="panel-link" data-nav="${action}">${e(text)}</button>`;
const b=(label,action,cls='btn',extra='')=>`<button class="${cls}" data-act="${action}" ${extra}>${label}</button>`;
const exportBtn=(type)=>`<a class="btn" href="api.php?action=export&amp;type=${a(type)}">${icon('download')} Export CSV</a>`;
const section=(title,desc,actions='')=>`<header class="page-header"><div><h1>${e(title)}</h1><p>${e(desc)}</p></div>${actions?`<div class="page-actions">${actions}</div>`:''}</header>`;
const subhead=(title,desc,actions='')=>`<div class="section-heading"><div><h2>${e(title)}</h2>${desc?`<p>${e(desc)}</p>`:''}</div><div class="section-actions">${actions}</div></div>`;
const empty=(ico,title,desc,button='')=>`<div class="empty-state"><div class="empty-icon">${icon(ico)}</div><h3>${e(title)}</h3><p>${e(desc)}</p>${button}</div>`;
const formatInputDate = iso => { if(!iso)return '';const d=new Date(iso);if(!Number.isFinite(d.getTime()))return '';const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,16);};
const navMain=[['dashboard','Dashboard','dashboard'],['reviews','Reviews','star'],['planner','Content Planner','calendar'],['inbox','Unified Inbox','inbox'],['videos','Video Analytics','videos'],['channels','Channels','channels'],['campaigns','Campaigns','campaigns'],['analytics','Analytics','analytics']];
const navTools=[['media','Media Library','media'],['team','Team','team'],['settings','Settings','settings']];
const views = new Set([...navMain,...navTools].map(x=>x[0]).concat('search'));
async function api(action,body,upload=false){
 const opts={credentials:'same-origin',cache:'no-store'};
 if(body!==undefined){opts.method='POST';opts.headers={'X-CSRF-Token':state.csrf};if(upload)opts.body=body;else{opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}}
 let res;try { res=await fetch('api.php?action='+encodeURIComponent(action),opts); }catch { throw Error('Network unavailable. Check your connection.'); }
 const response=await res.json().catch(()=>null);
 if(!response)throw Error('Unexpected server response. Check PHP logs or hosting configuration.');
 if(!res.ok||!response.ok){if(res.status===401&&action!=='login')showLogin();throw Error(response.error||'Request failed.');}
 return response;
}
async function refresh(){const res=await api('bootstrap');state.data=res.data;state.user=res.user;state.csrf=res.csrf;state.youtubeEnabled=res.youtube_enabled;state.uploadLimit=res.upload_limit_mb;state.hcaptcha=res.hcaptcha||{enabled:false,site_key:'',secret_configured:false};render();}
function theme(t){document.body.classList.toggle('theme-dark',t==='dark');try{localStorage.setItem('social63-theme',t);}catch{}}
try{theme(localStorage.getItem('social63-theme')==='dark'?'dark':'light');}catch{}
function toast(message,error=false){const wrap=$('#toastContainer');const node=document.createElement('div');node.className='toast'+(error?' error':'');node.innerHTML=icon(error?'alert':'checkcircle')+'<span>'+e(message)+'</span>';wrap.append(node);setTimeout(()=>node.remove(),4800);}
let captchaWidget=null,captchaKey='',captchaScriptPromise=null;
function loadCaptchaScript(){
 if(window.hcaptcha)return Promise.resolve(window.hcaptcha);
 if(captchaScriptPromise)return captchaScriptPromise;
 captchaScriptPromise=new Promise((resolve,reject)=>{
  const s=document.createElement('script');s.src='https://js.hcaptcha.com/1/api.js?render=explicit';s.async=true;
  s.onload=()=>window.hcaptcha?resolve(window.hcaptcha):reject(Error('hCaptcha script unavailable.'));
  s.onerror=()=>reject(Error('hCaptcha could not be loaded.'));
  document.head.append(s);
 }).catch(err=>{captchaScriptPromise=null;throw err;});
 return captchaScriptPromise;
}
async function prepareLoginCaptcha(){
 const cfg=state.hcaptcha||{},wrap=$('#loginCaptcha'),status=$('#captchaStatus');
 wrap.hidden=!cfg.enabled;
 if(!cfg.enabled)return;
 status.textContent='Loading security verification…';
 if(!cfg.site_key){status.textContent='hCaptcha is not configured. Ask the workspace owner to update its settings.';return;}
 try{
  const hc=await loadCaptchaScript();
  if($('#loginView').hidden||!state.hcaptcha?.enabled)return;
  if(captchaWidget!==null && captchaKey!==state.hcaptcha.site_key){hc.remove(captchaWidget);captchaWidget=null;$('#hcaptchaMount').replaceChildren();}
  if(captchaWidget===null){captchaWidget=hc.render('hcaptchaMount',{sitekey:state.hcaptcha.site_key,theme:'light',size:'normal'});captchaKey=state.hcaptcha.site_key;}
  status.textContent='Complete the verification to continue.';
 }catch{status.textContent='Could not load hCaptcha. Check your connection or reload this page.';}
}
function resetLoginCaptcha(){try{if(captchaWidget!==null&&window.hcaptcha)window.hcaptcha.reset(captchaWidget);}catch{}}
function showLogin(){state.data=null;$('#loading').hidden=true;$('#appView').hidden=true;$('#loginView').hidden=false;void prepareLoginCaptcha();$('#loginEmail').focus();}
function showApp(){$('#loading').hidden=true;$('#loginView').hidden=true;$('#appView').hidden=false;$('#year').textContent=new Date().getFullYear();}
function updateChrome(){
 $('#workspaceName').textContent=state.data.workspace?.name||'My Workspace';
 $('#workspaceAvatar').textContent=initials(state.data.workspace?.name)[0]||'S';
 $('#userAvatar').textContent=initials(state.user.name);
 $('#userName').textContent=state.user.name;
 $('#userRole').textContent=state.user.role.charAt(0).toUpperCase()+state.user.role.slice(1);
 $('#demoChip').hidden=!state.data.demo;
 $('#mainNav').innerHTML=navMain.map(([id,title,ico])=>`<button type="button" class="nav-item ${state.view===id?'active':''}" data-nav="${id}" ${state.view===id?'aria-current="page"':''}>${icon(ico)}<span class="nav-label">${title}</span>${id==='reviews' && pendingReviews()?`<span class="nav-badge">${pendingReviews()}</span>`:''}${id==='inbox' && inboxUnread()?`<span class="nav-badge">${inboxUnread()}</span>`:''}</button>`).join('');
 $('#toolsNav').innerHTML=navTools.map(([id,title,ico])=>`<button type="button" class="nav-item ${state.view===id?'active':''}" data-nav="${id}" ${state.view===id?'aria-current="page"':''}>${icon(ico)}<span class="nav-label">${title}</span></button>`).join('');
 $('#bellIcon').innerHTML=icon('inbox');
 $('.notification-dot').style.display=getData('activity').length?'block':'none';
}
const pendingReviews=()=>getData('reviews').filter(r=>r.status!=='replied').length;
const inboxUnread=()=>getData('inbox').filter(r=>r.status==='unread').length;
function banner(){return state.data?.demo?`<div class="demo-banner">${icon('info')}<span><strong>Demo workspace:</strong> Sample posts, profiles, reviews and statistics are illustrative — not connected to real accounts.</span><a href="#settings" data-nav="settings">Manage sample data →</a></div>`:'';}
function render(){if(!state.data)return;showApp();updateChrome();renderMain();}
function renderMain(){if(!state.data)return;const m={dashboard:renderDashboard,reviews:renderReviews,planner:renderPlanner,inbox:renderInbox,videos:renderVideos,channels:renderChannels,campaigns:renderCampaigns,analytics:renderAnalytics,media:renderMedia,team:renderTeam,settings:renderSettings,search:renderSearch};const page=(m[state.view]||m.dashboard)();$('#mainContent').innerHTML=banner()+page;}
function route(to){if(!views.has(to))to='dashboard';state.view=to;state.filter='';state.tab='all';state.calendarShift=0;$('#globalSearch').value='';state.search='';state.weekOffset=0;$('#accountPopover').hidden=true;$('#notificationPopover').hidden=true;closeSidebar();if(location.hash!=='#'+to)history.replaceState(null,'','#'+to);updateChrome();renderMain();window.scrollTo({top:0,behavior:'instant'});}
const sliceMetrics=()=>getData('metrics').filter(x=>x.date>=dateOnly(new Date(Date.now()-(state.range-1)*86400000))).sort((x,y)=>x.date.localeCompare(y.date));
const sum=(arr,key)=>arr.reduce((s,x)=>s+(Number(x[key])||0),0);
function spark(values,color='#1268ff',filled=false){let v=values.map(Number);const max=Math.max(1,...v),min=Math.min(0,...v),w=65,h=26;const pts=v.map((x,i)=>[(i/(v.length-1||1))*w,h-(x-min)/(max-min||1)*(h-2)-1]);return `<svg class="spark" viewBox="0 0 65 28" aria-hidden="true">${filled?`<polygon points="0,28 ${pts.map(pt=>pt.join(',')).join(' ')} 65,28" fill="${color}" opacity=".16"/>`:''}<polyline points="${pts.map(pt=>pt.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function statCard(title,value,ico,tone,delta,values,color){return `<div class="metric-card"><div class="metric-icon ${tone}">${icon(ico)}</div><div class="metric-body"><div class="metric-title">${title}</div><div class="metric-value">${value}</div><span class="metric-change">${delta}</span></div>${spark(values,color||'#1268ff',true)}</div>`;}
function dashboardMetrics(){const arr=sliceMetrics(),revs=getData('reviews'),positive=revs.filter(x=>x.sentiment==='positive').length;const rate=sum(arr,'reach')>0?sum(arr,'engagement')/sum(arr,'reach')*100:0;const score=revs.length?Math.round((positive+revs.filter(x=>x.sentiment==='neutral').length*.5)/revs.length*100):0;const follow=sum(arr,'followers');return {arr,revs,positive,score,follow,rate,reach:sum(arr,'reach'),views:sum(arr,'views')};}
function renderDashboard(){const st=dashboardMetrics();const today=new Date();const hour=today.getHours();const greet=hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';const period=`<select class="soft-select" id="periodSelect" aria-label="Dashboard date range"><option value="7" ${state.range===7?'selected':''}>Last 7 days</option><option value="30" ${state.range===30?'selected':''}>Last 30 days</option><option value="90" ${state.range===90?'selected':''}>Last 90 days</option></select>`;
 const reachV=st.arr.map(x=>x.reach).slice(-10);const engV=st.arr.map(x=>x.engagement).slice(-10);const followers=st.arr.map(x=>x.followers).slice(-10);const sentiment=[st.positive,st.revs.filter(r=>r.sentiment==='neutral').length,st.revs.filter(r=>r.sentiment==='negative').length];
 return section(`${greet}, ${first(state.user?.name)} ☀️`,`Here's what's happening in ${state.data.workspace?.name||'your workspace'} today.`,`${period}${canEdit()?`<button class="btn btn-primary" data-act="new-post">${icon('plus')} Create post</button>`:''}`)+
 `<div class="metrics-grid">${statCard('Total Reach',compact(st.reach),'team','',st.reach?'↗ Tracked':'No data',reachV,'#2785ff')}${statCard('Engagement Rate',st.reach?st.rate.toFixed(1)+'%':'—','heart','pink','Interactions / reach',engV,'#306eff')}${statCard('Response Time',state.data.demo?'2h 14m':'—','clock','','Not tracked automatically',reachV.slice(-6),'#21bb88')}${statCard('Sentiment Score',st.revs.length?`${st.score}<span> / 100</span>`:'—','smile','green',`${st.revs.length} review${st.revs.length===1?'':'s'}`,sentiment,'#19c978')}${statCard('Follower Growth',st.follow?(st.follow>0?'+':'')+compact(st.follow):'—','trending','',`Last ${state.range} days`,followers,'#337eff')}</div>`+
 `<div class="panel-grid"><section class="panel"><div class="panel-heading"><h2>${icon('star','star-icon')} Recent Reviews</h2>${linkButton('View all','reviews')}</div><div class="panel-body">${sortDesc(getData('reviews')).slice(0,5).map((r,i)=>smallReview(r,i)).join('')||empty('reviews','No reviews yet','Add a manual review to get started.')}</div></section><section class="panel"><div class="panel-heading"><h2>${icon('calendar')} Content Planner</h2>${linkButton('View planner','planner')}</div>${weekMini()}<div>${plannerMini()}</div></section><section class="panel"><div class="panel-heading"><h2>${icon('inbox')} Unified Inbox</h2>${linkButton('View all','inbox')}</div>${inboxTabs()}<div>${sortDesc(getData('inbox')).filter(inboxMatchesTab).slice(0,5).map((i,n)=>smallInbox(i,n)).join('')||empty('inbox','Inbox is clear','Add a manual message or connect APIs when available.')}</div></section></div>`+
 `<div class="bottom-grid"><section class="panel"><div class="panel-heading"><h2>${icon('analytics')} Engagement Trend</h2><select class="soft-select" data-range-select aria-label="Chart period"><option value="7" ${state.range===7?'selected':''}>Last 7 days</option><option value="30" ${state.range===30?'selected':''}>Last 30 days</option><option value="90" ${state.range===90?'selected':''}>Last 90 days</option></select></div><div class="chart-panel-body">${lineChart(st.arr)}<div class="chart-legend"><span><i class="legend-dot"></i>Reach</span><span><i class="legend-dot green"></i>Engagement</span></div></div></section><section class="panel"><div class="panel-heading"><h2>${icon('smile','green-icon')} Review Sentiment</h2><button class="panel-link" data-nav="reviews">All reviews</button></div>${sentimentDonut()}</section><section class="panel"><div class="panel-heading"><h2>${icon('link')} Your Channels</h2>${linkButton('Manage channels','channels')}</div><div class="channels-mini">${getData('channels').slice(0,6).map(c=>smallChannel(c)).join('')||empty('channels','No channels yet','Add a channel in the Channels screen.')}</div></section></div>`;
}
function smallReview(r,i){const stars='<span class="stars">'+'★'.repeat(r.rating)+'</span><span class="stars star-empty">'+'★'.repeat(5-r.rating)+'</span>';return `<div class="review-row clickable" data-act="open-review" data-id="${a(r.id)}">${avatar(r.author,i)}<div class="review-info"><div class="review-meta"><strong class="truncate">${e(r.author)}</strong>${platform(r.platform)}<span class="review-time">${relative(r.created_at)}</span></div><div class="review-foot">${stars} ${pill(r.sentiment)} <span class="review-state ${r.status==='replied'?'success':'wait'}">${r.status==='replied'?'✓ Replied':'◷ Pending'}</span></div><p class="review-message">${e(r.text)}</p></div></div>`;}
function weekStart(offset=0){const d=new Date();d.setHours(0,0,0,0);const mon=(d.getDay()+6)%7;d.setDate(d.getDate()-mon+offset*7);return d;}
function weekMini(){const start=weekStart(state.weekOffset);return `<div class="week-strip">${Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const iso=dateOnly(d);const count=getData('posts').filter(x=>x.scheduled_at&&dateOnly(x.scheduled_at)===iso).length;return `<button class="day-button ${state.selectedDate===iso?'active':''}" data-act="select-day" data-day="${iso}"><small>${dateText(d,{weekday:'short'})}</small><strong>${d.getDate()}</strong>${count?'<span class="day-dot"></span>':''}</button>`;}).join('')}</div>`;}
function plannerMini(){const items=getData('posts').filter(x=>x.scheduled_at&&dateOnly(x.scheduled_at)===state.selectedDate).sort((a,b)=>a.scheduled_at.localeCompare(b.scheduled_at));if(!items.length)return `<div class="empty-state" style="padding:33px 12px"><p>No posts planned for ${dateText(state.selectedDate+'T12:00:00',{day:'numeric',month:'short'})}.</p>${canEdit()?b(icon('plus')+' Add post','new-post','btn btn-small'):''}</div>`;const emoji=['☕','🥐','📸','💬','✨'];return items.slice(0,5).map((x,i)=>{const media=getData('media').find(y=>y.id===x.media_id&&String(y.mime).startsWith('image/'));return `<div class="planner-row"><span class="post-thumb ${['','menu','team','client','special'][i%5]}">${media?`<img loading="lazy" src="api.php?action=file&amp;id=${encodeURIComponent(media.id)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:7px">`:emoji[i%5]}</span><div class="planner-info"><b>${e(x.title)}</b><small>${timeText(x.scheduled_at)}</small></div>${platform(x.platform)}${pill(x.status)}<button class="tiny-menu" data-act="open-post" data-id="${a(x.id)}" aria-label="Edit post">${icon('more')}</button></div>`;}).join('');}
function inboxTabs(){const msgs=getData('inbox');return `<div class="tabs inbox-tabs">${[['all','All'],['comment','Comments'],['message','Messages'],['mention','Mentions']].map(([k,title])=>`<button class="tab ${state.tab===k?'active':''}" data-act="inbox-tab" data-tab="${k}">${title} <span class="count">${k==='all'?msgs.length:msgs.filter(m=>m.kind===k).length}</span></button>`).join('')}</div>`;}
function inboxMatchesTab(msg){return state.tab==='all'||state.tab===msg.kind;}
function smallInbox(i,n){return `<div class="inbox-row clickable" data-act="open-inbox" data-id="${a(i.id)}">${avatar(i.author,n)}<div class="inbox-info"><b>${e(i.author)}</b><p>${e(i.text)}</p></div><span class="inbox-time">${relative(i.created_at)}</span>${platform(i.platform)}${i.status==='unread'?'<span class="unread-dot"></span>':''}</div>`;}
function smallChannel(ch){const st=ch.status==='demo'?'Demo':ch.status==='youtube_api'?'API synced':'Manual';return `<div class="channel-row">${platform(ch.platform,'medium')}<div class="channel-details"><strong>${e(ch.name)}</strong><small>${ch.followers?compact(ch.followers)+' followers / subscribers':'Review / business profile'}</small></div><span class="channel-status ${ch.status==='demo'?'demo':ch.status==='manual'?'manual':''}">● ${st}</span><span class="channel-arrow">${icon('chevron','xs')}</span></div>`;}
function lineChart(arr){
 const vals=arr.length?arr:[{date:dateOnly(new Date()),reach:0,engagement:0}], max=Math.max(100,...vals.flatMap(x=>[x.reach,x.engagement])),rounded=Math.ceil(max/4/1000)*4000||1000;
 const M=Math.max(max,rounded),W=610,H=235,L=45,R=13,T=13,B=34,iw=W-L-R,ih=H-T-B;
 const XY=(key)=>vals.map((v,i)=>[L+i/(vals.length-1||1)*iw,T+ih-(v[key]||0)/M*ih]);
 const r=XY('reach'),g=XY('engagement');
 const path=pts=>'M'+pts.map(p=>p.map(x=>x.toFixed(1)).join(' ')).join(' L');
 const area=pts=>path(pts)+` L${(L+iw).toFixed(1)} ${(T+ih).toFixed(1)} L${L} ${(T+ih).toFixed(1)} Z`;
 const ys=Array.from({length:5},(_,i)=>{const y=T+ih/4*i;const value=M-M/4*i;return `<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="${i===4?'#dce5f1':'#eef2f8'}"/><text x="${L-10}" y="${y+4}" text-anchor="end" fill="#8b98ac" font-size="11">${compact(value)}</text>`;}).join('');
 const xticks=Array.from({length:Math.min(7,vals.length)},(_,i)=>{const idx=Math.round(i*(vals.length-1)/(Math.min(7,vals.length)-1||1));const x=L+idx/(vals.length-1||1)*iw;return `<text x="${x}" y="${H-11}" text-anchor="middle" fill="#8593ac" font-size="10">${dateText(vals[idx].date+'T12:00:00',{day:'numeric',month:'short'})}</text>`;}).join('');
 return `<svg class="line-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Line chart of reach and engagement for ${vals.length} day(s)"><defs><linearGradient id="reachArea" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#2c8dff" stop-opacity=".21"/><stop offset="1" stop-color="#2c8dff" stop-opacity="0"/></linearGradient><linearGradient id="engArea" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#19b878" stop-opacity=".16"/><stop offset="1" stop-color="#19b878" stop-opacity="0"/></linearGradient></defs>${ys}${xticks}<path d="${area(r)}" fill="url(#reachArea)"/><path d="${area(g)}" fill="url(#engArea)"/><path d="${path(r)}" stroke="#1170ff" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${path(g)}" stroke="#0ab96b" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>${r.length<16?r.map(x=>`<circle cx="${x[0]}" cy="${x[1]}" r="3.5" fill="#1170ff"/>`).join(''):''}${g.length<16?g.map(x=>`<circle cx="${x[0]}" cy="${x[1]}" r="3.5" fill="#0ab96b"/>`).join(''):''}</svg>`;
}
function sentimentDonut(){const reviews=getData('reviews'),p=reviews.filter(x=>x.sentiment==='positive').length,n=reviews.filter(x=>x.sentiment==='neutral').length,neg=reviews.filter(x=>x.sentiment==='negative').length,total=reviews.length,pp=total?p/total*100:0,np=total?n/total*100:0;const bg=`conic-gradient(#19c776 0 ${pp}%,#ffb21a ${pp}% ${pp+np}%,#fc525c ${pp+np}% 100%)`;return `<div class="sentiment-content"><div class="donut" style="background:${total?bg:'conic-gradient(#e7edf5 0 100%)'}"><div class="donut-inner"><strong>${total}</strong><span>Total Reviews</span></div></div><div class="sentiment-legend">${[['Positive',p,'#19c776'],['Neutral',n,'#ffb21a'],['Negative',neg,'#fc525c']].map(([label,value,color])=>`<div class="sentiment-line"><i style="background:${color}"></i><span>${label}</span><b>${value}</b><small>${total?Math.round(value/total*100):0}%</small></div>`).join('')}</div></div>`;}
function renderReviews(){
 const reviews=sortDesc(getData('reviews')).filter(r=>(state.tab==='all'||state.tab===r.sentiment||state.tab==='pending'&&r.status==='pending')&&[r.author,r.text,r.platform,r.reply].some(s=>String(s||'').toLowerCase().includes(state.filter.toLowerCase())));
 return section('Reviews & Reputation','Organise customer feedback and prepare thoughtful responses.',`${exportBtn('reviews')}${canEdit()?b(icon('plus')+' Add review','new-review','btn btn-primary'):''}`)+
 `<section class="panel"><div class="filters-bar"><input class="search-field" data-local-search placeholder="Search reviews, people or platforms..." value="${a(state.filter)}" aria-label="Filter reviews"><div class="tabs">${[['all','All'],['pending','Needs reply'],['positive','Positive'],['neutral','Neutral'],['negative','Negative']].map(([k,v])=>`<button class="tab ${state.tab===k?'active':''}" data-act="review-tab" data-tab="${k}">${v}</button>`).join('')}</div></div>${reviews.length?reviews.map((r,i)=>`<article class="large-review">${avatar(r.author,i)}<div class="large-review-main"><div class="large-review-head"><strong>${e(r.author)}</strong>${platform(r.platform)}${pill(r.sentiment)}${pill(r.status)}${demoMark(r)}<span class="muted-small">${relative(r.created_at)}</span></div><div class="stars">${'★'.repeat(r.rating)}<span class="star-empty">${'★'.repeat(5-r.rating)}</span></div><p>${escText(r.text)}</p>${r.reply?`<p class="reply-box"><strong>Saved response draft:</strong> ${escText(r.reply)}</p>`:''}<div class="large-review-actions">${canEdit()?`<button class="btn btn-small" data-act="open-review" data-id="${a(r.id)}">${icon('send')} ${r.reply?'Edit response':'Prepare response'}</button><button class="btn btn-small btn-ghost" data-act="edit-review" data-id="${a(r.id)}">${icon('edit')} Edit</button><button class="btn btn-small btn-ghost" data-act="delete" data-type="reviews" data-id="${a(r.id)}">${icon('trash')} Delete</button>`:''}</div></div></article>`).join(''):empty('star','No reviews match','Adjust the filters or add your first customer review.','')}</section>`;
}
function renderPlanner(){
 const now=new Date(),month=new Date(now.getFullYear(),now.getMonth()+state.calendarShift,1),monthStr=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric'}).format(month),gridStart=new Date(month),day=(gridStart.getDay()+6)%7;gridStart.setDate(gridStart.getDate()-day);
 const cells=Array.from({length:42},(_,i)=>{const d=new Date(gridStart);d.setDate(d.getDate()+i);const iso=dateOnly(d),posts=getData('posts').filter(p=>p.scheduled_at&&dateOnly(p.scheduled_at)===iso);return `<div class="calendar-cell ${d.getMonth()!==month.getMonth()?'muted-cell':''}"><span class="calendar-date ${iso===dateOnly(now)?'today':''}">${d.getDate()}</span>${posts.slice(0,3).map(p=>`<button class="calendar-post ${p.status}" data-act="open-post" data-id="${a(p.id)}" title="${a(p.title)}">${e(p.title)}</button>`).join('')}${posts.length>3?`<small class="muted-small">+${posts.length-3} more</small>`:''}</div>`;}).join('');
 const posts=[...getData('posts')].sort((a,b)=>String(a.scheduled_at||'').localeCompare(String(b.scheduled_at||'')));
 return section('Content Planner','Visualise your content calendar and manage post drafts.',`${exportBtn('posts')}${canEdit()?b(icon('plus')+' Create post','new-post','btn btn-primary'):''}`)+
 `<div class="api-note">${icon('info')}<div><strong>Local planning calendar.</strong> Planned posts are saved in Social 63; they do not automatically publish to social platforms. Use a linked publisher when official API access is configured in a future integration.</div></div>`+
 `<section class="panel" style="margin-bottom:17px"><div class="calendar-toolbar"><span class="calendar-month">${e(monthStr)}</span><div class="page-actions"><button class="btn btn-small" data-act="calendar-prev" aria-label="Previous month">${icon('arrowleft')}</button><button class="btn btn-small" data-act="calendar-today">Today</button><button class="btn btn-small" data-act="calendar-next" aria-label="Next month">${icon('arrowright')}</button></div></div><div class="calendar-grid">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<span class="calendar-day-head">${x}</span>`).join('')}${cells}</div></section>`+
 `${subhead('All posts',`${posts.length} saved posts`, '')}<section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Content</th><th>Platform</th><th>Schedule</th><th>Status</th><th class="text-right">Actions</th></tr></thead><tbody>${posts.map(p=>`<tr><td><span class="table-primary">${e(p.title)}</span><span class="table-sub">${e(p.caption)}</span></td><td>${platform(p.platform)} ${e(p.platform)}</td><td>${p.scheduled_at?dateText(p.scheduled_at,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Not scheduled'}</td><td>${pill(p.status)}</td><td><div class="row-actions">${canEdit()?`<button class="btn btn-small btn-icon" aria-label="Edit post" data-act="open-post" data-id="${a(p.id)}">${icon('edit')}</button><button class="btn btn-small btn-icon" aria-label="Delete post" data-act="delete" data-type="posts" data-id="${a(p.id)}">${icon('trash')}</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="5">No posts yet.</td></tr>'}</tbody></table></div></section>`;
}
function renderInbox(){const messages=sortDesc(getData('inbox')).filter(x=>inboxMatchesTab(x)&&[x.author,x.text,x.platform,x.reply].some(y=>String(y||'').toLowerCase().includes(state.filter.toLowerCase())));
 return section('Unified Inbox','Keep customer comments, mentions and conversations organised.',`${exportBtn('inbox')}${canEdit()?b(icon('plus')+' Add message','new-inbox','btn btn-primary'):''}`)+
 `<div class="api-note">${icon('info')}<div><strong>Manual inbox mode:</strong> Messages here are local records. Replies saved in this app are drafts and are <strong>not</strong> sent to Facebook, Instagram, X or other services.</div></div>`+
 `<section class="panel"><div class="filters-bar"><input class="search-field" data-local-search placeholder="Search messages and people..." value="${a(state.filter)}" aria-label="Filter inbox">${inboxTabs()}</div>${messages.length?messages.map((m,i)=>`<article class="inbox-full-item">${avatar(m.author,i)}<div class="inbox-full-item-main"><div class="inbox-meta"><b>${e(m.author)}</b>${platform(m.platform)}${pill(m.kind)}${pill(m.status)}${demoMark(m)}<small class="muted-small">${relative(m.created_at)}</small></div><p>${escText(m.text)}</p>${m.reply?`<p class="reply-box"><strong>Saved reply draft:</strong> ${escText(m.reply)}</p>`:''}<div class="inbox-full-actions">${canEdit()?`<button class="btn btn-small" data-act="open-inbox" data-id="${a(m.id)}">${icon('send')} Reply draft</button><button class="btn btn-small btn-ghost" data-act="toggle-read" data-id="${a(m.id)}">${icon('checkcircle')} ${m.status==='unread'?'Mark read':'Mark unread'}</button><button class="btn btn-small btn-ghost" data-act="delete" data-type="inbox" data-id="${a(m.id)}">${icon('trash')}</button>`:''}</div></div></article>`).join(''):empty('inbox','No matching messages','Adjust your filter or add an inbox record.')}</section>`;
}
function videoStats(){const vids=getData('videos');return {views:sum(vids,'views'),likes:sum(vids,'likes'),comments:sum(vids,'comments'),videos:vids.length};}
function renderVideos(){const videos=[...getData('videos')].sort((a,b)=>(b.views||0)-(a.views||0)),v=videoStats();
 return section('Video Analytics','Keep track of videos, views and engagement across your channels.',`${exportBtn('videos')}${canEdit()?b(icon('plus')+' Add video','new-video','btn btn-primary'):''}`)+
 `<div class="workspace-grid four" style="margin-bottom:18px"><div class="surface-card"><div class="muted-small">Total Video Views</div><div class="value">${compact(v.views)}</div><span class="text-blue">${icon('eye','small')} Tracked records</span></div><div class="surface-card"><div class="muted-small">Total Videos</div><div class="value">${fmt(v.videos)}</div><span class="text-blue">${icon('play','small')} Video records</span></div><div class="surface-card"><div class="muted-small">Likes</div><div class="value">${compact(v.likes)}</div><span class="text-green">${icon('heart','small')} Across all videos</span></div><div class="surface-card"><div class="muted-small">Comments</div><div class="value">${compact(v.comments)}</div><span class="text-blue">${icon('inbox','small')} Across all videos</span></div></div>`+
 `<div class="api-note">${icon('info')}<div>Metrics marked <strong>Demo</strong> or <strong>Manual</strong> are not verified network analytics. YouTube channels can retrieve official <strong>public</strong> video counts via YouTube Data API v3 once configured.</div></div>`+
 `${subhead('Video performance',`${videos.length} tracked videos`,canEdit()?b(icon('plus')+' Upload a video','go-media','btn btn-small'):'' )}<div class="workspace-grid">${videos.map(v=>`<article class="surface-card video-card"><div class="video-poster ${slug(v.platform)} ${/^[-_a-zA-Z0-9]{11}$/.test(v.external_id||'')?'has-thumbnail':''}" ${/^[-_a-zA-Z0-9]{11}$/.test(v.external_id||'')?`style="background-image:linear-gradient(0deg,#15223888,#15223822),url('https://i.ytimg.com/vi/${v.external_id}/hqdefault.jpg')"`:''}>${platform(v.platform)}<span class="decor">${v.platform==='YouTube'?'▶':v.platform==='Instagram'?'◎':'♪'}</span><span class="video-play">${icon('play')}</span></div><div class="video-card-body"><h3 title="${a(v.title)}">${e(v.title)}</h3><div class="muted-small">${e(v.platform)} · ${dateText(v.published_at)} · ${demoMark(v)} ${v.source==='youtube_api'?pill('youtube_api'):v.source==='manual'?pill('manual'):''}</div><div class="video-stats"><div><strong>${compact(v.views)}</strong><small>Views</small></div><div><strong>${compact(v.likes)}</strong><small>Likes</small></div><div><strong>${compact(v.comments)}</strong><small>Comments</small></div></div><div class="video-card-actions">${v.url?`<a class="btn btn-small" href="${a(v.url)}" target="_blank" rel="noopener noreferrer">${icon('link')} Open video</a>`:''}${canEdit()?`<button class="btn btn-small" data-act="open-video" data-id="${a(v.id)}">${icon('edit')} Edit</button><button class="btn btn-small btn-ghost" data-act="delete" data-type="videos" data-id="${a(v.id)}">${icon('trash')}</button>`:''}</div></div></article>`).join('')||empty('videos','No videos tracked yet','Add your first video or synchronise a YouTube channel.')}</div>`;
}
function renderChannels(){const ch=getData('channels');return section('Connected Channels','Organise profiles and configure supported official integrations.',`${exportBtn('channels')}${canEdit()?b(icon('plus')+' Add channel','new-channel','btn btn-primary'):''}`)+
 `<div class="api-note">${icon('info')}<div><strong>Connection status is explicit:</strong> Demo = sample profile; Manual = saved profile only; API synced = official public YouTube data retrieved. Publishing, direct messaging and private analytics require separate OAuth authorisation and platform review.</div></div>`+
 `<div class="workspace-grid">${ch.map(c=>`<article class="surface-card"><div class="channel-card-head">${platform(c.platform,'big')}<div><h3>${e(c.name)}</h3><p>${e(c.platform)}</p></div>${pill(c.status)}</div><div class="channel-card-stat">${c.followers?compact(c.followers):'—'}</div><div class="muted-small">${c.platform==='YouTube'?'Subscribers':c.platform==='Google'||c.platform==='Tripadvisor'||c.platform==='Yelp'?'Reviews profile':'Followers'} · Updated ${relative(c.updated_at)}</div>${c.status==='youtube_api'?`<div class="muted-small" style="margin-top:7px">${compact(c.total_views||0)} total channel views · ${fmt(c.video_count||0)} videos</div>`:''}<div class="channel-card-foot">${canEdit()?`<button class="btn btn-small" data-act="open-channel" data-id="${a(c.id)}">${icon('edit')} Edit</button><div style="display:flex;gap:5px">${c.platform==='YouTube'&&c.external_id?`<button class="btn btn-small" data-act="sync-youtube" data-id="${a(c.id)}" title="Retrieve public YouTube statistics">${icon('refresh')} Sync</button>`:''}<button class="btn btn-small btn-icon btn-ghost" aria-label="Delete channel" data-act="delete" data-type="channels" data-id="${a(c.id)}">${icon('trash')}</button></div>`:`<span class="muted-small">Read-only access</span>`}</div></article>`).join('')||empty('channels','No social channels added','Add a public channel handle or YouTube channel ID.')}</div>`+
 `<div class="settings-tip" style="margin-top:18px"><strong>Official YouTube Data API:</strong> ${state.youtubeEnabled?'API key detected on the server. Add a valid UC... YouTube channel ID and click Sync.':'Add a YouTube Data API v3 key to your private config.local.php on the server to enable public statistics sync.'} Never add platform API secrets to frontend JavaScript.</div>`;
}
function renderCampaigns(){const cams=getData('campaigns');return section('Campaigns','Create and track marketing campaign plans and budgets.',`${exportBtn('campaigns')}${canEdit()?b(icon('plus')+' New campaign','new-campaign','btn btn-primary'):''}`)+
 `<div class="workspace-grid">${cams.map(c=>{let pct=0;if(c.start_date&&c.end_date){const st=new Date(c.start_date).getTime(),en=new Date(c.end_date).getTime();pct=en>st?Math.min(100,Math.max(0,(Date.now()-st)/(en-st)*100)):0;}return `<article class="surface-card"><div style="display:flex;justify-content:space-between;gap:10px"><div><div class="eyebrow">${e(c.platform)}</div><h3 style="font-size:16px;margin-top:6px">${e(c.name)}</h3></div>${pill(c.status)}</div><p>${e(c.notes||'No notes added.')}</p><div class="campaign-meta"><span>Timeline progress</span><strong>${Math.round(pct)}%</strong></div><div class="campaign-progress"><span style="width:${pct}%"></span></div><div class="campaign-meta"><span>${c.start_date?dateText(c.start_date+'T12:00:00'):'—'} → ${c.end_date?dateText(c.end_date+'T12:00:00'):'—'}</span><b>${currency(c.budget)} planned</b></div><div class="channel-card-foot">${demoMark(c)}<div class="page-actions">${canEdit()?`<button class="btn btn-small" data-act="open-campaign" data-id="${a(c.id)}">${icon('edit')} Edit</button><button class="btn btn-small btn-icon btn-ghost" data-act="delete" data-type="campaigns" data-id="${a(c.id)}" aria-label="Delete campaign">${icon('trash')}</button>`:''}</div></div></article>`}).join('')||empty('campaigns','No campaigns yet','Create a campaign plan, with dates and a budget.')}</div>`;
}
function renderAnalytics(){const st=dashboardMetrics(),v=videoStats(),data=[...sliceMetrics()].reverse().slice(0,30);
 return section('Analytics & Insights','Monitor performance trends from your saved metrics.',`${exportBtn('metrics')}${canEdit()?b(icon('plus')+' Record metrics','new-metrics','btn btn-primary'):''}`)+
 `<div class="page-actions" style="margin-bottom:15px"><select class="soft-select" data-range-select aria-label="Analytics range">${[7,30,90].map(d=>`<option value="${d}" ${state.range===d?'selected':''}>Last ${d} days</option>`).join('')}</select></div>`+
 `<div class="workspace-grid four" style="margin-bottom:17px"><div class="surface-card"><div class="muted-small">Total Reach</div><div class="value">${compact(st.reach)}</div><span class="text-blue">Period total</span></div><div class="surface-card"><div class="muted-small">Engagements</div><div class="value">${compact(sum(st.arr,'engagement'))}</div><span class="text-green">Period total</span></div><div class="surface-card"><div class="muted-small">Video Views</div><div class="value">${compact(v.views)}</div><span class="text-blue">Video records</span></div><div class="surface-card"><div class="muted-small">Sentiment</div><div class="value">${st.revs.length?st.score+'%':'—'}</div><span class="text-green">From reviews</span></div></div>`+
 `<div class="workspace-grid two" style="margin-bottom:17px"><section class="panel analytics-card"><div class="panel-heading"><h2>${icon('chart')} Reach and engagement</h2></div><div class="chart-panel-body">${lineChart(st.arr)}<div class="chart-legend"><span><i class="legend-dot"></i>Reach</span><span><i class="legend-dot green"></i>Engagement</span></div></div></section><section class="panel"><div class="panel-heading"><h2>${icon('smile')} Review sentiment</h2></div>${sentimentDonut()}<div style="padding:0 21px 18px" class="muted-small">Based on ${st.revs.length} locally stored reviews.</div></section></div>`+
 `${subhead('Daily statistics',`${data.length} daily records`, '')}<section class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Reach</th><th>Engagements</th><th>Follower change</th><th>Video views</th><th>Source</th></tr></thead><tbody>${data.map(x=>`<tr><td class="table-primary">${dateText(x.date+'T12:00:00')}</td><td>${fmt(x.reach)}</td><td>${fmt(x.engagement)}</td><td class="${x.followers>=0?'text-green':'text-red'}">${x.followers>0?'+':''}${fmt(x.followers)}</td><td>${fmt(x.views)}</td><td>${demoMark(x)||pill('manual')}</td></tr>`).join('')||'<tr><td colspan="6">No recorded metrics. Add data using Record metrics.</td></tr>'}</tbody></table></div></section>`;
}
function renderMedia(){const files=sortDesc(getData('media'));return section('Media Library','Upload and organise images and videos for your content drafts.',canEdit()?b(icon('upload')+' Upload media','new-upload','btn btn-primary'):'')+
 `<div class="api-note">${icon('shield')}<div>Uploaded files are stored in a protected server directory. They can be opened only by signed-in users with access to this workspace. Max upload: <strong>${state.uploadLimit||40} MB</strong> (your hosting PHP limits may be lower).</div></div>`+
 `<div class="workspace-grid four">${files.map(m=>{const src=`api.php?action=file&amp;id=${encodeURIComponent(m.id)}`;const video=String(m.mime).startsWith('video/');return `<article class="surface-card media-card"><div class="media-preview">${video?`<video preload="none" controls src="${src}" playsinline aria-label="${a(m.name)}"></video>`:`<img src="${src}" loading="lazy" alt="${a(m.name)}">`}</div><div class="media-details"><strong title="${a(m.name)}">${e(m.name)}</strong><small>${video?'Video':'Image'} · ${(m.size/1024/1024).toFixed(2)} MB · ${dateText(m.created_at)}</small><div class="media-actions"><a class="btn btn-small" href="${src}" target="_blank" rel="noopener noreferrer">${icon('eye')} Open</a>${canEdit()?`<button class="btn btn-small btn-ghost" data-act="delete" data-type="media" data-id="${a(m.id)}">${icon('trash')} Delete</button>`:''}</div></div></article>`}).join('')||empty('media','Your library is empty','Upload images or videos to use them in your planned posts.',canEdit()?b(icon('upload')+' Upload media','new-upload','btn btn-primary'):'')}</div>`;
}
function renderTeam(){const users=getData('users');return section('Team & Access','Manage your workspace members and their permissions.',isOwner()?b(icon('plus')+' Add member','new-user','btn btn-primary'):'')+
 `<div class="workspace-grid two"><section class="panel"><div class="panel-heading"><h2>${icon('team')} Workspace members</h2><span class="muted-small">${users.length} ${users.length===1?'member':'members'}</span></div>${users.map((u,i)=>`<div class="team-person">${avatar(u.name,i)}<div class="team-person-info"><b>${e(u.name)} ${u.id===state.user.id?'<span class="muted-small">(you)</span>':''}</b><small>${e(u.email)}</small></div>${pill(u.role)}${isOwner()&&u.id!==state.user.id?`<button class="btn btn-small btn-icon btn-ghost" data-act="delete" data-type="users" data-id="${a(u.id)}" aria-label="Remove member">${icon('trash')}</button>`:''}</div>`).join('')}</section><section class="surface-card"><h3>Role permissions</h3><p><strong>Owner</strong> — manages all workspace settings, passwords for their own account, and member access.</p><p><strong>Editor</strong> — creates and edits content, reviews, messages, channels and uploads.</p><p><strong>Viewer</strong> — read-only access to workspace data and reports.</p><div class="settings-tip">New members receive a password chosen when their account is created. Passwords are stored only as secure hashes. No invitation email is sent by this starter app.</div></section></div>`;
}
function renderSettings(){const w=state.data.workspace||{},dark=document.body.classList.contains('theme-dark');return section('Settings','Configure your workspace, appearance, data and account security.')+
 `<div class="workspace-grid two"><div class="settings-column"><section class="surface-card settings-card"><h2>Workspace details</h2><p>Customise the brand information shown across Social 63.</p><form data-form="workspace"><div class="form-field"><label for="workspaceField">Workspace name</label><input class="form-control" id="workspaceField" name="name" value="${a(w.name)}" required maxlength="100" ${isOwner()?'':'disabled'}></div><div class="form-grid"><div class="form-field"><label for="industryField">Industry</label><input class="form-control" id="industryField" name="industry" value="${a(w.industry||'')}" maxlength="100" ${isOwner()?'':'disabled'}></div><div class="form-field"><label for="timezoneField">Timezone</label><select class="form-control" name="timezone" id="timezoneField" ${isOwner()?'':'disabled'}>${['Europe/London','Europe/Riga','Europe/Vilnius','Europe/Tallinn','Europe/Stockholm','Europe/Oslo','Europe/Copenhagen','Atlantic/Canary','UTC','America/New_York'].map(t=>`<option value="${t}" ${w.timezone===t?'selected':''}>${t}</option>`).join('')}</select></div></div>${isOwner()?'<button class="btn btn-primary" type="submit">Save workspace</button>':''}</form></section>
 <section class="surface-card settings-card"><h2>Account security</h2><p>Change your password. Use a unique password with at least 12 characters.</p><form data-form="password" autocomplete="off"><div class="form-field"><label for="oldPassword">Current password</label><input class="form-control" type="password" id="oldPassword" name="old_password" autocomplete="current-password" required></div><div class="form-field"><label for="newPassword">New password</label><input class="form-control" type="password" id="newPassword" name="new_password" autocomplete="new-password" minlength="12" maxlength="128" required></div><button class="btn btn-primary" type="submit">${icon('shield')} Change password</button></form></section>
 <section class="surface-card settings-card hcaptcha-card"><div class="settings-security-head"><div><h2>${icon('shield')} hCaptcha login protection</h2><p>Optional human verification for the sign-in page.</p></div><span class="security-status ${state.hcaptcha?.enabled?'enabled':'disabled'}">${state.hcaptcha?.enabled?'● Enabled':'○ Disabled'}</span></div>
 ${isOwner()?`<form data-form="hcaptcha" autocomplete="off"><label class="hcaptcha-toggle-row"><span><b>Enable hCaptcha</b><small>Require a completed challenge before every login.</small></span><span class="switch"><input type="checkbox" name="enabled" value="1" ${state.hcaptcha?.enabled?'checked':''} aria-label="Enable hCaptcha"><span class="switch-track"></span></span></label><div class="form-field"><label for="captchaSiteKey">Site key <small>(public)</small></label><input class="form-control" id="captchaSiteKey" name="site_key" value="${a(state.hcaptcha?.site_key||'')}" placeholder="Your hCaptcha site key" maxlength="128" autocomplete="off"></div><div class="form-field"><label for="captchaSecret">Secret key <small>(server only)</small></label><input class="form-control" id="captchaSecret" name="secret_key" type="password" value="" placeholder="${state.hcaptcha?.secret_configured?'Secret saved — leave blank to keep it':'Paste your hCaptcha secret key'}" maxlength="256" autocomplete="new-password"><small>Never displayed again. Leave blank to keep the saved secret.</small></div><label class="hcaptcha-clear-row"><input type="checkbox" name="clear_keys" value="1"> <span>Remove stored keys when saving (disable protection first)</span></label><div class="security-actions"><button type="submit" class="btn btn-primary">${icon('shield')} Save hCaptcha settings</button><a href="https://dashboard.hcaptcha.com/" target="_blank" rel="noopener noreferrer">Get hCaptcha keys ↗</a></div></form>`:`<div class="settings-tip">${state.hcaptcha?.enabled?'hCaptcha is enabled.':'hCaptcha is disabled.'} Only workspace owners can update the keys or protection settings.</div>`}
 <p class="security-footnote">The challenge loads only when enabled. Verification happens securely on the server and requires access to hCaptcha's verification service.</p></section>
 <section class="surface-card settings-card"><h2>Visual appearance</h2><p>Choose the interface mode for this browser.</p><div class="page-actions"><button class="btn ${!dark?'btn-primary':''}" data-act="theme-light">${icon('sun')} Light mode</button><button class="btn ${dark?'btn-primary':''}" data-act="theme-dark">${icon('moon')} Dark mode</button></div></section></div>
 <div class="settings-column"><section class="surface-card settings-card"><h2>Official integrations</h2><p>Connect approved APIs to retrieve verified external statistics.</p><div class="settings-tip"><strong>YouTube Data API v3:</strong> ${state.youtubeEnabled?'<span class="text-green">API key detected</span>':'Not configured'}<p style="margin:9px 0 0">Configure <code>youtube_api_key</code> in <code>config.local.php</code> on the server, then add a YouTube channel with its public <code>UC…</code> ID. Use Sync in the Channels page.</p><p style="margin:8px 0 0">Official OAuth connectors for Instagram/Facebook, TikTok, LinkedIn, X and business reviews require each platform’s application credentials, permissions and approvals; these are not pre-connected.</p></div></section>
 <section class="surface-card settings-card"><h2>Record daily statistics</h2><p>Add your own verified numbers to the analytics dashboard. Manual statistics are labelled as such.</p>${canEdit()?b(icon('plus')+' Record metrics','new-metrics','btn'):''}</section>
 <section class="surface-card settings-card"><h2>Demo content</h2><p>Starter sample entries are clearly marked Demo and can be removed without deleting your own records.</p><div class="danger-zone"><h3>${state.data.demo?'Remove example data':'Sample content removed'}</h3><p>${state.data.demo?'Delete only entries marked Demo (reviews, posts, videos, campaigns, example metrics and profiles). User-created records stay intact. This action cannot be undone.':'Your workspace no longer includes example metrics.'}</p>${state.data.demo&&isOwner()?b(icon('trash')+' Clear demo data','clear-demo','btn btn-danger'):''}</div></section>
 <section class="surface-card settings-card"><h2>Build & deployment</h2><p>Social 63 v1.1.0 · Self-hosted PHP · Private file storage · No cloud dependencies for the dashboard.</p><div class="settings-tip">For production use <strong>HTTPS</strong>, PHP 8.1+, a writable protected <code>storage</code> directory, and keep your private <code>config.local.php</code> out of public Git repositories. File-based storage is ideal for a small single-server workspace, not high-volume multi-server SaaS.</div></section></div></div>`;
}
function renderSearch(){const q=state.search.trim().toLowerCase();if(!q)return section('Search your workspace','Find posts, channels, videos, reviews and inbox messages.')+empty('globe','Start typing to search','Use the search field at the top of the page.');let results=[];
 for(const [key,title,route,keys,ico] of [['reviews','Review','reviews',['author','text','platform'],'star'],['posts','Post','planner',['title','caption','platform'],'calendar'],['videos','Video','videos',['title','platform'],'videos'],['inbox','Message','inbox',['author','text','platform'],'inbox'],['channels','Channel','channels',['name','platform'],'channels'],['campaigns','Campaign','campaigns',['name','notes','platform'],'campaigns']]) {
  for(const rec of getData(key))if(keys.some(k=>String(rec[k]||'').toLowerCase().includes(q)))results.push({title:rec.title||rec.name||rec.author||'Item',subtitle:rec.text||rec.caption||rec.platform||rec.notes||'',type:title,route,ico});
 }
 return section('Search results',`${results.length} result${results.length===1?'':'s'} for “${state.search}”`)+`<section class="panel">${results.slice(0,80).map(r=>`<button class="popover-item" style="padding:15px;border-bottom:1px solid var(--line)" data-nav="${r.route}"><span class="feed-dot">${icon(r.ico)}</span><span style="flex:1;min-width:0;text-align:left"><b style="display:block">${e(r.title)} <span class="muted-small">· ${r.type}</span></b><span class="table-sub">${e(r.subtitle)}</span></span>${icon('chevron')}</button>`).join('')||empty('globe','No results found','Try a different name, keyword or platform.')}</section>`;
}
const field=(title,name,value='',type='text',opts='')=>`<div class="form-field"><label for="m_${a(name)}">${e(title)}</label><input class="form-control" id="m_${a(name)}" name="${a(name)}" type="${type}" value="${a(value)}" ${opts}></div>`;
const textArea=(title,name,value='',opts='')=>`<div class="form-field"><label for="m_${a(name)}">${e(title)}</label><textarea class="form-control" id="m_${a(name)}" name="${a(name)}" ${opts}>${e(value)}</textarea></div>`;
const selectField=(title,name,options,value='')=>`<div class="form-field"><label for="m_${a(name)}">${e(title)}</label><select class="form-control" id="m_${a(name)}" name="${a(name)}">${options.map(x=>{const [val,label]=Array.isArray(x)?x:[x,x];return `<option value="${a(val)}" ${val===value?'selected':''}>${e(label)}</option>`;}).join('')}</select></div>`;
const hiddenId=(v)=>`<input type="hidden" name="id" value="${a(v||'')}">`;
function modal(title,formName,fields,button='Save changes'){
 $('#modalTitle').textContent=title;
 $('#modalBody').innerHTML=`<form data-form="${a(formName)}"><div class="modal-body">${fields}</div><div class="modal-actions"><button type="button" class="btn" id="cancelModal">Cancel</button><button type="submit" class="btn btn-primary">${e(button)}</button></div></form>`;
 $('#modalBackdrop').hidden=false;
 const target=$('#modalBody').querySelector('input:not([type=hidden]),textarea,select'); if(target)setTimeout(()=>target.focus(),50);
}
function closeModal(){$('#modalBackdrop').hidden=true;$('#modalBody').innerHTML='';}
function openReview(r){
 if(!canEdit())return;
 modal(r?`Response to ${r.author}`:'Add customer review',r?'review-reply':'review',r?`${hiddenId(r.id)}<div class="settings-tip" style="margin-bottom:17px"><b>${e(r.author)}</b> · ${e(r.platform)} · ${'★'.repeat(r.rating)}<p style="margin:9px 0 0">${escText(r.text)}</p></div>${textArea('Reply draft (saved locally)','reply',r.reply,'rows="5" maxlength="2500" placeholder="Write your response..."')}<div class="muted-small">The response is not submitted to ${e(r.platform)} automatically.</div>`:
 `${field('Reviewer name','author','','text','required maxlength="110"')}${selectField('Review source','platform',['Google','Facebook','Instagram','Yelp','Tripadvisor','Other'],'Google')}${selectField('Star rating','rating',[[1,'★ 1'],[2,'★★ 2'],[3,'★★★ 3'],[4,'★★★★ 4'],[5,'★★★★★ 5']],5)}${textArea('Customer review','text','','required maxlength="3000" rows="4"')}`,r?'Save reply draft':'Save review');
}
function editReview(r){if(!canEdit())return;modal('Edit customer review','review',hiddenId(r.id)+`${field('Reviewer name','author',r.author,'text','required maxlength="110"')}${selectField('Review source','platform',['Google','Facebook','Instagram','Yelp','Tripadvisor','Other'],r.platform)}${selectField('Star rating','rating',[[1,'★ 1'],[2,'★★ 2'],[3,'★★★ 3'],[4,'★★★★ 4'],[5,'★★★★★ 5']],r.rating)}${textArea('Customer review','text',r.text,'required maxlength="3000" rows="4"')}`);}
function openInbox(x){if(!canEdit())return;modal(x?'Conversation with '+x.author:'Add inbox message',x?'inbox-reply':'inbox',x?`${hiddenId(x.id)}<div class="settings-tip" style="margin-bottom:15px"><b>${e(x.author)}</b> · ${e(x.platform)}<p style="margin:8px 0 0">${escText(x.text)}</p></div>${textArea('Reply draft','reply',x.reply,'rows="5" maxlength="2500" placeholder="Write a reply..."')}<p class="muted-small">This saves a draft. No external message is sent.</p>`:`${field('Sender name','author','','text','required maxlength="110"')}${selectField('Social platform','platform',['Instagram','Facebook','X','Google','TikTok','LinkedIn','Other'],'Instagram')}${selectField('Type','kind',['message','comment','mention','question'],'message')}${textArea('Message','text','','required maxlength="3000" rows="4"')}`,x?'Save response draft':'Save message');}
function openPost(p){if(!canEdit())return;const m=getData('media');const mediaOptions=[['','No attachment'],...m.map(x=>[x.id,x.name])];modal(p?'Edit content draft':'Create post','post',`${hiddenId(p?.id)}${field('Post title','title',p?.title||'','text','required maxlength="160"')}${selectField('Publish to (planning only)','platform',postPlatforms,p?.platform||'Instagram')}${textArea('Caption','caption',p?.caption||'','required maxlength="5000" rows="5" placeholder="Write your post caption..."')}<div class="form-grid">${selectField('Post status','status',[['draft','Draft'],['scheduled','Planned on calendar'],['published','Published manually']],p?.status||'draft')}${field('Date & time','scheduled_at',formatInputDate(p?.scheduled_at||''),'datetime-local')}</div>${selectField('Media library attachment','media_id',mediaOptions,p?.media_id||'')}${field('Published post URL (optional)','published_url',p?.published_url||'','url','placeholder="https://..."')}<div class="muted-small">Social 63 stores your plan only. Mark Published after you publish on your social platform.</div>`,p?'Save changes':'Create draft');}
function openChannel(c){if(!canEdit())return;modal(c?'Edit channel':'Add social channel','channel',`${hiddenId(c?.id)}${selectField('Platform','platform',platformList,c?.platform||'Instagram')}${field('Channel name / handle','name',c?.name||'','text','required maxlength="160" placeholder="@yourhandle"')}${field('Followers / subscribers (manual)','followers',c?.followers||0,'number','min="0" max="1000000000"')}${field('YouTube channel ID (optional)','external_id',c?.external_id||'','text','maxlength="140" placeholder="UC..."')}<div class="muted-small">A channel saved here is not automatically authenticated. For YouTube public stats, enter the 24-character channel ID beginning with UC, add an API key on the server and click Sync.</div>`);}
function openVideo(v){if(!canEdit())return;modal(v?'Edit video statistics':'Add video statistics','video',`${hiddenId(v?.id)}${field('Video title','title',v?.title||'','text','required maxlength="180"')}${selectField('Platform','platform',['YouTube','Instagram','TikTok','Facebook','X','Other'],v?.platform||'YouTube')}${field('Video URL (optional)','url',v?.url||'','url','placeholder="https://..."')}<div class="form-grid">${field('Views','views',v?.views||0,'number','min="0"')}${field('Likes','likes',v?.likes||0,'number','min="0"')}${field('Comments','comments',v?.comments||0,'number','min="0"')}${field('Shares','shares',v?.shares||0,'number','min="0"')}</div>${field('Publish date','published_at',formatInputDate(v?.published_at||new Date().toISOString()),'datetime-local')}<div class="muted-small">Edits are labelled Manual. Public YouTube sync may replace matching official video records.</div>`);}
function openCampaign(c){if(!canEdit())return;modal(c?'Edit campaign':'New campaign','campaign',`${hiddenId(c?.id)}${field('Campaign name','name',c?.name||'','text','required maxlength="150"')}${selectField('Platform','platform',['Multi-platform','Instagram','Facebook','TikTok','YouTube','LinkedIn','X'],c?.platform||'Multi-platform')}<div class="form-grid">${selectField('Status','status',['draft','active','paused','completed'],c?.status||'draft')}${field('Planned budget (GBP)','budget',c?.budget||0,'number','min="0"')}</div><div class="form-grid">${field('Start date','start_date',c?.start_date||'','date')}${field('End date','end_date',c?.end_date||'','date')}</div>${textArea('Notes','notes',c?.notes||'','rows="3" maxlength="2500"')}`);}
function openMetrics(){if(!canEdit())return;const today=dateOnly(new Date());const old=getData('metrics').find(x=>x.date===today);modal('Record daily metrics','metrics',`${field('Date','date',today,'date','required')}<div class="form-grid">${field('Reach','reach',old?.reach||0,'number','required min="0"')}${field('Engagements','engagement',old?.engagement||0,'number','required min="0"')}${field('Follower change','followers',old?.followers||0,'number','required')}${field('Video views','views',old?.views||0,'number','required min="0"')}</div><div class="muted-small">Recording metrics for an existing date replaces that date’s values with your manual figures. Figures are not fetched from social networks.</div>`);}
function openUser(){if(!isOwner())return;modal('Add team member','user',`${field('Full name','name','','text','required maxlength="90"')}${field('Email address','email','','email','required maxlength="200"')}${field('Initial password (12+ characters)','password','','password','required minlength="12" maxlength="128" autocomplete="new-password"')}${selectField('Role','role',[['editor','Editor — can manage content'],['viewer','Viewer — read only'],['owner','Owner — full access']],'editor')}<div class="muted-small">Give the new member their password securely. No email is sent automatically.</div>`,'Add member');}
function openUpload(){if(!canEdit())return;modal('Upload image or video','upload',`<div class="form-field"><label for="m_file">Choose media</label><input class="form-control" id="m_file" type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime"><small>JPEG, PNG, WEBP, AVIF, GIF, MP4, WEBM or MOV. Maximum ${state.uploadLimit||40} MB, or your hosting's smaller PHP limit.</small></div>`,'Upload file');}
function find(kind,id){return getData(kind).find(x=>x.id===id);}
function closeSidebar(){$('#sidebar').classList.remove('open');$('#mobileShade').hidden=true;}
async function mutate(action,body,upload=false,success='Saved successfully.'){
 if(state.lock)return;
 state.lock=true;
 try{const res=await api(action,body,upload);closeModal();await refresh();toast(res.notice||success);}
 catch(err){toast(err.message,true);}finally{state.lock=false;}
}
function mapBody(fd){const r={};for(const [k,v] of fd) r[k]=v;return r;}
function handlerClick(event){
 const nav=event.target.closest('[data-nav]');if(nav){event.preventDefault();route(nav.dataset.nav);return;}
 const el=event.target.closest('[data-act]');if(!el)return;
 const act=el.dataset.act,id=el.dataset.id;
 if(act==='new-post')return openPost(null);
 if(act==='open-post')return openPost(find('posts',id));
 if(act==='new-review')return openReview(null);
 if(act==='open-review')return openReview(find('reviews',id));
 if(act==='edit-review')return editReview(find('reviews',id));
 if(act==='new-inbox')return openInbox(null);
 if(act==='open-inbox')return openInbox(find('inbox',id));
 if(act==='new-channel')return openChannel(null);
 if(act==='open-channel')return openChannel(find('channels',id));
 if(act==='new-video')return openVideo(null);
 if(act==='open-video')return openVideo(find('videos',id));
 if(act==='new-campaign')return openCampaign(null);
 if(act==='open-campaign')return openCampaign(find('campaigns',id));
 if(act==='new-metrics')return openMetrics();
 if(act==='new-user')return openUser();
 if(act==='new-upload')return openUpload();
 if(act==='go-media')return route('media');
 if(act==='review-tab'||act==='inbox-tab'){state.tab=el.dataset.tab;renderMain();return;}
 if(act==='select-day'){state.selectedDate=el.dataset.day;renderMain();return;}
 if(act==='calendar-prev'){state.calendarShift--;renderMain();return;}
 if(act==='calendar-next'){state.calendarShift++;renderMain();return;}
 if(act==='calendar-today'){state.calendarShift=0;renderMain();return;}
 if(act==='theme-light'||act==='theme-dark'){theme(act.replace('theme-',''));renderMain();return;}
 if(act==='toggle-read')return mutate('mark_inbox',{id,status:find('inbox',id)?.status==='unread'?'read':'unread'},false,'Message status updated.');
 if(act==='sync-youtube'){if(confirm('Synchronise official public YouTube channel and video statistics?'))mutate('sync_youtube',{id},false,'YouTube data updated.');return;}
 if(act==='delete'){if(!canEdit())return;const kind=el.dataset.type;const term=kind==='users'?'team member':kind.slice(0,-1);if(confirm(`Delete this ${term}? This cannot be undone.`))mutate('delete_record',{id,type:kind},false,'Item deleted.');return;}
 if(act==='clear-demo'){if(!isOwner())return;const answer=prompt('This removes all sample records and sample statistics. Your own saved items remain. Type CLEAR DEMO to confirm:');if(answer==='CLEAR DEMO')mutate('clear_demo',{confirmation:answer},false,'Example data removed.');return;}
}
async function handleForm(event){
 const form=event.target;
 if(form.id==='loginForm'){
  event.preventDefault();const btn=$('#loginButton'),error=$('#loginError');btn.disabled=true;btn.textContent='Signing in…';error.hidden=true;
  try{
   let captchaToken='';
   if(state.hcaptcha?.enabled){
    if(captchaWidget===null||!window.hcaptcha)throw Error('Security verification is still loading. Please wait or reload.');
    captchaToken=window.hcaptcha.getResponse(captchaWidget)||'';
    if(!captchaToken)throw Error('Please complete the hCaptcha challenge to sign in.');
   }
   await api('login',{email:form.elements.namedItem('email').value.trim(),password:form.elements.namedItem('password').value,hcaptcha_token:captchaToken});
   form.reset();await refresh();route((location.hash||'#dashboard').slice(1));
  }
  catch(err){error.textContent=err.message;error.hidden=false;}
  finally{resetLoginCaptcha();btn.disabled=false;btn.innerHTML='Sign in <span aria-hidden="true">→</span>';}
  return;
 }
 if(!form.dataset.form)return;event.preventDefault();
 const fd=new FormData(form),body=mapBody(fd),type=form.dataset.form;
 const target={review:'save_review','review-reply':'reply_review',inbox:'save_inbox','inbox-reply':'reply_inbox',post:'save_post',channel:'save_channel',video:'save_video',campaign:'save_campaign',metrics:'save_metrics',user:'save_user',workspace:'save_workspace',password:'change_password',hcaptcha:'save_hcaptcha',upload:'upload'}[type];
 if(!target)return;
 if(type==='hcaptcha'){body.enabled=fd.has('enabled')?'1':'0';body.clear_keys=fd.has('clear_keys')?'1':'0';}
 if(type==='upload'){const f=fd.get('file');if(!f?.size){toast('Please choose a file.',true);return;}if(f.size>(state.uploadLimit||40)*1024*1024){toast('File exceeds the configured upload limit.',true);return;}return mutate(target,fd,true,'Media uploaded.');}
 if(type==='post'&&body.status==='scheduled'&&!body.scheduled_at){toast('Choose a date and time for a planned post.',true);return;}
 if(type==='password'&&body.old_password===body.new_password){toast('Choose a different new password.',true);return;}
 await mutate(target,body,false,type==='password'?'Password updated.':'Saved successfully.');
}
function openAccount(){const el=$('#accountPopover');$('#notificationPopover').hidden=true;if(!el.hidden){el.hidden=true;return;}el.innerHTML=`<div class="popover-heading">${e(state.user.name)}</div><div class="muted-small" style="padding:5px 10px 9px">${e(state.user.email)}</div><button class="popover-item" data-nav="settings">${icon('settings')} Account settings</button><button class="popover-item" data-nav="team">${icon('team')} Team members</button><button class="popover-item" id="popoverTheme">${icon('moon')} Toggle appearance</button><button class="popover-item" id="signOut">${icon('logout')} Sign out</button>`;el.hidden=false;}
function openNotifications(){const el=$('#notificationPopover');$('#accountPopover').hidden=true;if(!el.hidden){el.hidden=true;return;}el.innerHTML=`<div class="popover-heading">Recent activity</div>${getData('activity').slice(0,8).map(x=>`<div class="activity-item"><b>${e(x.text)}</b><small>${relative(x.created_at)}</small></div>`).join('')||'<div class="activity-item">No recent activity.</div>'}`;el.hidden=false;}
function wire(){
 document.addEventListener('click',handlerClick);
 document.addEventListener('submit',handleForm);
 document.addEventListener('change',ev=>{if(ev.target.matches('#periodSelect,[data-range-select]')){state.range=Number(ev.target.value)||7;renderMain();}});
 document.addEventListener('input',ev=>{
  if(ev.target.matches('[data-local-search]')){
   const pos=ev.target.selectionStart;state.filter=ev.target.value;renderMain();const input=$('[data-local-search]');if(input){input.focus();if(pos!==null)input.setSelectionRange(pos,pos);}
  }
 });
 $('#globalSearch').addEventListener('input',ev=>{
  state.search=ev.target.value;
  if(state.search.trim()){state.view='search';renderMain();updateChrome();}
  else if(state.view==='search')route('dashboard');
 });
 $('#menuButton').addEventListener('click',()=>{$('#sidebar').classList.add('open');$('#mobileShade').hidden=false;});
 $('#mobileShade').addEventListener('click',closeSidebar);
 $('#userButton').addEventListener('click',openAccount);
 $('#notifyButton').addEventListener('click',openNotifications);
 $('#closeModal').addEventListener('click',closeModal);
 $('#modalBackdrop').addEventListener('click',ev=>{if(ev.target===$('#modalBackdrop')||ev.target.id==='cancelModal')closeModal();});
 $('#togglePassword').addEventListener('click',()=>{const input=$('#loginPassword');const shown=input.type==='password';input.type=shown?'text':'password';$('#togglePassword').textContent=shown?'Hide':'Show';});
 document.addEventListener('click',async ev=>{
  if(ev.target.closest('#popoverTheme')){theme(document.body.classList.contains('theme-dark')?'light':'dark');$('#accountPopover').hidden=true;renderMain();}
  if(ev.target.closest('#signOut')){
   try{await api('logout',{});showLogin();state.view='dashboard';history.replaceState(null,'','#dashboard');$('#accountPopover').hidden=true;toast('Signed out successfully.');}catch(err){toast(err.message,true);}
  }
  if(!ev.target.closest('#userButton,#accountPopover'))$('#accountPopover').hidden=true;
  if(!ev.target.closest('#notifyButton,#notificationPopover'))$('#notificationPopover').hidden=true;
 });
 document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){closeModal();$('#accountPopover').hidden=true;$('#notificationPopover').hidden=true;closeSidebar();}
  if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();$('#globalSearch').focus();}
 });
 window.addEventListener('hashchange',()=>{const next=(location.hash||'#dashboard').slice(1);if(state.data&&views.has(next)&&state.view!==next)route(next);});
}
async function boot(){wire();try{const s=await api('session');state.hcaptcha=s.hcaptcha||state.hcaptcha;if(s.authenticated){state.view=views.has((location.hash||'').slice(1))?(location.hash||'').slice(1):'dashboard';await refresh();}else showLogin();}catch(err){showLogin();const block=$('#loginError');block.textContent='Unable to reach Social 63 backend. Check PHP configuration and writable storage. '+err.message;block.hidden=false;}}
boot();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
})();
