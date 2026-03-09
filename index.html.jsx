import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "zerrouki-debts-v3";
const PHONE = "+213776728421";

const T = {
  ar: {
    appName:"ديون زروقي",appSub:"مدير الديون الذكي",dashboard:"الرئيسية",debts:"الديون",expenses:"المصاريف",history:"السجل",contact:"تواصل",
    totalDebts:"إجمالي الديون",totalPaid:"تم الدفع",remaining:"المتبقي",overallProgress:"التقدم الإجمالي",paid:"مدفوع",
    addPayment:"تسجيل دفعة",newExpense:"مصروف جديد",amount:"المبلغ",month:"الشهر",year:"السنة",note:"ملاحظة",notePlaceholder:"دفعة شهر جانفي",
    confirmPay:"تأكيد الدفعة",confirmExp:"تأكيد المصروف",payHistory:"سجل الدفعات",fullHistory:"السجل الكامل",
    noPayments:"لا توجد دفعات بعد",noExpenses:"لا توجد مصاريف",todayExpenses:"مصاريف اليوم",thisMonth:"هذا الشهر",add:"+ أضف",
    active:"نشط الآن",waiting:"في الانتظار",completed:"مكتمل",monthsLeft:"شهر متبقي",originalAmount:"المبلغ الأصلي",
    payments:"دفعة",contactUs:"تواصل معنا",contactDesc:"تواصل مع صاحب التطبيق عبر:",callUs:"اتصل بنا",
    food:"مواد غذائية",veggie:"خضر وفواكه",clothes:"ملابس",other:"أخرى",type:"النوع",date:"التاريخ",
    darkMode:"الوضع الليلي",lightMode:"الوضع النهاري",currency:"العملة",lang:"اللغة",
    amountError:"أدخل مبلغاً صحيحاً",overError:"المبلغ أكبر من المتبقي!",savedOk:"✅ تم تسجيل الدفعة",expSaved:"✅ تم تسجيل المصروف",
    nextActive:"انتهيت! بدأ دور",settings:"الإعدادات",enableNotif:"تفعيل التنبيهات الشهرية",notifEnabled:"✅ التنبيهات مفعّلة",monthsRemain:"الأشهر المتبقية",
  },
  fr: {
    appName:"Dettes Zerrouki",appSub:"Gestionnaire de dettes",dashboard:"Accueil",debts:"Dettes",expenses:"Dépenses",history:"Historique",contact:"Contact",
    totalDebts:"Total dettes",totalPaid:"Payé",remaining:"Restant",overallProgress:"Progression",paid:"Payé",
    addPayment:"Enregistrer paiement",newExpense:"Nouvelle dépense",amount:"Montant",month:"Mois",year:"Année",note:"Note",notePlaceholder:"Paiement janvier",
    confirmPay:"Confirmer paiement",confirmExp:"Confirmer dépense",payHistory:"Historique paiements",fullHistory:"Historique complet",
    noPayments:"Aucun paiement",noExpenses:"Aucune dépense",todayExpenses:"Dépenses aujourd'hui",thisMonth:"Ce mois",add:"+ Ajouter",
    active:"Actif",waiting:"En attente",completed:"Terminé",monthsLeft:"mois restants",originalAmount:"Montant initial",
    payments:"paiement",contactUs:"Nous contacter",contactDesc:"Contactez le propriétaire via:",callUs:"Appeler",
    food:"Alimentation",veggie:"Légumes & fruits",clothes:"Vêtements",other:"Autre",type:"Type",date:"Date",
    darkMode:"Mode sombre",lightMode:"Mode clair",currency:"Devise",lang:"Langue",
    amountError:"Entrez un montant valide",overError:"Montant trop élevé!",savedOk:"✅ Paiement enregistré",expSaved:"✅ Dépense enregistrée",
    nextActive:"Terminé! Au tour de",settings:"Paramètres",enableNotif:"Activer rappels mensuels",notifEnabled:"✅ Notifications activées",monthsRemain:"Mois restants",
  },
};

const MONTHS_AR=["جانفي","فيفري","مارس","أفريل","ماي","جوان","جويلية","أوت","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_FR=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

const fmtMoney=(amount,cur,lang)=>{
  if(cur==="eur"){const v=(amount*0.0068).toFixed(2);return`${v} €`;}
  const sym=lang==="ar"?"دج":"DA";
  if(amount>=1000000)return`${(amount/1000000).toFixed(1)}م ${sym}`;
  if(amount>=1000)return`${(amount/1000).toFixed(0)}ك ${sym}`;
  return`${amount.toLocaleString()} ${sym}`;
};

const DEBTS0=[
  {id:"faqir",name:"فقير محمد",nameFr:"Faquir Mohamed",icon:"👨",total:35000000,monthly:1000000,color:"#ff6b35",active:true,order:1},
  {id:"moussaoui",name:"موساوي فاطمة",nameFr:"Moussaoui Fatima",icon:"👩",total:26000000,monthly:1000000,color:"#ff4d8d",active:false,order:2},
  {id:"sabria",name:"زروقي صابرية",nameFr:"Zerrouki Sabria",icon:"👩‍🦱",total:5000000,monthly:1000000,color:"#00d4ff",active:false,order:3},
  {id:"tawfiq",name:"زروقي توفيق",nameFr:"Zerrouki Tawfiq",icon:"👨‍🦰",total:5000000,monthly:1000000,color:"#a855f7",active:false,order:4},
];
const CATS=[{id:"food",icon:"🛒",color:"#ff6b35"},{id:"veggie",icon:"🥦",color:"#22c55e"},{id:"clothes",icon:"👗",color:"#ff4d8d"},{id:"other",icon:"📦",color:"#94a3b8"}];

export default function App(){
  const[tab,setTab]=useState("dashboard");
  const[lang,setLang]=useState("ar");
  const[dark,setDark]=useState(true);
  const[cur,setCur]=useState("dzd");
  const[debts,setDebts]=useState(DEBTS0);
  const[pays,setPays]=useState({});
  const[exps,setExps]=useState([]);
  const[loaded,setLoaded]=useState(false);
  const[now,setNow]=useState(new Date());
  const[payMod,setPayMod]=useState(null);
  const[expMod,setExpMod]=useState(false);
  const[setMod,setSetMod]=useState(false);
  const[payF,setPayF]=useState({amount:"",note:"",month:new Date().getMonth()+1,year:new Date().getFullYear()});
  const[expF,setExpF]=useState({cat:"food",amount:"",note:"",date:new Date().toISOString().split("T")[0]});
  const[toast,setToast]=useState(null);
  const[notif,setNotif]=useState(false);
  const t=T[lang];
  const rtl=lang==="ar";
  const MO=lang==="ar"?MONTHS_AR:MONTHS_FR;

  // theme
  const C=dark?{
    bg:"#0f0f0f",bg2:"#141414",card:"#1a1a1a",card2:"rgba(255,255,255,0.04)",
    border:"rgba(255,255,255,0.09)",borderA:"rgba(255,30,30,0.4)",
    hdr:"rgba(10,10,10,0.98)",txt:"#f1f1f1",sub:"#999",mut:"#555",
    acc:"#ff0000",accL:"rgba(255,0,0,0.1)",inp:"rgba(255,255,255,0.07)",
    modal:"#161616",green:"#4ade80",red:"#ff4444",tog:"#ff0000",
  }:{
    bg:"#f5f5f5",bg2:"#efefef",card:"#ffffff",card2:"rgba(0,0,0,0.03)",
    border:"rgba(0,0,0,0.09)",borderA:"rgba(200,0,0,0.3)",
    hdr:"rgba(255,255,255,0.98)",txt:"#111",sub:"#555",mut:"#888",
    acc:"#cc0000",accL:"rgba(200,0,0,0.07)",inp:"rgba(0,0,0,0.06)",
    modal:"#fafafa",green:"#16a34a",red:"#dc2626",tog:"#cc0000",
  };

  const showToast=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);};

  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id);},[]);

  // storage load
  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get(STORAGE_KEY);if(r){const d=JSON.parse(r.value);
        if(d.debts)setDebts(d.debts);if(d.pays)setPays(d.pays);if(d.exps)setExps(d.exps);
        if(d.lang)setLang(d.lang);if(d.dark!==undefined)setDark(d.dark);
        if(d.cur)setCur(d.cur);if(d.notif)setNotif(d.notif);
      }}catch{}setLoaded(true);
    })();
  },[]);

  const save=useCallback(async(data)=>{try{await window.storage.set(STORAGE_KEY,JSON.stringify(data));}catch{}},[]);
  useEffect(()=>{if(loaded)save({debts,pays,exps,lang,dark,cur,notif});},[debts,pays,exps,lang,dark,cur,notif,loaded,save]);

  // notif check on month start
  useEffect(()=>{
    if(!notif)return;
    if(new Date().getDate()===1&&"Notification"in window&&Notification.permission==="granted"){
      new Notification("⏰ "+t.appName,{body:lang==="ar"?"حان موعد دفعة هذا الشهر!":"C'est l'heure du paiement mensuel!"});
    }
  },[notif,t,lang]);

  const getPaid=id=>Object.values(pays[id]||{}).reduce((s,v)=>s+v.amount,0);
  const getRem=id=>Math.max(0,debts.find(d=>d.id===id).total-getPaid(id));
  const getProg=id=>{const d=debts.find(x=>x.id===id);return Math.min(100,(getPaid(id)/d.total)*100);};
  const getPL=id=>Object.entries(pays[id]||{}).sort((a,b)=>b[0].localeCompare(a[0]));

  const tot=debts.reduce((s,d)=>s+d.total,0);
  const totPaid=debts.reduce((s,d)=>s+getPaid(d.id),0);
  const totRem=tot-totPaid;
  const todayStr=new Date().toISOString().split("T")[0];
  const monthStr=new Date().toISOString().slice(0,7);
  const todayExp=exps.filter(e=>e.date===todayStr).reduce((s,e)=>s+e.amount,0);
  const monthExp=exps.filter(e=>e.date?.startsWith(monthStr)).reduce((s,e)=>s+e.amount,0);

  const doPayment=()=>{
    const amt=Number(payF.amount);
    if(!amt||isNaN(amt)){showToast(t.amountError,"err");return;}
    const rem=getRem(payMod.id);if(amt>rem){showToast(t.overError,"err");return;}
    const key=`${payF.year}-${String(payF.month).padStart(2,"0")}`;
    const np={...pays,[payMod.id]:{...(pays[payMod.id]||{}),[key]:{amount:amt,note:payF.note,date:new Date().toISOString()}}};
    setPays(np);
    const np2=Object.values(np[payMod.id]).reduce((s,v)=>s+v.amount,0);
    const debt=debts.find(d=>d.id===payMod.id);
    if(np2>=debt.total){const nx=debts.find(d=>d.order===debt.order+1);if(nx&&!nx.active){setDebts(p=>p.map(d=>d.id===nx.id?{...d,active:true}:d));showToast(`${t.nextActive} ${rtl?nx.name:nx.nameFr}!`);}}
    setPayMod(null);setPayF({amount:"",note:"",month:new Date().getMonth()+1,year:new Date().getFullYear()});showToast(t.savedOk);
  };
  const doExp=()=>{
    if(!expF.amount||isNaN(expF.amount)){showToast(t.amountError,"err");return;}
    setExps(p=>[{id:Date.now(),...expF,amount:Number(expF.amount)},...p]);
    setExpMod(false);setExpF({cat:"food",amount:"",note:"",date:todayStr});showToast(t.expSaved);
  };
  const reqNotif=async()=>{if("Notification"in window){const p=await Notification.requestPermission();if(p==="granted"){setNotif(true);showToast("✅ "+t.notifEnabled);}}};
  const dn=d=>rtl?d.name:d.nameFr;
  const tStr=now.toLocaleTimeString(rtl?"ar-DZ":"fr-DZ",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const dStr=now.toLocaleDateString(rtl?"ar-DZ":"fr-DZ",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  if(!loaded)return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0f0f0f",flexDirection:"column",gap:12}}>
    <div style={{fontSize:48}}>💰</div><div style={{color:"#ff0000",fontFamily:"Cairo",fontWeight:900,fontSize:22}}>{lang==="ar"?"جاري التحميل...":"Chargement..."}</div>
  </div>);

  const inp={width:"100%",background:C.inp,border:`1px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:C.txt,fontFamily:"'Cairo',sans-serif",fontSize:13,outline:"none"};

  return(
  <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Cairo','Amiri',sans-serif",direction:rtl?"rtl":"ltr",color:C.txt,overflowX:"hidden",fontSize:14}}>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:#ff0000;border-radius:2px;}
    .hov:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,0.25);}
    .bs:hover{transform:scale(1.03);} .bs:active{transform:scale(0.97);}
    @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} .fu{animation:fu 0.3s ease forwards;}
    @keyframes sd{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}} .sd{animation:sd 0.28s ease;}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}} .pulse{animation:pulse 2s infinite;}
    .prog{height:6px;border-radius:999px;overflow:hidden;} 
    .ov{position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(12px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .sheet{width:100%;max-width:500px;border-radius:22px 22px 0 0;max-height:92vh;overflow-y:auto;padding:22px 18px 32px;}
    .pill{padding:5px 13px;border-radius:999px;border:none;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:12px;transition:all 0.2s;}
    .cbtn{display:flex;align-items:center;gap:14px;padding:16px;border-radius:16px;border:none;cursor:pointer;font-family:'Cairo',sans-serif;font-weight:700;font-size:14px;transition:all 0.25s;width:100%;margin-bottom:10px;}
    .cbtn:hover{transform:scale(1.02);}
    input[type=date]::-webkit-calendar-picker-indicator{filter:${dark?"invert(0.6)":"invert(0.4)"};}
    select option{background:${C.card};color:${C.txt};}
    .tog-thumb{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left 0.25s;}
  `}</style>

  {/* ─── HEADER ─── */}
  <div style={{background:C.hdr,borderBottom:`1px solid ${C.border}`,padding:"10px 14px",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(24px)"}}>
    <div style={{maxWidth:500,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#ff0000,#cc0000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💰</div>
          <div><div style={{fontSize:15,fontWeight:900,color:C.acc,lineHeight:1.1}}>{t.appName}</div><div style={{fontSize:10,color:C.mut}}>{t.appSub}</div></div>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <button className="bs" onClick={()=>setLang(l=>l==="ar"?"fr":"ar")} style={{border:`1px solid ${C.border}`,background:C.inp,color:C.sub,padding:"5px 9px",borderRadius:9,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:11}}>{lang==="ar"?"FR":"ع"}</button>
          <button className="bs" onClick={()=>setDark(d=>!d)} style={{border:`1px solid ${C.border}`,background:C.inp,color:C.sub,padding:"5px 9px",borderRadius:9,cursor:"pointer",fontSize:14,border:`1px solid ${C.border}`}}>{dark?"☀️":"🌙"}</button>
          <button className="bs" onClick={()=>setSetMod(true)} style={{border:`1px solid ${C.border}`,background:C.inp,color:C.sub,padding:"5px 9px",borderRadius:9,cursor:"pointer",fontSize:14}}>⚙️</button>
        </div>
      </div>
      {/* date/time */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 12px",background:C.inp,borderRadius:10,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.mut,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dStr}</div>
        <div style={{fontSize:13,fontWeight:900,color:C.acc,fontVariantNumeric:"tabular-nums",flexShrink:0,marginRight:rtl?8:0,marginLeft:rtl?0:8}}>{tStr}</div>
      </div>
    </div>
  </div>

  {/* ─── TABS ─── */}
  <div style={{background:C.hdr,borderBottom:`1px solid ${C.border}`,padding:"7px 14px",overflowX:"auto",whiteSpace:"nowrap",WebkitOverflowScrolling:"touch"}}>
    <div style={{maxWidth:500,margin:"0 auto",display:"inline-flex",gap:5}}>
      {[["dashboard","📊",t.dashboard],["debts","💳",t.debts],["expenses","🛒",t.expenses],["history","📋",t.history],["contact","📞",t.contact]].map(([id,ic,lb])=>(
        <button key={id} className="pill" onClick={()=>setTab(id)}
          style={{background:tab===id?"#ff0000":C.card2,color:tab===id?"#fff":C.sub,border:`1px solid ${tab===id?"#ff0000":C.border}`}}>
          {ic} {lb}
        </button>
      ))}
    </div>
  </div>

  {/* ─── CONTENT ─── */}
  <div style={{maxWidth:500,margin:"0 auto",padding:"14px 12px 90px"}}>

  {/* ══ DASHBOARD ══ */}
  {tab==="dashboard"&&<div className="fu">
    {/* Hero */}
    <div style={{background:dark?"linear-gradient(135deg,#1c0000,#280404)":"linear-gradient(135deg,#fff5f5,#ffe4e4)",border:`1px solid ${C.borderA}`,borderRadius:18,padding:"20px 16px",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:11,color:dark?"#ff8888":C.acc,marginBottom:4}}>{t.remaining}</div>
      <div style={{fontSize:30,fontWeight:900,color:C.red,letterSpacing:"-1px",marginBottom:8}}>{fmtMoney(totRem,cur,lang)}</div>
      <div style={{height:7,borderRadius:999,background:dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",overflow:"hidden",marginBottom:6}}>
        <div style={{height:"100%",borderRadius:999,width:`${(totPaid/tot)*100}%`,background:"linear-gradient(90deg,#ff0000,#ff6600)",transition:"width 1.2s"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.mut}}>
        <span>{t.paid}: {fmtMoney(totPaid,cur,lang)}</span>
        <span>{((totPaid/tot)*100).toFixed(1)}%</span>
        <span>{t.totalDebts}: {fmtMoney(tot,cur,lang)}</span>
      </div>
    </div>
    {/* stats */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      {[{l:t.todayExpenses,v:fmtMoney(todayExp,cur,lang),c:"#ff6b35"},{l:t.thisMonth,v:fmtMoney(monthExp,cur,lang),c:"#a855f7"}].map((s,i)=>(
        <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 12px",textAlign:"center"}}>
          <div style={{fontSize:10,color:C.mut,marginBottom:4}}>{s.l}</div>
          <div style={{fontSize:18,fontWeight:900,color:s.c}}>{s.v}</div>
        </div>
      ))}
    </div>
    {/* debt cards */}
    {debts.map(d=>{
      const rem=getRem(d.id);const prog=getProg(d.id);const done=rem===0;const pl=getPL(d.id);
      return(<div key={d.id} className="hov" onClick={()=>{if(d.active&&!done){setPayMod(d);setPayF({amount:String(d.monthly),note:"",month:new Date().getMonth()+1,year:new Date().getFullYear()});}}}
        style={{background:C.card,border:`1px solid ${done?"rgba(74,222,128,0.3)":d.active?"rgba(255,0,0,0.25)":C.border}`,borderRadius:16,padding:14,marginBottom:10,cursor:d.active&&!done?"pointer":"default",transition:"all 0.25s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:42,height:42,borderRadius:12,background:`${d.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,border:`2px solid ${d.color}40`,flexShrink:0}}>{d.icon}</div>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{dn(d)}</div>
              <div style={{fontSize:10,marginTop:2}}>{done?<span style={{color:C.green}}>✅ {t.completed}</span>:d.active?<span className="pulse" style={{color:C.green}}>● {t.active}</span>:<span style={{color:C.mut}}>⏸ {t.waiting}</span>}</div>
            </div>
          </div>
          <div style={{textAlign:rtl?"left":"right",flexShrink:0}}>
            <div style={{fontSize:10,color:C.mut}}>{t.remaining}</div>
            <div style={{fontSize:15,fontWeight:900,color:done?C.green:C.red}}>{fmtMoney(rem,cur,lang)}</div>
          </div>
        </div>
        <div className="prog" style={{background:dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}}>
          <div style={{height:"100%",borderRadius:999,width:`${prog}%`,background:`linear-gradient(90deg,${d.color},${d.color}99)`,transition:"width 1.2s"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.mut}}>
          <span>{fmtMoney(getPaid(d.id),cur,lang)}</span><span>{prog.toFixed(1)}%</span>
        </div>
        {!done&&pl.length>0&&<div style={{marginTop:8,padding:"6px 10px",background:C.card2,borderRadius:8,fontSize:10,display:"flex",justifyContent:"space-between",border:`1px solid ${C.border}`}}>
          <span style={{color:C.mut}}>آخر دفعة</span>
          <span style={{color:d.color,fontWeight:700}}>{fmtMoney(pl[0][1].amount,cur,lang)} — {pl[0][0].replace("-","/")} </span>
        </div>}
        {d.active&&!done&&<div style={{marginTop:10,padding:"9px",background:C.accL,borderRadius:10,textAlign:"center",border:`1px dashed rgba(255,0,0,0.3)`}}>
          <span style={{color:C.acc,fontSize:12,fontWeight:700}}>💸 {t.addPayment}</span>
        </div>}
      </div>);
    })}
    <button className="bs" onClick={()=>setExpMod(true)} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#ff6b35,#ff4500)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:13,marginTop:4}}>
      🛒 + {t.newExpense}
    </button>
  </div>}

  {/* ══ DEBTS ══ */}
  {tab==="debts"&&<div className="fu">
    {debts.map(d=>{
      const paid=getPaid(d.id);const rem=getRem(d.id);const prog=getProg(d.id);const done=rem===0;const months=Math.ceil(rem/d.monthly);
      return(<div key={d.id} style={{background:C.card,border:`1px solid ${done?"rgba(74,222,128,0.3)":d.active?"rgba(255,0,0,0.22)":C.border}`,borderRadius:18,padding:16,marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:50,height:50,borderRadius:16,background:`${d.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,border:`2px solid ${d.color}`,flexShrink:0}}>{d.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:16}}>{dn(d)}</div>
            <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap"}}>
              <span style={{background:`${d.color}20`,color:d.color,padding:"2px 9px",borderRadius:999,fontSize:10,fontWeight:700}}>{done?`✅ ${t.completed}`:d.active?`● ${t.active}`:`⏸ ${t.waiting}`}</span>
              {!done&&<span style={{background:"rgba(239,68,68,0.1)",color:C.red,padding:"2px 9px",borderRadius:999,fontSize:10,fontWeight:700}}>{months} {t.monthsLeft}</span>}
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[{l:t.originalAmount,v:fmtMoney(d.total,cur,lang),c:C.sub},{l:t.totalPaid,v:fmtMoney(paid,cur,lang),c:C.green},{l:t.remaining,v:fmtMoney(rem,cur,lang),c:C.red}].map((s,i)=>(
            <div key={i} style={{background:C.card2,borderRadius:10,padding:"10px 6px",textAlign:"center",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:12,fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{fontSize:9,color:C.mut,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="prog" style={{background:dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}}>
          <div style={{height:"100%",borderRadius:999,width:`${prog}%`,background:`linear-gradient(90deg,${d.color},${d.color}99)`,transition:"width 1.2s"}}/>
        </div>
        <div style={{textAlign:"center",fontSize:11,color:d.color,fontWeight:700,margin:"4px 0 10px"}}>{prog.toFixed(2)}%</div>
        {d.active&&!done&&<button className="bs" onClick={()=>{setPayMod(d);setPayF({amount:String(d.monthly),note:"",month:new Date().getMonth()+1,year:new Date().getFullYear()});}}
          style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${d.color},${d.color}cc)`,color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:13,marginBottom:12}}>
          💸 {t.addPayment}
        </button>}
        {getPL(d.id).length>0&&<>
          <div style={{fontSize:11,color:C.mut,fontWeight:700,marginBottom:6}}>📋 {t.payHistory}</div>
          <div style={{maxHeight:160,overflowY:"auto",display:"grid",gap:5}}>
            {getPL(d.id).map(([k,p])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",background:C.card2,borderRadius:10,border:`1px solid ${C.border}`}}>
                <div><div style={{fontSize:12,fontWeight:700,color:d.color}}>{fmtMoney(p.amount,cur,lang)}</div>{p.note&&<div style={{fontSize:10,color:C.mut}}>{p.note}</div>}</div>
                <div style={{textAlign:rtl?"left":"right",fontSize:10,color:C.mut}}><div>{MO[parseInt(k.split("-")[1])-1]}</div><div>{k.split("-")[0]}</div></div>
              </div>
            ))}
          </div>
        </>}
      </div>);
    })}
  </div>}

  {/* ══ EXPENSES ══ */}
  {tab==="expenses"&&<div className="fu">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div style={{fontWeight:900,fontSize:17}}>🛒 {t.expenses}</div>
      <button className="bs" onClick={()=>setExpMod(true)} style={{padding:"9px 16px",background:"#ff0000",color:"#fff",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:12}}>+ {lang==="ar"?"جديد":"Nouveau"}</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {CATS.map(c=>{const total=exps.filter(e=>e.cat===c.id).reduce((s,e)=>s+e.amount,0);return(
        <div key={c.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px 10px",textAlign:"center"}}>
          <div style={{fontSize:22}}>{c.icon}</div>
          <div style={{fontSize:14,fontWeight:900,color:c.color,marginTop:4}}>{fmtMoney(total,cur,lang)}</div>
          <div style={{fontSize:10,color:C.mut}}>{t[c.id]}</div>
        </div>
      );})}
    </div>
    {!exps.length&&<div style={{textAlign:"center",color:C.mut,padding:40}}>{t.noExpenses}</div>}
    {exps.map(e=>{const c=CATS.find(x=>x.id===e.cat);return(
      <div key={e.id} style={{background:C.card,border:`1px solid ${c.color}25`,borderRadius:14,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:36,height:36,borderRadius:10,background:`${c.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{c.icon}</div>
          <div><div style={{fontSize:12,fontWeight:700}}>{t[c.id]}</div>{e.note&&<div style={{fontSize:10,color:C.mut}}>{e.note}</div>}</div>
        </div>
        <div style={{textAlign:rtl?"left":"right",flexShrink:0}}>
          <div style={{fontSize:14,fontWeight:900,color:c.color}}>{fmtMoney(e.amount,cur,lang)}</div>
          <div style={{fontSize:10,color:C.mut}}>{e.date}</div>
        </div>
      </div>
    );})}
  </div>}

  {/* ══ HISTORY ══ */}
  {tab==="history"&&<div className="fu">
    <div style={{fontWeight:900,fontSize:17,marginBottom:14}}>📋 {t.fullHistory}</div>
    {debts.map(d=>{const pl=getPL(d.id);if(!pl.length)return null;return(
      <div key={d.id} style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <span>{d.icon}</span><span style={{fontWeight:700,color:d.color}}>{dn(d)}</span>
          <span style={{fontSize:10,color:C.mut}}>({pl.length} {t.payments})</span>
        </div>
        {pl.map(([k,p])=>(
          <div key={k} style={{background:C.card,border:`1px solid ${d.color}18`,borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
            <div><div style={{fontWeight:700,color:d.color,fontSize:13}}>{fmtMoney(p.amount,cur,lang)}</div>{p.note&&<div style={{fontSize:10,color:C.mut}}>{p.note}</div>}</div>
            <div style={{textAlign:rtl?"left":"right"}}>
              <div style={{fontSize:11,fontWeight:700,color:C.sub}}>{MO[parseInt(k.split("-")[1])-1]}</div>
              <div style={{fontSize:10,color:C.mut}}>{k.split("-")[0]}</div>
            </div>
          </div>
        ))}
      </div>
    );})}
    {debts.every(d=>!getPL(d.id).length)&&<div style={{textAlign:"center",color:C.mut,padding:40}}>{t.noPayments}</div>}
  </div>}

  {/* ══ CONTACT ══ */}
  {tab==="contact"&&<div className="fu">
    <div style={{background:dark?"linear-gradient(135deg,#1c0000,#280404)":"linear-gradient(135deg,#fff5f5,#fce8e8)",border:`1px solid ${C.borderA}`,borderRadius:18,padding:"20px 16px",textAlign:"center",marginBottom:16}}>
      <div style={{fontSize:36,marginBottom:8}}>💰</div>
      <div style={{fontSize:17,fontWeight:900,color:C.acc,marginBottom:4}}>{t.appName}</div>
      <div style={{fontSize:12,color:C.mut}}>{t.contactDesc}</div>
    </div>
    {[
      {href:`https://wa.me/${PHONE.replace("+","")}`,bg:"linear-gradient(135deg,#25D366,#128C7E)",icon:"💬",name:"WhatsApp",info:PHONE},
      {href:`https://t.me/${PHONE.replace("+","")}`,bg:"linear-gradient(135deg,#0088cc,#006ba3)",icon:"✈️",name:"Telegram",info:PHONE},
      {href:"https://facebook.com",bg:"linear-gradient(135deg,#1877F2,#0c5ed4)",icon:"📘",name:"Facebook",info:"Zerrouki"},
      {href:`tel:${PHONE}`,bg:`linear-gradient(135deg,${C.acc},#cc0000)`,icon:"📞",name:t.callUs,info:PHONE},
    ].map((b,i)=>(
      <a key={i} href={b.href} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}>
        <button className="cbtn" style={{background:b.bg,color:"#fff",direction:rtl?"rtl":"ltr"}}>
          <span style={{fontSize:26,flexShrink:0}}>{b.icon}</span>
          <div style={{textAlign:rtl?"right":"left"}}><div style={{fontWeight:900}}>{b.name}</div><div style={{fontSize:11,opacity:0.85}}>{b.info}</div></div>
        </button>
      </a>
    ))}
  </div>}

  </div>{/* end content */}

  {/* ─── BOTTOM NAV ─── */}
  <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.hdr,borderTop:`1px solid ${C.border}`,padding:"7px 0 max(8px,env(safe-area-inset-bottom))",backdropFilter:"blur(20px)",zIndex:99}}>
    <div style={{display:"flex",justifyContent:"space-around",maxWidth:500,margin:"0 auto"}}>
      {[["dashboard","📊",t.dashboard],["debts","💳",t.debts],["expenses","🛒",t.expenses],["history","📋",t.history],["contact","📞",t.contact]].map(([id,ic,lb])=>(
        <button key={id} className="bs" onClick={()=>setTab(id)}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"4px 10px",background:"transparent",border:"none",cursor:"pointer",color:tab===id?"#ff0000":C.mut,fontFamily:"Cairo",fontWeight:700,fontSize:9,transition:"all 0.2s"}}>
          <span style={{fontSize:tab===id?22:18,transition:"font-size 0.2s"}}>{ic}</span>{lb}
        </button>
      ))}
    </div>
  </div>

  {/* ─── PAY MODAL ─── */}
  {payMod&&<div className="ov" onClick={e=>{if(e.target===e.currentTarget)setPayMod(null);}}>
    <div className="sheet sd" style={{background:C.modal,border:`1px solid ${C.border}`}}>
      <div style={{width:38,height:4,background:C.border,borderRadius:999,margin:"0 auto 18px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div><div style={{fontWeight:900,fontSize:16}}>💸 {t.addPayment}</div><div style={{fontSize:11,color:payMod.color,marginTop:2}}>{dn(payMod)} — {t.remaining}: {fmtMoney(getRem(payMod.id),cur,lang)}</div></div>
        <button onClick={()=>setPayMod(null)} style={{background:C.inp,border:`1px solid ${C.border}`,color:C.mut,padding:"5px 11px",borderRadius:9,cursor:"pointer",fontSize:15}}>✕</button>
      </div>
      <div style={{display:"grid",gap:11}}>
        <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.amount}</label><input style={inp} type="number" value={payF.amount} onChange={e=>setPayF(p=>({...p,amount:e.target.value}))} placeholder="1000000"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.month}</label><select style={inp} value={payF.month} onChange={e=>setPayF(p=>({...p,month:Number(e.target.value)}))}>{MO.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select></div>
          <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.year}</label><select style={inp} value={payF.year} onChange={e=>setPayF(p=>({...p,year:Number(e.target.value)}))}>{[2026,2027,2028,2029,2030].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
        </div>
        <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.note}</label><input style={inp} value={payF.note} onChange={e=>setPayF(p=>({...p,note:e.target.value}))} placeholder={t.notePlaceholder}/></div>
        <button className="bs" onClick={doPayment} style={{padding:"13px",background:`linear-gradient(135deg,${payMod.color},${payMod.color}cc)`,color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:14,marginTop:4}}>✅ {t.confirmPay}</button>
      </div>
    </div>
  </div>}

  {/* ─── EXPENSE MODAL ─── */}
  {expMod&&<div className="ov" onClick={e=>{if(e.target===e.currentTarget)setExpMod(false);}}>
    <div className="sheet sd" style={{background:C.modal,border:`1px solid ${C.border}`}}>
      <div style={{width:38,height:4,background:C.border,borderRadius:999,margin:"0 auto 18px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:900,fontSize:16}}>🛒 {t.newExpense}</div>
        <button onClick={()=>setExpMod(false)} style={{background:C.inp,border:`1px solid ${C.border}`,color:C.mut,padding:"5px 11px",borderRadius:9,cursor:"pointer",fontSize:15}}>✕</button>
      </div>
      <div style={{display:"grid",gap:11}}>
        <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:8}}>{t.type}</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {CATS.map(c=><button key={c.id} className="bs" onClick={()=>setExpF(p=>({...p,cat:c.id}))}
              style={{padding:"10px",background:expF.cat===c.id?`${c.color}20`:C.inp,border:`1px solid ${expF.cat===c.id?c.color:C.border}`,color:expF.cat===c.id?c.color:C.sub,borderRadius:12,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:12}}>
              {c.icon} {t[c.id]}
            </button>)}
          </div>
        </div>
        <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.amount}</label><input style={inp} type="number" value={expF.amount} onChange={e=>setExpF(p=>({...p,amount:e.target.value}))} placeholder="500000"/></div>
        <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.date}</label><input style={inp} type="date" value={expF.date} onChange={e=>setExpF(p=>({...p,date:e.target.value}))}/></div>
        <div><label style={{fontSize:11,color:C.mut,display:"block",marginBottom:5}}>{t.note}</label><input style={inp} value={expF.note} onChange={e=>setExpF(p=>({...p,note:e.target.value}))} placeholder={lang==="ar"?"مثال: خضر من السوق":"Ex: légumes du marché"}/></div>
        <button className="bs" onClick={doExp} style={{padding:"13px",background:"linear-gradient(135deg,#ff6b35,#ff4500)",color:"#fff",border:"none",borderRadius:14,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:14}}>✅ {t.confirmExp}</button>
      </div>
    </div>
  </div>}

  {/* ─── SETTINGS MODAL ─── */}
  {setMod&&<div className="ov" onClick={e=>{if(e.target===e.currentTarget)setSetMod(false);}}>
    <div className="sheet sd" style={{background:C.modal,border:`1px solid ${C.border}`}}>
      <div style={{width:38,height:4,background:C.border,borderRadius:999,margin:"0 auto 18px"}}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div style={{fontWeight:900,fontSize:16}}>⚙️ {t.settings}</div>
        <button onClick={()=>setSetMod(false)} style={{background:C.inp,border:`1px solid ${C.border}`,color:C.mut,padding:"5px 11px",borderRadius:9,cursor:"pointer",fontSize:15}}>✕</button>
      </div>
      {/* Dark toggle */}
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:20}}>{dark?"🌙":"☀️"}</span>
          <div><div style={{fontWeight:700,fontSize:13}}>{dark?t.darkMode:t.lightMode}</div><div style={{fontSize:10,color:C.mut}}>Mode</div></div>
        </div>
        <div onClick={()=>setDark(d=>!d)} style={{width:48,height:26,borderRadius:999,background:dark?C.acc:"#ccc",position:"relative",cursor:"pointer",transition:"background 0.3s"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:dark?24:4,transition:"left 0.25s"}}/>
        </div>
      </div>
      {/* Language */}
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🌍 {t.lang}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["ar","عربي 🇩🇿"],["fr","Français 🇫🇷"]].map(([l,lb])=>(
            <button key={l} className="bs" onClick={()=>setLang(l)} style={{padding:"10px",background:lang===l?"#ff0000":C.inp,color:lang===l?"#fff":C.sub,border:`1px solid ${lang===l?"#ff0000":C.border}`,borderRadius:12,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:12}}>{lb}</button>
          ))}
        </div>
      </div>
      {/* Currency */}
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px",marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>💱 {t.currency}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["dzd","🇩🇿 دينار"],["eur","🇪🇺 يورو"]].map(([c,lb])=>(
            <button key={c} className="bs" onClick={()=>setCur(c)} style={{padding:"10px",background:cur===c?"#ff6b35":C.inp,color:cur===c?"#fff":C.sub,border:`1px solid ${cur===c?"#ff6b35":C.border}`,borderRadius:12,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:13}}>{lb}</button>
          ))}
        </div>
      </div>
      {/* Notifications */}
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>🔔 {t.enableNotif}</div>
        {notif?<div style={{color:C.green,fontWeight:700,fontSize:12}}>{t.notifEnabled}</div>:
        <button className="bs" onClick={reqNotif} style={{width:"100%",padding:"11px",background:"rgba(251,191,36,0.1)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.3)",borderRadius:12,cursor:"pointer",fontFamily:"Cairo",fontWeight:700,fontSize:12}}>🔔 {t.enableNotif}</button>}
      </div>
    </div>
  </div>}

  {/* ─── TOAST ─── */}
  {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:toast.type==="err"?"rgba(220,38,38,0.96)":"rgba(22,163,74,0.96)",borderRadius:14,padding:"12px 22px",color:"#fff",fontWeight:700,fontSize:13,backdropFilter:"blur(10px)",zIndex:400,whiteSpace:"nowrap",boxShadow:"0 8px 30px rgba(0,0,0,0.4)"}} className="sd">{toast.msg}</div>}

  </div>);
}
