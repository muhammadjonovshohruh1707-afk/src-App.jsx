import { useState, useRef, useEffect } from "react";

const USERS = {
  rektor:    { id:"rektor",    name:"Rektor Alimov A.",      role:"rektor",    icon:"👑", color:"#a78bfa", dept:"Rektorat" },
  pr1:       { id:"pr1",       name:"Prorektor Karimov J.",  role:"prorektor", icon:"👨‍💼", color:"#60a5fa", dept:"O'quv ishlari", masuls:["m1","m2"] },
  pr2:       { id:"pr2",       name:"Prorektor Yusupova M.", role:"prorektor", icon:"👩‍💼", color:"#c084fc", dept:"Moliya",         masuls:["m3","m4"] },
  pr3:       { id:"pr3",       name:"Prorektor Toshev B.",   role:"prorektor", icon:"👨‍💼", color:"#38bdf8", dept:"Xo'jalik",       masuls:["m5"] },
  pr4:       { id:"pr4",       name:"Prorektor Rahimova S.", role:"prorektor", icon:"👩‍💼", color:"#818cf8", dept:"Kadrlar",        masuls:["m6"] },
  m1: { id:"m1", name:"Nazarov O.",  role:"masul", color:"#7dd3fc", dept:"O'quv bo'limi",     under:"pr1" },
  m2: { id:"m2", name:"Holiqov S.",  role:"masul", color:"#7dd3fc", dept:"Talabalar bo'limi", under:"pr1" },
  m3: { id:"m3", name:"Mirzaeva D.", role:"masul", color:"#d8b4fe", dept:"Buxgalteriya",      under:"pr2" },
  m4: { id:"m4", name:"Ergashev T.", role:"masul", color:"#d8b4fe", dept:"Grant bo'limi",     under:"pr2" },
  m5: { id:"m5", name:"Xasanov F.",  role:"masul", color:"#7dd3fc", dept:"Ta'mirlash",        under:"pr3" },
  m6: { id:"m6", name:"Saidova G.",  role:"masul", color:"#a5b4fc", dept:"HR bo'limi",        under:"pr4" },
  devonxona: { id:"devonxona", name:"Devonxona", role:"devonxona", icon:"🏛️", color:"#94a3b8", dept:"Devonxona" },
};

const today = new Date(); today.setHours(0,0,0,0);
const isoD = (d) => new Date(d).toISOString().slice(0,10);
const addD = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const fmtD = (d) => d ? new Date(d).toLocaleDateString("uz-UZ",{day:"2-digit",month:"2-digit",year:"numeric"}) : "";

function dlSt(dl) {
  if(!dl) return null;
  const d=new Date(dl); d.setHours(0,0,0,0);
  const diff=Math.round((d-today)/86400000);
  if(diff<0)   return {label:`⚠️ ${Math.abs(diff)} kun kechikdi`, color:"#f87171", bg:"rgba(248,113,113,0.12)", urgent:true};
  if(diff===0) return {label:"🔴 Bugun oxirgi!",                  color:"#f87171", bg:"rgba(248,113,113,0.12)", urgent:true};
  if(diff===1) return {label:"🟠 Ertaga!",                        color:"#fb923c", bg:"rgba(251,146,60,0.12)",  urgent:true};
  if(diff<=3)  return {label:`🟡 ${diff} kun qoldi`,              color:"#fbbf24", bg:"rgba(251,191,36,0.12)",  urgent:false};
  return             {label:`🟢 ${diff} kun qoldi`,               color:"#34d399", bg:"rgba(52,211,153,0.12)", urgent:false};
}

function calcKPI(docs, uid) {
  const u = USERS[uid];
  let myDocs = !u ? docs :
    u.role==="masul"     ? docs.filter(d=>d.assignedTo===uid) :
    u.role==="prorektor" ? docs.filter(d=>d.assignedPr===uid) : docs;
  const total=myDocs.length, done=myDocs.filter(d=>d.status==="yakunlandi").length;
  const late=myDocs.filter(d=>{if(d.status==="yakunlandi")return false;const s=dlSt(d.deadline);return s&&s.urgent&&new Date(d.deadline)<today;}).length;
  const inprog=myDocs.filter(d=>["masulda","imzoda","tahlil"].includes(d.status)).length;
  return {total, done, late, inprog, pct: total>0 ? Math.round(done/total*100) : 0};
}

function Ring({pct, size=56, color="#60a5fa"}) {
  const r=22, circ=2*Math.PI*r, dash=circ*(pct/100);
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" style={{flexShrink:0}}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 28 28)"
        style={{filter:`drop-shadow(0 0 6px ${color}88)`}}/>
      <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

const SYS = `Sen O'zbekiston universiteti hujjat yo'naltirish AI asistisin. Faqat JSON qaytargin:
{"xulosa":"...","masul":"Nazarov O.|Holiqov S.|Mirzaeva D.|Ergashev T.|Xasanov F.|Saidova G.","masul_id":"m1|m2|m3|m4|m5|m6","prorektor_id":"pr1|pr2|pr3|pr4","sabab":"...","muhimlik":"yuqori|o'rta|past","deadline_kun":3,"javob_xati":"To'liq rasmiy javob 5-6 gap"}
Nazarov(m1)/Holiqov(m2)=pr1. Mirzaeva(m3)/Ergashev(m4)=pr2. Xasanov(m5)=pr3. Saidova(m6)=pr4.`;

const STAFF = {"Nazarov O.":"O'quv bo'limi","Holiqov S.":"Talabalar bo'limi","Mirzaeva D.":"Buxgalteriya","Ergashev T.":"Grant bo'limi","Xasanov F.":"Ta'mirlash","Saidova G.":"HR bo'limi"};
const MUH = {yuqori:"#f87171","o'rta":"#fbbf24",past:"#34d399"};
const ST = {
  yangi:      {label:"Yangi",           color:"#60a5fa", bg:"rgba(96,165,250,0.15)"},
  tahlil:     {label:"AI tahlil",       color:"#fbbf24", bg:"rgba(251,191,36,0.15)"},
  masulda:    {label:"Mas'ulda",        color:"#34d399", bg:"rgba(52,211,153,0.15)"},
  imzoda:     {label:"Imzo kutilmoqda", color:"#c084fc", bg:"rgba(192,132,252,0.15)"},
  yakunlandi: {label:"✅ Yakunlandi",   color:"#34d399", bg:"rgba(52,211,153,0.15)"},
};

const T = isoD(today);
const DEMO = [
  {id:1,title:"Laboratoriya jihozlari ta'miri",from:"Kimyo kafedrasi",date:T,deadline:isoD(today),status:"masulda",assignedTo:"m5",assignedPr:"pr3",content:"Distillator buzilgan, 15 mln so'm zarur.",fileType:"text",fileData:null,fileName:null,ai:{xulosa:"Jihozni ta'mirlash kerak",masul:"Xasanov F.",masul_id:"m5",prorektor_id:"pr3",sabab:"Xo'jalik bo'limi jihoz masalasini hal qiladi",muhimlik:"yuqori",javob_xati:"Hurmatli murojaat egasi,\n\nSizning murojaatingiz ko'rib chiqildi. Laboratoriya jihozini ta'mirlash bo'yicha Xo'jalik bo'limi tezkor chora ko'radi.\n\nHurmat bilan,\nUniversitet ma'muriyati"},javob:null,isbot:null,activity:["🏛️ Devonxona yukladi","🤖 AI tahlil qildi","✅ Prorektor tasdiqladi","📤 Mas'ulga yuborildi"]},
  {id:2,title:"Yangi o'qituvchilar ish haqi",from:"Kadrlar bo'limi",date:T,deadline:isoD(addD(today,5)),status:"tahlil",assignedTo:null,assignedPr:"pr4",content:"12 nafar yangi o'qituvchi ish haqini belgilash zarur.",fileType:"text",fileData:null,fileName:null,ai:{xulosa:"Ish haqi belgilash",masul:"Saidova G.",masul_id:"m6",prorektor_id:"pr4",sabab:"Kadrlar bo'limi xodimlar masalasini hal qiladi",muhimlik:"o'rta",javob_xati:"Hurmatli murojaat egasi,\n\nYangi o'qituvchilarning ish haqi masalasi ko'rib chiqilmoqda.\n\nHurmat bilan,\nUniversitet ma'muriyati"},javob:null,isbot:null,activity:["🏛️ Devonxona yukladi","🤖 AI tahlil qildi"]},
  {id:3,title:"Stipendiya to'lovlari",from:"Moliya bo'limi",date:T,deadline:isoD(addD(today,2)),status:"yakunlandi",assignedTo:"m3",assignedPr:"pr2",content:"Bahor semestri stipendiya to'lovlari.",fileType:"text",fileData:null,fileName:null,ai:{xulosa:"Stipendiya to'lovi",masul:"Mirzaeva D.",masul_id:"m3",prorektor_id:"pr2",sabab:"Buxgalteriya moliyaviy masalalarni hal qiladi",muhimlik:"yuqori",javob_xati:"Stipendiya to'lovlari amalga oshirildi."},javob:"Stipendiya to'lovlari amalga oshirildi.",isbot:{file:"to'lov_cheki.pdf",preview:null,type:"file"},activity:["🏛️ Devonxona yukladi","🤖 AI tahlil qildi","✅ Prorektor tasdiqladi","📤 Mas'ulga yuborildi","📝 Javob yuborildi","🖊️ Imzolandi","✅ Yakunlandi"]},
  {id:4,title:"Talaba shikoyati — imtihon",from:"Talabalar kengashi",date:T,deadline:isoD(addD(today,-1)),status:"imzoda",assignedTo:"m2",assignedPr:"pr1",content:"Sotvoldiev A. imtihon natijasiga e'tiroz.",fileType:"text",fileData:null,fileName:null,ai:{xulosa:"Talaba shikoyati ko'rib chiqilsin",masul:"Holiqov S.",masul_id:"m2",prorektor_id:"pr1",sabab:"Talabalar bo'limi talabalar masalasini hal qiladi",muhimlik:"o'rta",javob_xati:"Hurmatli talaba,\n\nSizning murojaatingiz ko'rib chiqildi va adolatli baholash ta'minlanadi.\n\nHurmat bilan"},javob:"Shikoyat ko'rib chiqildi, qayta baholash o'tkaziladi.",isbot:null,activity:["🏛️ Devonxona yukladi","🤖 AI tahlil qildi","✅ Prorektor tasdiqladi","📤 Mas'ulga yuborildi","📝 Javob yuborildi","⏳ Imzo kutilmoqda"]},
];

function MiniCal({deadline, onChange}) {
  const [m, setM] = useState(() => { const d=deadline?new Date(deadline):new Date(); return new Date(d.getFullYear(),d.getMonth(),1); });
  const yr=m.getFullYear(), mn=m.getMonth();
  const first=(new Date(yr,mn,1).getDay()+6)%7;
  const cells=Array(first).fill(null);
  for(let i=1;i<=new Date(yr,mn+1,0).getDate();i++) cells.push(i);
  const selT = deadline ? new Date(new Date(deadline).toDateString()).getTime() : null;
  return (
    <div style={{padding:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <button onClick={()=>setM(new Date(yr,mn-1,1))} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"#a5b4fc",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:16}}>‹</button>
        <span style={{fontSize:12,color:"#c7d2fe",fontWeight:600}}>{m.toLocaleDateString("uz-UZ",{month:"long",year:"numeric"})}</span>
        <button onClick={()=>setM(new Date(yr,mn+1,1))} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"#a5b4fc",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:16}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
        {["Du","Se","Ch","Pa","Ju","Sh","Ya"].map(d=><div key={d} style={{fontSize:9,color:"rgba(255,255,255,0.3)",textAlign:"center"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((day,i) => {
          if(!day) return <div key={i}/>;
          const date=new Date(yr,mn,day); date.setHours(0,0,0,0);
          const isPast=date<today, isSel=selT===date.getTime(), isTod=date.getTime()===today.getTime();
          return (
            <button key={i} onClick={()=>!isPast&&onChange(isoD(date))}
              style={{background:isSel?"linear-gradient(135deg,#60a5fa,#a78bfa)":isTod?"rgba(96,165,250,0.2)":"transparent",color:isPast?"rgba(255,255,255,0.15)":isSel?"white":isTod?"#60a5fa":"rgba(255,255,255,0.7)",border:"none",borderRadius:6,padding:"5px 0",fontSize:11,cursor:isPast?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:isSel?"700":"400"}}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 768;
    return w >= 1024 ? "desktop" : w >= 640 ? "tablet" : "mobile";
  });
  useEffect(() => {
    const fn = () => { const w=window.innerWidth; setBp(w>=1024?"desktop":w>=640?"tablet":"mobile"); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return bp;
}

// Glass card style
const glass = (extra={}) => ({
  background:"rgba(255,255,255,0.07)",
  backdropFilter:"blur(20px)",
  WebkitBackdropFilter:"blur(20px)",
  border:"1px solid rgba(255,255,255,0.12)",
  borderRadius:18,
  ...extra
});

export default function App() {
  const [uid,      setUid]      = useState(null);
  const [docs,     setDocs]     = useState(DEMO);
  const [sel,      setSel]      = useState(null);
  const [view,     setView]     = useState("list");
  const [loading,  setLoading]  = useState(false);
  const [editJ,    setEditJ]    = useState(false);
  const [javob,    setJavob]    = useState("");
  const [chat,     setChat]     = useState([]);
  const [chatIn,   setChatIn]   = useState("");
  const [chatL,    setChatL]    = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({title:"",from:"",content:""});
  const [fData,    setFData]    = useState(null);
  const [fType,    setFType]    = useState(null);
  const [fName,    setFName]    = useState(null);
  const [showIsbot,setShowIsbot]= useState(false);
  const [iFile,    setIFile]    = useState(null);
  const [iPrev,    setIPrev]    = useState(null);
  const [iType,    setIType]    = useState(null);
  const [showCal,  setShowCal]  = useState(false);
  const [notif,    setNotif]    = useState(null);
  const fRef=useRef(), iRef=useRef(), nid=useRef(5);
  const bp=useBreakpoint();
  const isMobile=bp==="mobile", isTablet=bp==="tablet", isDesktop=bp==="desktop";
  const user=uid?USERS[uid]:null, role=user?.role, doc=docs.find(d=>d.id===sel);
  const pad = isDesktop?28:18;
  const sidebar = isDesktop?300:isTablet?260:0;

  useEffect(()=>{
    if(!uid) return;
    const n=docs.filter(d=>d.status!=="yakunlandi"&&dlSt(d.deadline)?.urgent).length;
    if(n>0) setNotif(`🔔 ${n} ta hujjat muddati tugash arafasida!`);
  },[docs,uid]);

  const readFile=(file)=>{
    if(!file) return; setFName(file.name);
    const r=new FileReader();
    if(file.type==="application/pdf"){r.onload=e=>{setFData(e.target.result.split(",")[1]);setFType("pdf");};r.readAsDataURL(file);}
    else if(file.type.startsWith("image/")){r.onload=e=>{setFData(e.target.result.split(",")[1]);setFType(file.type);};r.readAsDataURL(file);}
    else setFType("text");
  };
  const readIsbot=(file)=>{
    if(!file) return; setIFile(file);
    if(file.type.startsWith("image/")){const r=new FileReader();r.onload=e=>{setIPrev(e.target.result);setIType("image");};r.readAsDataURL(file);}
    else setIType("file");
  };

  const visibleDocs=docs.filter(d=>{
    if(role==="devonxona") return true;
    if(role==="rektor")    return true;
    if(role==="prorektor") return d.assignedPr===uid||(d.status==="tahlil"&&!d.assignedPr);
    if(role==="masul")     return d.assignedTo===uid;
    return false;
  });

  const addDoc=()=>{
    if(!form.title.trim()) return;
    const d={id:nid.current++,title:form.title,from:form.from||"Noma'lum",date:T,deadline:isoD(addD(today,5)),status:"yangi",assignedTo:null,assignedPr:null,content:form.content,fileType:fType,fileData:fData,fileName:fName,ai:null,javob:null,isbot:null,activity:["🏛️ Devonxona yukladi"]};
    setDocs(p=>[d,...p]);setForm({title:"",from:"",content:""});setFData(null);setFType(null);setFName(null);setShowForm(false);setSel(d.id);setView("detail");
  };

  const analyze=async(d)=>{
    setLoading(true);
    try{
      let msgs;
      if(d.fileData&&(d.fileType==="pdf"||d.fileType?.startsWith("image")))
        msgs=[{role:"user",content:[d.fileType==="pdf"?{type:"document",source:{type:"base64",media_type:"application/pdf",data:d.fileData}}:{type:"image",source:{type:"base64",media_type:d.fileType,data:d.fileData}},{type:"text",text:`Hujjat: ${d.title}\nKimdan: ${d.from}`}]}];
      else msgs=[{role:"user",content:`Hujjat: ${d.title}\nKimdan: ${d.from}\nMazmunan: ${d.content}`}];
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,system:SYS,messages:msgs})});
      const data=await res.json();
      const ai=JSON.parse(data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim()||"{}");
      const dl=isoD(addD(today,ai.deadline_kun||5));
      setDocs(p=>p.map(x=>x.id===d.id?{...x,status:"tahlil",ai,deadline:dl,assignedPr:ai.prorektor_id,activity:[...(x.activity||[]),"🤖 AI tahlil qildi"]}:x));
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const prApprove=(id)=>setDocs(p=>p.map(d=>d.id===id?{...d,status:"masulda",assignedTo:d.ai?.masul_id,activity:[...(d.activity||[]),`✅ ${user.name} tasdiqladi`,"📤 Mas'ulga yuborildi"]}:d));
  const masulSend=(id)=>{setDocs(p=>p.map(d=>d.id===id?{...d,status:"imzoda",javob:javob||d.ai?.javob_xati,activity:[...(d.activity||[]),"📝 Javob yuborildi","⏳ Imzo kutilmoqda"]}:d));setEditJ(false);setChat([]);};
  const submitI=(id)=>{setDocs(p=>p.map(d=>d.id===id?{...d,isbot:{file:iFile?.name,preview:iPrev,type:iType}}:d));setShowIsbot(false);setIFile(null);setIPrev(null);};
  const prSign=(id)=>setDocs(p=>p.map(d=>d.id===id?{...d,status:"yakunlandi",activity:[...(d.activity||[]),"🖊️ Imzolandi","✅ Devonxonaga yuborildi"]}:d));
  const updateDl=(id,dl)=>{setDocs(p=>p.map(d=>d.id===id?{...d,deadline:dl}:d));setShowCal(false);};
  const aiEdit=async(d)=>{
    if(!chatIn.trim()||chatL) return;
    const msg=chatIn;setChatIn("");setChatL(true);setChat(p=>[...p,{r:"u",t:msg}]);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`Hozirgi javob xati:\n\n${javob}\n\nFaqat yangilangan xat matnini qaytargin.`,messages:[...chat.map(m=>({role:m.r==="u"?"user":"assistant",content:m.t})),{role:"user",content:msg}]})});
      const data=await res.json();
      const t=data.content?.map(b=>b.text||"").join("").trim();
      if(t)setJavob(t);
      setChat(p=>[...p,{r:"a",t:"✅ Yangilandi!"}]);
    }catch{setChat(p=>[...p,{r:"a",t:"Xato."}]);}
    setChatL(false);
  };

  // ── ANALYTICS ──
  const Analytics=()=>{
    const prs=["pr1","pr2","pr3","pr4"].map(id=>USERS[id]);
    const masls=["m1","m2","m3","m4","m5","m6"].map(id=>USERS[id]);
    const gKPI=calcKPI(docs,"rektor");
    const showPrs=role==="rektor";
    const showMasls=role==="rektor"?masls:(user?.masuls||[]).map(id=>USERS[id]);
    return (
      <div style={{padding:pad,overflowY:"auto",flex:1}}>
        {/* Umumiy */}
        <div style={{...glass(),padding:20,marginBottom:16}}>
          <div style={S.ct}>📊 UMUMIY STATISTIKA</div>
          <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <Ring pct={gKPI.pct} size={isDesktop?72:60} color="#a78bfa"/>
            <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(4,1fr)":"repeat(2,1fr)",gap:10,flex:1,minWidth:200}}>
              {[{l:"Jami",v:docs.length,c:"#c7d2fe"},{l:"Bajarildi",v:docs.filter(d=>d.status==="yakunlandi").length,c:"#34d399"},{l:"Jarayonda",v:docs.filter(d=>["masulda","imzoda","tahlil"].includes(d.status)).length,c:"#fbbf24"},{l:"Kechikdi",v:gKPI.late,c:"#f87171"}].map(s=>(
                <div key={s.l} style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"10px 14px",border:"1px solid rgba(255,255,255,0.08)"}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showPrs&&<>
          <div style={{...S.ct,marginBottom:10}}>👨‍💼 PROREKTORLAR KPI</div>
          <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(2,1fr)":"1fr",gap:10,marginBottom:16}}>
            {prs.map(pr=>{
              const k=calcKPI(docs,pr.id);
              return (
                <div key={pr.id} style={{...glass(),padding:16,borderColor:`${pr.color}30`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <Ring pct={k.pct} size={50} color={pr.color}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#f1f5f9"}}>{pr.name}</div>
                      <div style={{fontSize:11,color:pr.color,marginBottom:6}}>{pr.dept}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:11,color:"#34d399"}}>✅ {k.done}/{k.total}</span>
                        {k.late>0&&<span style={{fontSize:11,color:"#f87171"}}>⚠️ {k.late}</span>}
                        {k.inprog>0&&<span style={{fontSize:11,color:"#fbbf24"}}>⏳ {k.inprog}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>}

        <div style={{...S.ct,marginBottom:10}}>👤 {role==="rektor"?"MAS'ULLAR KPI":"BO'LIM XODIMLARI"}</div>
        <div style={{display:"grid",gridTemplateColumns:isDesktop?"repeat(3,1fr)":isTablet?"repeat(2,1fr)":"1fr",gap:10
