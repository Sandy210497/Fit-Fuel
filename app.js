const KEY="fitfuel-v1";
let db=JSON.parse(localStorage.getItem(KEY)||'null')||{
 profile:{name:"",age:30,sex:"male",weight:70.7,height:165,activity:1.375,target:1900,deficit:500},
 foods:[], activities:[], weights:[]
};
let selectedDate=new Date(); selectedDate.setHours(0,0,0,0);
const iso=d=>d.toISOString().slice(0,10);
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const day=()=>iso(selectedDate);
const fmt=n=>Math.round(Number(n)||0).toLocaleString("en-IN");
function showScreen(id){
 document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
 document.getElementById(id).classList.add("active");
 document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));
 render();
}
document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>showScreen(b.dataset.screen));
function changeDate(n){selectedDate.setDate(selectedDate.getDate()+n);render()}
function openModal(id){document.getElementById(id).classList.add("open")}
function closeModal(id){document.getElementById(id).classList.remove("open")}
function dateLabel(){return selectedDate.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
function bmr(){
 const p=db.profile;
 if(!p.age||!p.weight||!p.height)return 0;
 return Math.round(p.sex==="female"?(10*p.weight+6.25*p.height-5*p.age-161):(10*p.weight+6.25*p.height-5*p.age+5));
}
function estimateBurn(a){
 if(a.cal) return Number(a.cal);
 const w=db.profile.weight||70;
 const mins=Number(a.duration)||0;
 const mets={walking:3.5,running:8,cycling:7,strength:5,surya:3.5,other:5}[a.type]||5;
 return Math.round(mets*3.5*w/200*mins);
}
function dayFoods(){return db.foods.filter(x=>x.date===day())}
function dayActs(){return db.activities.filter(x=>x.date===day())}
function totals(){
 const fs=dayFoods(), as=dayActs();
 const intake=fs.reduce((s,x)=>s+Number(x.cal||0),0);
 const protein=fs.reduce((s,x)=>s+Number(x.protein||0),0);
 const carbs=fs.reduce((s,x)=>s+Number(x.carbs||0),0);
 const fat=fs.reduce((s,x)=>s+Number(x.fat||0),0);
 const steps=as.reduce((s,x)=>s+Number(x.steps||0),0);
 const distance=as.reduce((s,x)=>s+Number(x.distance||0),0);
 const exercise=as.reduce((s,x)=>s+estimateBurn(x),0);
 const base=Math.round(bmr()*(db.profile.activity||1.375));
 const burn=base+exercise;
 return {intake,protein,carbs,fat,steps,distance,exercise,base,burn,balance:burn-intake};
}
function render(){
 document.getElementById("dateLabel").textContent=dateLabel();
 const t=totals();
 ["intake","burn","steps","distance","protein","carbs","fat"].forEach(k=>document.getElementById(k).textContent=k==="distance"?t[k].toFixed(2):fmt(t[k]));
 document.getElementById("deficitValue").textContent=fmt(t.balance);
 document.getElementById("target").textContent=fmt(db.profile.target);
 document.getElementById("goalDeficit").textContent=fmt(db.profile.deficit);
 const target=db.profile.deficit||500;
 const pill=document.getElementById("statusPill");
 if(t.balance>=target){pill.className="pill good";pill.textContent="On target";document.getElementById("heroTitle").textContent="Great deficit";}
 else if(t.balance>0){pill.className="pill warn";pill.textContent="Small deficit";document.getElementById("heroTitle").textContent="Keep going";}
 else{pill.className="pill neutral";pill.textContent="Surplus";document.getElementById("heroTitle").textContent="Above burn";}
 document.getElementById("heroText").textContent=`Estimated BMR ${fmt(bmr())} kcal • exercise ${fmt(t.exercise)} kcal • target deficit ${fmt(target)} kcal`;
 const totalMacro=Math.max(1,t.protein*4+t.carbs*4+t.fat*9);
 document.getElementById("proteinBar").style.width=(t.protein*4/totalMacro*100)+"%";
 document.getElementById("carbBar").style.width=(t.carbs*4/totalMacro*100)+"%";
 document.getElementById("fatBar").style.width=(t.fat*9/totalMacro*100)+"%";
 document.getElementById("activitySummary").innerHTML=t.steps||t.distance||t.exercise?`${fmt(t.steps)} steps • ${t.distance.toFixed(2)} km • ${fmt(t.exercise)} exercise kcal`:"No activity logged yet.";
 renderFoods();renderActivities();renderHistory();loadProfile();
}
function renderFoods(){
 const el=document.getElementById("foodList"), fs=dayFoods();
 el.innerHTML=fs.length?fs.map(x=>`<div class="item"><div><h4>${esc(x.name)}</h4><p>${esc(x.meal)}${x.photo?" • 📷 photo":""} • ${fmt(x.protein)}g protein • ${fmt(x.carbs)}g carbs • ${fmt(x.fat)}g fat</p></div><div><strong>${fmt(x.cal)} kcal</strong><button class="delete" onclick="delFood('${x.id}')">×</button></div></div>`).join(""):`<div class="card empty">No food logged for ${dateLabel()}.</div>`;
}
function renderActivities(){
 const el=document.getElementById("activityList"), as=dayActs();
 el.innerHTML=as.length?as.map(x=>`<div class="item"><div><h4>${esc(x.type)}${x.notes?" • "+esc(x.notes):""}</h4><p>${x.duration||0} min • ${x.distance||0} km • ${fmt(x.steps||0)} steps</p></div><div><strong>${fmt(estimateBurn(x))} kcal</strong><button class="delete" onclick="delActivity('${x.id}')">×</button></div></div>`).join(""):`<div class="card empty">No activity logged for ${dateLabel()}.</div>`;
}
function renderHistory(){
 const el=document.getElementById("historyList");let out="";
 for(let i=0;i<14;i++){let d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);let ds=iso(d),fs=db.foods.filter(x=>x.date===ds),as=db.activities.filter(x=>x.date===ds);let intake=fs.reduce((s,x)=>s+Number(x.cal||0),0),burn=Math.round(bmr()*(db.profile.activity||1.375))+as.reduce((s,x)=>s+estimateBurn(x),0);if(intake||as.length)out+=`<div class="history-day"><span>${d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</span><b class="${burn-intake>=0?"positive":"negative"}">${burn-intake>=0?"+":""}${fmt(burn-intake)} kcal</b></div>`}
 el.innerHTML=out||'<p class="empty">Start logging to build your history.</p>';
}
async function addFood(){
 const photo=document.getElementById("fPhoto").files[0];
 let photoData="";
 if(photo)photoData=await fileToDataURL(photo);
 const x={id:crypto.randomUUID(),date:day(),meal:fMeal.value,name:fName.value.trim()||"Food",cal:+fCal.value||0,protein:+fProtein.value||0,carbs:+fCarbs.value||0,fat:+fFat.value||0,photo:photoData};
 db.foods.push(x);save();["fName","fCal","fProtein","fCarbs","fFat"].forEach(id=>document.getElementById(id).value="");document.getElementById("fPhoto").value="";closeModal("foodModal");render();
}
async function addActivity(){
 const x={id:crypto.randomUUID(),date:day(),type:aType.value,duration:+aDuration.value||0,distance:+aDistance.value||0,steps:+aSteps.value||0,cal:+aCal.value||0,notes:aNotes.value.trim()};
 db.activities.push(x);save();["aDuration","aDistance","aSteps","aCal","aNotes"].forEach(id=>document.getElementById(id).value="");closeModal("activityModal");render();
}
function delFood(id){db.foods=db.foods.filter(x=>x.id!==id);save();render()}
function delActivity(id){db.activities=db.activities.filter(x=>x.id!==id);save();render()}
function saveProfile(){
 db.profile={name:pName.value,age:+pAge.value||30,sex:pSex.value,weight:+pWeight.value||70,height:+pHeight.value||165,activity:+pActivity.value,target:+pTarget.value||0,deficit:+pDeficit.value||0};
 save();render();alert("Profile saved.");
}
function loadProfile(){
 const p=db.profile; pName.value=p.name||"";pAge.value=p.age;pSex.value=p.sex;pWeight.value=p.weight;pHeight.value=p.height;pActivity.value=p.activity;pTarget.value=p.target;pDeficit.value=p.deficit;
}
function fileToDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function exportData(){
 const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`fitfuel-backup-${day()}.json`;a.click();URL.revokeObjectURL(a.href);
}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();alert("Backup restored.")}catch{alert("Invalid backup file.")}};r.readAsText(f)}
function resetAll(){if(confirm("Delete all FitFuel data? This cannot be undone.")){localStorage.removeItem(KEY);location.reload()}}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
let deferredPrompt;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove("hidden")});
installBtn.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add("hidden")}};
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});
render();

// ---------- FitFuel V2 enhancements ----------
const FOOD_DB = [
 {n:"Idli (2)",cal:130,p:5,c:27,f:1},{n:"Dosa (1 medium)",cal:170,p:4,c:27,f:6},
 {n:"Chapati (2)",cal:210,p:7,c:40,f:4},{n:"Cooked rice (200 g)",cal:260,p:5,c:57,f:.5},
 {n:"Sambar (1 cup)",cal:150,p:7,c:22,f:4},{n:"Curd (150 g)",cal:95,p:5,c:7,f:5},
 {n:"Paneer bhurji (100 g)",cal:265,p:18,c:7,f:19},{n:"Boiled egg (2)",cal:156,p:13,c:1,f:11},
 {n:"Chicken breast cooked (100 g)",cal:165,p:31,c:0,f:3.6},{n:"Dal (1 cup)",cal:200,p:12,c:30,f:4},
 {n:"Banana (1 medium)",cal:105,p:1.3,c:27,f:.4},{n:"Apple (1 medium)",cal:95,p:.5,c:25,f:.3},
 {n:"Groundnuts roasted (30 g)",cal:170,p:7,c:6,f:14},{n:"Cucumber (1 medium)",cal:30,p:1.3,c:7,f:.2},
 {n:"Whey protein (1 scoop)",cal:120,p:24,c:3,f:2},{n:"Vegetable poriyal (1 cup)",cal:120,p:3,c:14,f:6}
];
function foodSuggest(q){
 const el=document.getElementById("foodSuggestions"); if(!el)return;
 q=(q||"").toLowerCase().trim();
 const hits=FOOD_DB.filter(x=>x.n.toLowerCase().includes(q)).slice(0,6);
 el.innerHTML=hits.map(x=>`<button onclick='pickFood(${JSON.stringify(x)})'>${esc(x.n)} • ${x.cal} kcal</button>`).join("");
}
function pickFood(x){
 fName.value=x.n;fCal.value=x.cal;fProtein.value=x.p;fCarbs.value=x.c;fFat.value=x.f;
 document.getElementById("foodSuggestions").innerHTML="";
}
function dayStats(ds){
 const fs=db.foods.filter(x=>x.date===ds), as=db.activities.filter(x=>x.date===ds);
 const intake=fs.reduce((s,x)=>s+Number(x.cal||0),0);
 const burn=Math.round(bmr()*(db.profile.activity||1.375))+as.reduce((s,x)=>s+estimateBurn(x),0);
 const protein=fs.reduce((s,x)=>s+Number(x.protein||0),0);
 const steps=as.reduce((s,x)=>s+Number(x.steps||0),0);
 const distance=as.reduce((s,x)=>s+Number(x.distance||0),0);
 return {intake,burn,balance:burn-intake,protein,steps,distance};
}
function lastNDays(n){
 let a=[];for(let i=0;i<n;i++){let d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);a.push(dayStats(iso(d)))}return a;
}
function renderInsights(){
 const t=totals(), target=db.profile.deficit||500, calTarget=db.profile.target||Math.max(0,Math.round(t.burn-target));
 const rec=document.getElementById("recommendation");
 if(!rec)return;
 let msg;
 if(t.balance>=target) msg=`<strong>🟢 ${fmt(t.balance)} kcal deficit</strong><br>You are at or beyond today's target. Keep protein high and avoid pushing the deficit excessively.`;
 else if(t.balance>0) msg=`<strong>🟡 ${fmt(t.balance)} kcal deficit</strong><br>You are in a deficit. About ${fmt(Math.max(0,target-t.balance))} kcal separates you from today's target.`;
 else msg=`<strong>🔴 ${fmt(Math.abs(t.balance))} kcal surplus</strong><br>Today's intake is above estimated burn. One day is not a failure—use the weekly trend.`;
 const proteinTarget=Math.round((db.profile.weight||70)*1.6);
 msg+=`<br><br>Protein: <b>${fmt(t.protein)} / ${fmt(proteinTarget)} g</b> • Steps: <b>${fmt(t.steps)}</b> • Distance: <b>${t.distance.toFixed(2)} km</b>`;
 rec.innerHTML=msg;
 const ds=lastNDays(7), avg=k=>Math.round(ds.reduce((s,x)=>s+x[k],0)/7);
 document.getElementById("averages").innerHTML=`<div class="goal-row"><span>Average intake</span><b>${fmt(avg("intake"))} kcal</b></div><div class="goal-row"><span>Average burn</span><b>${fmt(avg("burn"))} kcal</b></div><div class="goal-row"><span>Average deficit</span><b>${fmt(avg("balance"))} kcal/day</b></div><div class="goal-row"><span>Average steps</span><b>${fmt(avg("steps"))}</b></div>`;
 const meals=[
  ["Breakfast","2 idli + sambar + 2 eggs","~450 kcal • high protein"],
  ["Lunch","200 g cooked rice + dal + vegetable poriyal + curd","~650 kcal"],
  ["Snack","1 fruit + 30 g roasted groundnuts","~270 kcal"],
  ["Dinner","2 chapati + paneer bhurji + cucumber","~530 kcal"]
 ];
 document.getElementById("dietPlan").innerHTML=meals.map(m=>`<div class="diet-day"><b>${m[0]}</b>${m[1]}<br><span>${m[2]}</span></div>`).join("")+`<p class="note">This is a starter template. Your exact calorie target comes from your profile and should be adjusted using your real weight trend.</p>`;
}
const oldRender=render;
render=function(){oldRender();renderInsights()};
const oldShowScreen=showScreen;
showScreen=function(id){oldShowScreen(id);if(id==="insights")renderInsights()};
