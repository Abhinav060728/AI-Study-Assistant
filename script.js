const $=id=>document.getElementById(id);

/* ---------- Logged-in user (set by login.html) ---------- */
const user=Auth.getSession()||{name:"Student"};
const first=user.name.split(" ")[0];
$("uname").textContent=user.name;
$("av").textContent=user.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
$("logout").onclick=()=>Auth.logout();
const D=Auth.loadData(user.email||"guest"); /* this user's own data */
const uid=user.email||"guest";Docs.load(uid);
const NAV=[["🏠","Dashboard"],["💬","AI Tutor"],["📖","Study Guide"],["📝","My Notes"],["✅","Quiz Center"],["🗂️","Flashcards"],["📅","Study Planner"],["📊","Progress"],["⚙️","Settings"]];
function renderDashboard(){
  const fresh=D.hours===0&&D.quiz===null&&D.done===0;
  $("hello").textContent=(fresh?"Welcome, ":"Hello, ")+first+"! 👋";
  $("heroSub").textContent=fresh?"Let’s set up your study space.":"Your AI Study Assistant is here to make your learning easier.";
  $("heroText").textContent=fresh?"Upload your first notes or ask a question to begin. Your progress will show up here as you study.":"Ask questions, upload your notes, generate quizzes, and track your progress.";
  $("cheerT").textContent=fresh?"Ready when you are":"You’re doing great!";
  $("cheerS").textContent=fresh?"Your first study session starts with one question.":"Keep going to achieve your goals.";
  const q=D.quiz;
  const S=[["📖","Total study time",D.hours+" hrs",D.hoursChange?"↑ "+D.hoursChange:"No sessions yet",D.hoursChange?"up":"mute","#3B82F6"],
    ["🏆","Quiz score",q==null?"–":q+"%",q==null?"Take your first quiz":(D.quizChange?"↑ "+D.quizChange:""),q==null?"mute":"up","#F59E0B"],
    ["🔥","Study streak",D.streak+" days",D.streak?"Keep it up!":"Start today!",D.streak?"warm":"mute","#EF4444"],
    ["✔️","Completed topics",D.done+" / "+D.total,"","up","#22C55E"]];
  const col={up:"#16A34A",warm:"#F97316",mute:"var(--mute)"};
  $("stats").innerHTML=S.map(s=>`<div class="card stat" style="--c:${s[5]}"><div class="ic">${s[0]}</div><div><small>${s[1]}</small><b>${s[2]}</b><span class="up" style="color:${col[s[4]]}">${s[3]}</span>${s[1]==="Completed topics"&&D.total?`<div class="bar"><i style="width:${Math.round(D.done/D.total*100)}%"></i></div>`:""}</div></div>`).join("");
  const P=D.progress;
  $("pct").textContent=P.overall+"%";
  document.querySelector(".prog svg").setAttribute("aria-label",P.overall+" percent overall progress");
  $("arc").setAttribute("stroke-dasharray",(P.overall/100*339.3).toFixed(1)+" 339.3");
  $("arc").style.display=P.overall?"":"none";
  $("leg").innerHTML=[["Notes","notes","#3B82F6"],["Quizzes","quizzes","#22C55E"],["Study plan","plan","#F59E0B"],["Topics","topics","#8B5CF6"]].map(l=>`<div style="--c:${l[2]}"><i></i>${l[0]}<b>${P[l[1]]}%</b></div>`).join("");
  const pts=D.week.map((v,i)=>(5+i*48.33).toFixed(1)+" "+(62-v/100*50).toFixed(1));
  const path="M"+pts.join(" L");
  $("line").setAttribute("d",path);
  $("area").setAttribute("d",path+" V70 H5 Z");
  const none=D.week.every(v=>v===0);
  $("weekNote").hidden=!none;$("weekNote").textContent="Your weekly study activity will appear here.";
  $("badge").textContent=D.notifs;$("badge").hidden=!D.notifs;
  $("bell").setAttribute("aria-label",D.notifs?"Notifications, "+D.notifs+" new":"Notifications");
  if(D.file)$("fname").textContent=D.file+" is ready to summarize";
}
const TILES=[["🤖","AI Tutor","Ask any doubt","#6D5BF0"],["📄","Study Guide","Upload &amp; get summary","#22A06B"],["📋","Quiz Center","Take practice tests","#F97316"],["🗂️","Flashcards","Revise smartly","#EC4899"],["📅","Study Planner","Plan your study","#3B82F6"],["📈","Progress","Track your growth","#8B5CF6"]];
const QA=[["📋","Generate quiz","#6D5BF0"],["🗂️","Create flashcards","#22A06B"],["📅","Make study plan","#F97316"],["📝","View my notes","#3B82F6"],["📈","Check progress","#8B5CF6"]];
const strip=s=>s.replace(/&amp;/g,"&");

function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)}
function soon(name){toast(strip(name)+" isn’t built yet. Dashboard and AI chat work for now.")}
function focusChat(){$("cq").scrollIntoView({block:"center",behavior:"smooth"});$("cq").focus()}

$("nav").innerHTML=NAV.map((n,i)=>`<button type="button" class="${i?"":"on"}" data-n="${n[1]}"><span aria-hidden="true">${n[0]}</span><span>${n[1]}</span></button>`).join("");
$("nav").onclick=e=>{const b=e.target.closest("button");if(!b)return;const n=b.dataset.n;
  if(n==="AI Tutor")focusChat();else if(n==="Study Guide")openGuide();else if(n!=="Dashboard")soon(n)};
renderDashboard();
$("tiles").innerHTML=TILES.map(t=>`<button type="button" class="tile" style="--c:${t[3]}" data-n="${t[1]}"><div class="ic">${t[0]}</div><b>${t[1]}</b><small>${t[2]}</small><em>→</em></button>`).join("");
$("tiles").onclick=e=>{const b=e.target.closest(".tile");if(!b)return;const n=b.dataset.n;n==="AI Tutor"?focusChat():n==="Study Guide"?openGuide():soon(n)};
$("qa").innerHTML=QA.map(q=>`<button type="button" style="--c:${q[2]}"><span class="ic">${q[0]}</span>${q[1]}</button>`).join("");
$("qa").onclick=e=>{const b=e.target.closest("button");if(b)soon(b.textContent.trim())};
$("start").onclick=focusChat;$("keep").onclick=focusChat;
$("bell").onclick=()=>toast(D.notifs?"You have "+D.notifs+" new notifications. Notifications aren’t built yet.":"No new notifications.");
$("viewall").onclick=e=>{e.preventDefault();soon("Chat history")};

/* ---------- Chat (mock: replace reply() with a call to your backend) ---------- */
const FAQ=[[/deadlock/i,"Deadlock is a situation where two or more processes wait indefinitely for resources held by each other. It needs mutual exclusion, hold and wait, no preemption, and circular wait."],
 [/3nf|third normal/i,"A relation is in 3NF if it is in 2NF and no non-key attribute depends on the primary key through another non-key attribute."],
 [/schedul/i,"CPU scheduling decides which ready process runs next. Common policies are FCFS, SJF, Round Robin, and priority scheduling."]];
/* To use a real AI model: send q and Docs.search(q) results to your backend here and return its answer. */
async function reply(q){await new Promise(r=>setTimeout(r,500));
  const hit=Docs.search(q);
  if(hit)return hit.text+"\n\nSource: "+hit.doc+", page "+hit.page;
  const m=FAQ.find(f=>f[0].test(q));if(m)return m[1];
  return Docs.count()?"I couldn’t find this in your uploaded notes. Try different keywords from the document.":"I don’t have any notes yet. Attach a PDF, DOCX, or TXT file with the 📎 button and I’ll answer from it."}
function bubble(t,c){const d=document.createElement("div");d.className="b "+c;d.textContent=t;$("chatlog").appendChild(d);$("chatlog").scrollTop=1e6;return d}
async function send(q){q=q.trim();if(!q)return;const h=$("hint");if(h)h.remove();
  D.chat.push({t:q,c:"u"});bubble(q,"u");const w=bubble("Thinking…","a");
  let a;try{a=await reply(q)}catch(e){a="Something went wrong. Check your connection and ask again."}
  w.textContent=a;D.chat.push({t:a,c:"a"});if(D.chat.length>100)D.chat=D.chat.slice(-100);
  Auth.saveData(user.email||"guest",D);}
function renderChat(){const L=$("chatlog");L.innerHTML="";
  if(!D.chat.length){const h=document.createElement("div");h.className="empty-hint";h.id="hint";h.textContent="Hi "+first+"! Ask me anything about your subjects, or upload notes and I’ll answer from them.";L.appendChild(h)}
  D.chat.forEach(m=>bubble(m.t,m.c))}
renderChat();
$("chatf").onsubmit=e=>{e.preventDefault();const v=$("cq").value;$("cq").value="";send(v)};
$("attach").onclick=()=>$("chatfile").click();
$("chatfile").onchange=e=>{[...e.target.files].forEach(f=>take(f));e.target.value=""};
const cc=$("chatcard");
["dragover","dragenter"].forEach(v=>cc.addEventListener(v,e=>{e.preventDefault();cc.classList.add("over")}));
["dragleave","drop"].forEach(v=>cc.addEventListener(v,e=>{e.preventDefault();cc.classList.remove("over")}));
cc.addEventListener("drop",e=>[...e.dataTransfer.files].forEach(f=>take(f)));
/* Stop the browser from opening a file that is dropped outside a drop area */
["dragover","drop"].forEach(v=>addEventListener(v,e=>e.preventDefault()));
$("gsearch").onkeydown=e=>{if(e.key==="Enter"&&e.target.value.trim()){const v=e.target.value;e.target.value="";focusChat();send(v)}};

/* ---------- Upload ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function renderDocs(){const L=Docs.list();
  $("docs").innerHTML=L.map((d,n)=>`<span class="dchip">📄 ${esc(d.name)}<button type="button" data-i="${n}" aria-label="Remove ${esc(d.name)}">✕</button></span>`).join("");
  $("gen").disabled=!L.length;
  const s=$("gdoc");s.hidden=L.length<2;s.innerHTML=L.map((d,n)=>`<option value="${n}">${esc(d.name)}</option>`).join("");s.value=String(L.length-1)}
$("docs").onclick=e=>{const b=e.target.closest("button");if(b){Docs.remove(+b.dataset.i,uid);renderDocs()}};
async function take(f){
  if(!f)return;
  if(!/\.(pdf|docx|txt|md)$/i.test(f.name)){toast("Unsupported file. Choose a PDF, DOCX, TXT, or MD file.");return}
  if(f.size>10*1024*1024){toast("File is larger than 10 MB. Choose a smaller file.");return}
  $("fname").textContent="Reading "+f.name+"…";
  try{
    const r=await Docs.add(f,uid);
    $("fname").textContent=f.name+" is ready ("+r.pages+(r.pages===1?" page":" pages")+")";
    D.file=f.name;Auth.saveData(uid,D);renderDocs();
    toast(r.saved?"Added. Ask a question about it in the chat.":"Added for this session only. It is too large to save in your browser.");
  }catch(e){$("fname").textContent="";toast(e.message)}
}
renderDocs();
$("choose").onclick=()=>$("file").click();
$("file").onchange=e=>{take(e.target.files[0]);e.target.value=""};
const dz=$("drop");
["dragover","dragenter"].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add("over")}));
["dragleave","drop"].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.remove("over")}));
dz.addEventListener("drop",e=>take(e.dataTransfer.files[0]));


/* ---------- Study guide ---------- */
let guideMd="",guideName="";
function openGuide(i){
  const L=Docs.list();
  if(!L.length){$("file").click();return}
  const d=L[i==null?L.length-1:i],g=d&&Docs.guide(d.name);
  if(!g){toast("There isn’t enough text in this file to build a guide. Try a longer, text-based file.");return}
  const pg=p=>g.pages>1?`<span class="pg">p. ${p}</span>`:"";
  const mp=p=>g.pages>1?" (p. "+p+")":"";
  let h="",m="# Study guide: "+g.name+"\n\n";
  h+="<h4>Summary</h4><ul>"+g.summary.map(s=>`<li>${esc(s.text)}${pg(s.page)}</li>`).join("")+"</ul>";
  m+="## Summary\n"+g.summary.map(s=>"- "+s.text+mp(s.page)).join("\n")+"\n\n";
  if(g.terms.length){h+='<h4>Key terms</h4><div class="tags">'+g.terms.map(t=>`<span>${esc(t)}</span>`).join("")+"</div>";m+="## Key terms\n"+g.terms.join(", ")+"\n\n"}
  if(g.defs.length){h+="<h4>Definitions</h4><dl>"+g.defs.map(x=>`<dt>${esc(x.term)}${pg(x.page)}</dt><dd>${esc(x.text)}</dd>`).join("")+"</dl>";m+="## Definitions\n"+g.defs.map(x=>"- **"+x.term+":** "+x.text).join("\n")+"\n\n"}
  if(g.questions.length){h+="<h4>Practice questions</h4><ol>"+g.questions.map(x=>`<li>${esc(x.q)}<details><summary>Show answer</summary>${esc(x.a)}</details></li>`).join("")+"</ol>";m+="## Practice questions\n"+g.questions.map((x,n)=>(n+1)+". "+x.q+"\n   Answer: "+x.a).join("\n")+"\n"}
  guideMd=m;guideName=g.name;
  $("gt").textContent="Study guide: "+g.name;$("gbody").innerHTML=h;$("gm").hidden=false;$("gclose").focus();
}
function closeGuide(){$("gm").hidden=true}
$("gen").onclick=()=>openGuide(+$("gdoc").value);
$("gclose").onclick=closeGuide;
$("gm").addEventListener("click",e=>{if(e.target===$("gm"))closeGuide()});
addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("gm").hidden)closeGuide()});
$("gcopy").onclick=async()=>{try{await navigator.clipboard.writeText(guideMd);toast("Study guide copied.")}catch(e){toast("Could not copy. Use Download instead.")}};
$("gdl").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([guideMd],{type:"text/markdown"}));a.download=guideName.replace(/\.[^.]+$/,"")+"-study-guide.md";a.click();URL.revokeObjectURL(a.href)};