let DB;
const $=(s,p=document)=>p.querySelector(s);
const $$=(s,p=document)=>[...p.querySelectorAll(s)];
const pct=n=>`${Number(n).toFixed(Number(n)%1?1:0)}%`;
const initials=name=>name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();

async function loadData(){
  const url=`season-one.json?ts=${Date.now()}`;
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error(`Season database returned ${response.status}`);
  DB=await response.json();
  renderAll();
  bindEvents();
}

function renderAll(){
  const r=DB.season.record;
  $('#syncPill').textContent=`Through ${DB.meta.dataThrough}`;
  $('#heroRecord').textContent=`${r.wins}-${r.draws}-${r.losses}`;
  $('#heroLine').textContent=`${DB.meta.startingDivision} · ${DB.season.points} points · ${DB.season.goalDifference>=0?'+':''}${DB.season.goalDifference} GD`;
  $('#dataThrough').textContent=DB.meta.dataThrough;

  $('#homeMetrics').innerHTML=[
    ['Goals for',DB.season.goalsFor],
    ['Goals against',DB.season.goalsAgainst],
    ['Formation',DB.current.formation],
    ['Next match',DB.current.nextMatch]
  ].map(([label,value])=>`<article class="metric-card"><small>${label}</small><strong>${value}</strong></article>`).join('');

  const leaderItems=[
    ['Top scorer',DB.leaders.topScorer],
    ['Assist leader',DB.leaders.assistLeader],
    ['GVA leader',DB.leaders.gvaLeader]
  ];
  $('#leaderGrid').innerHTML=leaderItems.map(([label,item])=>`<article class="leader-card"><small>${label}</small><strong>${item.name.split(' ').slice(-1)}</strong><b>${item.value}</b></article>`).join('');

  $('#recentMatches').innerHTML=[...DB.matches].reverse().slice(0,3).map(matchCard).join('');
  renderMatches('ALL');
  renderPlayers('gva');
  renderAnalytics();
  renderNews();
  renderClub();

  $('#lineupGrid').innerHTML=DB.currentXI.map(p=>`<div class="lineup-player"><small>${p.position}${p.captain?' · CAPTAIN':''}</small><strong>${p.name}</strong><span>${p.ovr||'—'} OVR</span></div>`).join('');
  $('#homeNews').innerHTML=DB.news.slice(0,3).map(newsCard).join('');
}

function matchCard(m){
  const scoreClass=m.result==='L'?'loss':m.result==='D'?'draw':'';
  return `<article class="archive-card" data-match="${m.id}">
    <div><div class="archive-meta">${m.id} · ${m.result} · ${m.formation}</div><h3>${m.opponent}</h3><p>${m.headline}</p></div>
    <div class="score ${scoreClass}">${m.scoreFor}-${m.scoreAgainst}</div>
  </article>`;
}

function renderMatches(filter){
  const matches=[...DB.matches].reverse().filter(m=>filter==='ALL'||m.result===filter);
  $('#matchArchive').innerHTML=matches.map(matchCard).join('');
}

function renderPlayers(sort){
  const list=[...DB.players];
  if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name));
  else list.sort((a,b)=>b[sort]-a[sort]||b.gva-a.gva||a.name.localeCompare(b.name));
  $('#playerArchive').innerHTML=list.map(p=>`<article class="player-card" data-player="${p.name}">
    <div class="player-badge">${initials(p.name)}</div>
    <div><h3>${p.name}</h3><div class="player-sub">${p.position||'—'}${p.ovr?` · ${p.ovr} OVR`:''}</div>
      <div class="player-stats"><span><b>${p.goals}</b>Goals</span><span><b>${p.assists}</b>Assists</span><span><b>${p.gva}</b>GVA</span></div>
    </div><div class="role-pill">${p.status||'Squad'}</div>
  </article>`).join('');
}

function renderAnalytics(){
  $('#formationAnalytics').innerHTML=DB.formations.map((f,i)=>`<article class="analytics-card">
    <h3>${f.name}${f.name===DB.current.formation?' · Current':''}</h3>
    <div class="player-sub">${f.wins}-${f.draws}-${f.losses} · ${f.points} points</div>
    <div class="mini-grid">
      <div class="mini-cell"><small>GF / GA</small><b>${f.goalsFor} / ${f.goalsAgainst}</b></div>
      <div class="mini-cell"><small>Goal diff.</small><b>${f.goalDifference>=0?'+':''}${f.goalDifference}</b></div>
      <div class="mini-cell"><small>Goals / game</small><b>${f.goalsPerGame}</b></div>
      <div class="mini-cell"><small>GA / game</small><b>${f.goalsAllowedPerGame}</b></div>
      <div class="mini-cell"><small>Possession</small><b>${pct(f.averagePossession)}</b></div>
      <div class="mini-cell"><small>Pass accuracy</small><b>${pct(f.averagePassAccuracy)}</b></div>
    </div></article>`).join('');

  $('#goalkeeperAnalytics').innerHTML=DB.goalkeepers.map(g=>`<article class="analytics-card" data-goalkeeper="${g.name}">
    <h3>${g.name}</h3><div class="player-sub">${g.matches} matches</div>
    <div class="mini-grid">
      <div class="mini-cell"><small>Credited saves</small><b>${g.saves}</b></div>
      <div class="mini-cell"><small>Save %</small><b>${pct(g.savePercentage)}</b></div>
      <div class="mini-cell"><small>SOT faced</small><b>${g.shotsOnTargetFaced}</b></div>
      <div class="mini-cell"><small>Goals allowed</small><b>${g.goalsAllowed}</b></div>
      <div class="mini-cell"><small>Clean sheets</small><b>${g.cleanSheets}</b></div>
      <div class="mini-cell"><small>3+ save matches</small><b>${g.threePlusSaveMatches}</b></div>
    </div></article>`).join('');

  $('#captainAnalytics').innerHTML=DB.captains.map(c=>`<article class="analytics-card">
    <h3>${c.name}</h3><div class="player-sub">${c.starts} captain starts</div>
    <div class="mini-grid">
      <div class="mini-cell"><small>Record</small><b>${c.wins}-${c.draws}-${c.losses}</b></div>
      <div class="mini-cell"><small>Goals for</small><b>${c.goalsFor}</b></div>
      <div class="mini-cell"><small>Goals against</small><b>${c.goalsAgainst}</b></div>
    </div></article>`).join('');
}

function newsCard(n){return `<article class="news-card"><h3>${n.title}</h3><p>${n.body}</p><small>${n.match}</small></article>`}
function renderNews(){$('#newsArchive').innerHTML=DB.news.map(newsCard).join('')}

function renderClub(){
  $('#clubIdentity').innerHTML=[
    ['Season',DB.meta.season],['Division',DB.meta.startingDivision],
    ['Current captain',DB.current.captain],['Current formation',DB.current.formation],
    ['Unbeaten run',`${DB.current.unbeatenRun} matches`],['Legacy archive',DB.meta.legacyName]
  ].map(([label,value])=>`<div class="identity-card"><small>${label}</small><strong>${value}</strong></div>`).join('');
  $('#milestoneGrid').innerHTML=DB.milestones.map(m=>`<div class="milestone-card"><small>${m.title}</small><strong>${m.detail}</strong></div>`).join('');
}

function openMatch(id){
  const m=DB.matches.find(x=>x.id===id);
  $('#detailContent').innerHTML=`<div class="archive-meta">${m.id} · ${m.result}</div><h1>${m.headline}</h1>
  <div class="dialog-score">${m.scoreFor}-${m.scoreAgainst}</div><p>${m.summary}</p>
  <div class="dialog-section">${[['Opponent',m.opponent],['Formation',m.formation],['Captain',m.captain]].map(([a,b])=>`<div class="kv"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
  <div class="dialog-section"><h3>Goals and GVA</h3>${m.goals.length?m.goals.map(g=>`<div class="event"><b>${g.scorer}</b><span>${g.minute} · ${g.gva} GVA</span></div>`).join(''):'<div class="player-sub">No club goals.</div>'}</div>
  <div class="dialog-section"><h3>Recorded assists</h3>${m.recordedAssists.length?m.recordedAssists.map(a=>`<div class="event"><b>${a.player}</b><span>${a.count}</span></div>`).join(''):'<div class="player-sub">No recorded assists.</div>'}<p class="player-sub">${m.assistMappingKnown?'Exact mapping verified.':'Totals verified; scorer-assist pairings left unmapped.'}</p></div>
  <div class="dialog-section"><h3>Team stats</h3>${[
    ['Shots',`${m.stats.shots}-${m.stats.opponentShots}`],
    ['Shots on target',`${m.stats.shotsOnTarget}-${m.stats.opponentShotsOnTarget}`],
    ['Possession',pct(m.stats.possession)],['Pass accuracy',pct(m.stats.passAccuracy)]
  ].map(([a,b])=>`<div class="kv"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
  <div class="dialog-section"><h3>Goalkeeper</h3><div class="kv"><b>${m.goalkeeper.name}</b><span>${m.goalkeeper.creditedSaves} saves · ${pct(m.goalkeeper.savePercentage)}</span></div></div>
  <div class="dialog-section"><h3>Notes</h3>${m.notes.map(n=>`<div class="event"><span>• ${n}</span></div>`).join('')}</div>
  <div class="tags">${m.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>`;
  $('#detailDialog').showModal();
}

function openPlayer(name){
  const p=DB.players.find(x=>x.name===name);
  $('#detailContent').innerHTML=`<div class="archive-meta">PLAYER DOSSIER</div><h1>${p.name}</h1>
  <p>${p.position||'—'}${p.ovr?` · ${p.ovr} OVR`:''} · ${p.status||'Squad'}</p>
  <div class="mini-grid">
    <div class="mini-cell"><small>Goals</small><b>${p.goals}</b></div>
    <div class="mini-cell"><small>Assists</small><b>${p.assists}</b></div>
    <div class="mini-cell"><small>GVA</small><b>${p.gva}</b></div>
    <div class="mini-cell"><small>Captain starts</small><b>${p.captainStarts}</b></div>
    <div class="mini-cell"><small>Verified starts</small><b>${p.startsVerified||0}</b></div>
    <div class="mini-cell"><small>Verified subs</small><b>${p.subsVerified||0}</b></div>
  </div>
  <div class="dialog-section"><h3>Season timeline</h3>${p.matchLog.length?p.matchLog.map(x=>`<div class="event"><b>${x.match} · ${x.type}</b><span>${x.detail}</span></div>`).join(''):'<div class="player-sub">No verified production events yet.</div>'}</div>
  <p class="player-sub">Appearance counts remain conservative when full lineups were not archived.</p>`;
  $('#detailDialog').showModal();
}

function showScreen(name){
  $$('.screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
  $$('.nav-button').forEach(b=>b.classList.toggle('active',b.dataset.target===name));
  scrollTo({top:0,behavior:'smooth'});
}

function bindEvents(){
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-target]');if(nav)showScreen(nav.dataset.target);
    const go=e.target.closest('[data-go]');if(go)showScreen(go.dataset.go);
    const match=e.target.closest('[data-match]');if(match)openMatch(match.dataset.match);
    const player=e.target.closest('[data-player]');if(player)openPlayer(player.dataset.player);
    const result=e.target.closest('[data-result]');if(result){$$('[data-result]').forEach(x=>x.classList.remove('active'));result.classList.add('active');renderMatches(result.dataset.result)}
    const sort=e.target.closest('[data-sort]');if(sort){$$('[data-sort]').forEach(x=>x.classList.remove('active'));sort.classList.add('active');renderPlayers(sort.dataset.sort)}
  });
  $('#closeDialog').onclick=()=>$('#detailDialog').close();
  $('#detailDialog').onclick=e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close()};
}

loadData().catch(err=>{
  $('#app').innerHTML=`<section class="section-card"><h1>Club data could not load</h1><p>${err.message}</p><p class="player-sub">Run the build script or wait for GitHub Actions to generate season-one.json.</p></section>`;
  $('#syncPill').textContent='Data error';
});
