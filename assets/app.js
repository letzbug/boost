(() => {
  const CFG = window.UNIPOP_BOOST_CONFIG || {};
  const MAX = CFG.MAX_SELECTED || 8;
  const STORAGE_KEY = "unipop_weekly_boost_selected_v1";
  let all = [];
  let candidates = [];
  let selected = loadSelected();

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function parseDate(v){
    if(!v) return null;
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
  function nextWeekRange(now=new Date()){
    const d=startOfDay(now);
    const day=d.getDay(); // 0 Sun
    const daysToMonday=((8-day)%7)||7;
    const monday=new Date(d); monday.setDate(d.getDate()+daysToMonday);
    const saturday=new Date(monday); saturday.setDate(monday.getDate()+5); saturday.setHours(23,59,59,999);
    return {monday,saturday};
  }
  function fmtDate(d){ return new Intl.DateTimeFormat("de-LU",{weekday:"short",day:"2-digit",month:"2-digit"}).format(d); }
  function fmtRange(a,b){ return `${new Intl.DateTimeFormat("de-LU",{day:"2-digit",month:"long"}).format(a)} — ${new Intl.DateTimeFormat("de-LU",{day:"2-digit",month:"long",year:"numeric"}).format(b)}`; }
  function timeOf(v){ const d=parseDate(v); return d?new Intl.DateTimeFormat("de-LU",{hour:"2-digit",minute:"2-digit"}).format(d):""; }

  function pick(obj, keys, fallback=""){
    for(const k of keys){ if(obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k]; }
    return fallback;
  }
  function organiserCode(c){
    const org = c.organisateur || c.organiser || c.organizer || c.organisateurInfo || {};
    return String(pick(org,["code"],pick(c,["organisateurCode","organiserCode","organizerCode"],""))).toUpperCase();
  }
  function count(c){
    const n = Number(pick(c,["nbInscrits","inscriptions","participants","registered","nbParticipants"],0));
    return Number.isFinite(n)?n:0;
  }
  function title(c){ return pick(c,["intitule","title","titre","nom"],"Cours UniPop"); }
  function code(c){ return pick(c,["coursCode","code","coursId","id"],""); }
  function start(c){ return parseDate(pick(c,["dateDebut","startDate","debut","date"],null)); }
  function end(c){ return parseDate(pick(c,["dateFin","endDate","fin"],null)); }
  function place(c){
    const p=pick(c,["lieu","location","site","adresse","salle"],"");
    if(typeof p==="object") return pick(p,["nom","name","libelle","adresse"],"");
    return p;
  }
  function trainer(c){
    let t=pick(c,["enseignants","trainers","formateurs"],[]);
    if(!Array.isArray(t)) t=[t];
    const names=t.map(x=>{
      if(typeof x==="string") return x;
      return [pick(x,["prenom","firstName"],""),pick(x,["nom","lastName","name"],"")].filter(Boolean).join(" ");
    }).filter(Boolean);
    return names.join(", ");
  }
  function category(c){
    const raw=pick(c,["categorie","category","domaine","theme"],"COURS UNIPOP");
    if(typeof raw==="object") return pick(raw,["nom","name","libelle"],"COURS UNIPOP");
    return String(raw).toUpperCase();
  }
  function image(c){ return pick(c,["image","imageUrl","photo","illustration","thumbnail"],""); }
  function url(c){ return pick(c,["url","link","courseUrl","coursUrl"],"https://www.unipop.lu/"); }
  function id(c){ return String(code(c) || `${title(c)}|${pick(c,["dateDebut"],"")}`); }

  function loadSelected(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");}catch{return []}
  }
  function saveSelected(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(selected.slice(0,MAX)));
  }
  function isSelected(c){ return selected.some(x=>x.id===id(c)); }
  function snapshot(c){ return {
    id:id(c), title:title(c), code:code(c), start:pick(c,["dateDebut","startDate","debut","date"],""),
    end:pick(c,["dateFin","endDate","fin"],""), place:place(c), trainer:trainer(c), category:category(c),
    image:image(c), url:url(c), count:count(c)
  } }

  async function loadData(){
    const state=$("#dataState");
    try{
      const r=await fetch(CFG.DATA_URL,{cache:"no-store"});
      if(!r.ok) throw new Error("HTTP "+r.status);
      const j=await r.json();
      all=Array.isArray(j)?j:(j.trainings||j.courses||j.data||[]);
      if(state) state.textContent="Live · Frank's Magic";
    }catch(e){
      all=demoData();
      if(state) state.textContent="Demo-Daten · URL prüfen";
      console.warn("UniPop data fallback:",e);
    }
    computeCandidates();
  }

  function computeCandidates(){
    const {monday,saturday}=nextWeekRange(new Date());
    candidates=all.filter(c=>{
      const d=start(c);
      return d && d>=monday && d<=saturday &&
        count(c)>=0 && count(c)<=Number(CFG.MAX_REGISTRATIONS ?? 3) &&
        (!CFG.ORGANISER_CODE || organiserCode(c)===String(CFG.ORGANISER_CODE).toUpperCase());
    }).sort((a,b)=>(count(a)-count(b)) || (start(a)-start(b)));
    renderAdmin();
  }

  function renderAdmin(){
    if(!$(".admin-page")) return;
    const {monday,saturday}=nextWeekRange(new Date());
    $("#weekRange").textContent=fmtRange(monday,saturday);
    $("#candidateCount").textContent=candidates.length;
    $("#selectedCount").textContent=`${selected.length}/${MAX}`;
    renderRail();
    renderTable();
  }

  function filtered(){
    const q=($("#searchInput")?.value||"").trim().toLowerCase();
    const cf=$("#countFilter")?.value||"all";
    return candidates.filter(c=>{
      if(cf!=="all" && String(count(c))!==cf) return false;
      if(!q) return true;
      return [title(c),code(c),place(c),trainer(c)].join(" ").toLowerCase().includes(q);
    });
  }

  function renderTable(){
    const body=$("#coursesBody"); if(!body) return;
    const rows=filtered();
    $("#emptyState").classList.toggle("hidden",rows.length!==0);
    body.innerHTML=rows.map(c=>{
      const d=start(c), n=count(c), sel=isSelected(c);
      return `<tr>
        <td><button class="check ${sel?"active":""}" data-action="toggle" data-id="${esc(id(c))}">${sel?"✓":""}</button></td>
        <td><div class="date-main">${esc(fmtDate(d))}</div><div class="date-sub">${esc(timeOf(pick(c,["dateDebut"],"")))}${end(c)?" – "+esc(timeOf(pick(c,["dateFin"],""))):""}</div></td>
        <td><div class="course-title">${esc(title(c))}</div><div class="course-code">${esc(code(c))}</div></td>
        <td><strong>${esc(place(c)||"—")}</strong></td>
        <td>${esc(trainer(c)||"—")}</td>
        <td><span class="count-badge"><i class="u${n}"></i>${n} Einschreibung${n===1?"":"en"}</span></td>
        <td><button class="add-btn ${sel?"selected":""}" data-action="toggle" data-id="${esc(id(c))}">${sel?"Entfernen":"Promoten +"}</button></td>
      </tr>`;
    }).join("");
  }

  function renderRail(){
    const rail=$("#selectedRail"); if(!rail) return;
    const slots=[];
    selected.slice(0,MAX).forEach((c,i)=>slots.push(`<div class="pick-slot">
      <div class="pick-title">${esc(c.title)}</div>
      <div class="pick-meta">${esc(c.code||"")} · ${c.count} TN</div>
      <div class="pick-actions">
        <button data-action="left" data-index="${i}" title="nach links">←</button>
        <button data-action="right" data-index="${i}" title="nach rechts">→</button>
        <button data-action="remove" data-index="${i}" title="entfernen">×</button>
      </div>
    </div>`));
    for(let i=selected.length;i<MAX;i++) slots.push(`<div class="pick-slot empty-slot">${i+1}</div>`);
    rail.innerHTML=slots.join("");
    $("#selectedCount").textContent=`${selected.length}/${MAX}`;
  }

  function toggle(idv){
    const idx=selected.findIndex(x=>x.id===idv);
    if(idx>=0) selected.splice(idx,1);
    else{
      if(selected.length>=MAX){ toast("Maximal 8 Kurse."); return; }
      const c=candidates.find(x=>id(x)===idv); if(c) selected.push(snapshot(c));
    }
    saveSelected(); renderAdmin();
  }
  function move(i,delta){
    const j=i+delta;if(j<0||j>=selected.length)return;
    [selected[i],selected[j]]=[selected[j],selected[i]];
    saveSelected();renderAdmin();
  }
  function toast(msg){
    const t=$("#toast");if(!t)return;
    t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800);
  }

  function bindAdmin(){
    document.addEventListener("click",e=>{
      const b=e.target.closest("[data-action]");if(!b)return;
      const a=b.dataset.action;
      if(a==="toggle") toggle(b.dataset.id);
      if(a==="left") move(Number(b.dataset.index),-1);
      if(a==="right") move(Number(b.dataset.index),1);
      if(a==="remove"){selected.splice(Number(b.dataset.index),1);saveSelected();renderAdmin();}
    });
    $("#searchInput")?.addEventListener("input",renderTable);
    $("#countFilter")?.addEventListener("change",renderTable);
    $("#clearBtn")?.addEventListener("click",()=>{selected=[];saveSelected();renderAdmin();toast("Auswahl geleert.");});
    $("#publishBtn")?.addEventListener("click",()=>{saveSelected();toast(`${selected.length} Kurse gespeichert.`);});
    $("#refreshBtn")?.addEventListener("click",loadData);
  }

  function renderPromo(){
    if(!$(".promo-page")) return;
    selected=loadSelected();
    $("#promoCount").textContent=selected.length;
    const grid=$("#promoGrid");
    $("#promoEmpty").classList.toggle("hidden",selected.length!==0);
    grid.innerHTML=selected.slice(0,MAX).map((c,i)=>{
      const d=parseDate(c.start), img=c.image?`style="background-image:url('${esc(c.image)}')"`:"";
      return `<a class="course-card" href="${esc(c.url||"https://www.unipop.lu/")}" target="_blank" rel="noopener">
        <div class="card-art" ${img}><div class="art-number">${String(i+1).padStart(2,"0")}</div></div>
        <div class="card-body">
          <div class="category-pill">${esc(c.category||"COURS UNIPOP")}</div>
          <div class="card-title">${esc(c.title)}</div>
          <div class="card-bottom">
            <div class="card-date">${d?esc(fmtDate(d)):"Nächst Woch"}<span>${esc(c.place||"UniPop")}</span></div>
            <div class="card-arrow">→</div>
          </div>
        </div>
      </a>`;
    }).join("");
  }

  function demoData(){
    const {monday}=nextWeekRange(new Date());
    const names=[
      ["Lëtzebuergesch aktiv lauschteren a verstoen léieren","Sprooch & Kommunikatioun",0,"Belval"],
      ["Mir üben a schwätze Lëtzebuergesch am Alldag","Kultur & Gesellschaft",1,"Kirchberg"],
      ["Lëtzebuergesch schwätzen a sangen","Sprooch & Kommunikatioun",2,"Belval"],
      ["Baugeschicht vun der Festung vu Lëtzebuerg","Kultur & Kreativitéit",3,"Clausen"],
      ["Workshop – Créez votre crème visage","Kreativitéit",1,"Belval"],
      ["Cours de cuisine internationale : Cuisine péruvienne","Cuisine",2,"Hollerich"],
      ["Self-Défense et Désescalade","Bien-être",0,"Ettelbruck"],
      ["Réseaux sociaux – Créer du contenu","Digital",3,"Belval"],
      ["Découvrir la photographie urbaine","Kreativitéit",1,"Kirchberg"],
      ["Yoga du matin – énergie & équilibre","Bien-être",2,"Belval"]
    ];
    return names.map((x,i)=>{
      const d=new Date(monday);d.setDate(monday.getDate()+(i%6));d.setHours(18+(i%2),0,0,0);
      const e=new Date(d);e.setHours(d.getHours()+2);
      return {
        coursCode:"DEMO-"+String(i+1).padStart(3,"0"),
        intitule:x[0],nbInscrits:x[2],dateDebut:d.toISOString(),dateFin:e.toISOString(),
        lieu:x[3],categorie:x[1],enseignants:[{prenom:"Alex",nom:"Martin"}],
        organisateur:{code:"UNIPOP"},url:"https://www.unipop.lu/"
      }
    });
  }

  if($(".admin-page")){bindAdmin();loadData();}
  if($(".promo-page")) renderPromo();
})();