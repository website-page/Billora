const fs=require('fs'),path=require('path');

const DATA_FILE=path.join(__dirname,'billora-data.json');
const empty=()=>({users:[],invoices:[],expenses:[],members:[],recurring:[],paymentEvents:[]});

function loadJson(){
  if(!fs.existsSync(DATA_FILE))return empty();
  try{return {...empty(),...JSON.parse(fs.readFileSync(DATA_FILE,'utf8'))}}
  catch{return empty()}
}

function saveJson(d){
  fs.writeFileSync(DATA_FILE,JSON.stringify(d,null,2));
}

async function initDb(){
  if(!fs.existsSync(DATA_FILE))saveJson(empty());
}

async function getUser(id){return loadJson().users.find(x=>x.id===id)}
async function getUserByEmail(e){return loadJson().users.find(x=>x.email===e)}

async function createUser(u){const d=loadJson();d.users.push(u);saveJson(d);return u}

async function updateUser(u){
  const d=loadJson(),i=d.users.findIndex(x=>x.id===u.id);
  if(i>=0)d.users[i]=u;
  saveJson(d);
  return u;
}

async function list(table,userId){return loadJson()[table].filter(x=>x.userId===userId).reverse()}

async function addInvoice(x){const d=loadJson();d.invoices.push(x);saveJson(d);return x}

async function updateInvoice(id,userId,status){
  const d=loadJson(),x=d.invoices.find(a=>a.id===id&&a.userId===userId);
  if(x)x.status=status;
  saveJson(d);
  return x;
}

async function addExpense(x){const d=loadJson();d.expenses.push(x);saveJson(d);return x}

async function addMember(x){const d=loadJson();d.members.push(x);saveJson(d);return x}

async function updateMember(id,status){
  const d=loadJson(),x=d.members.find(a=>a.id===id);
  if(x)x.status=status;
  saveJson(d);
  return x;
}

async function addRecurring(x){const d=loadJson();d.recurring.push(x);saveJson(d);return x}
async function getRecurring(u){return list('recurring',u)}

async function addPaymentEvent(id,p){
  const d=loadJson();
  if(d.paymentEvents.some(x=>x.id===id))return false;
  d.paymentEvents.push({id,payload:p,createdAt:new Date().toISOString()});
  saveJson(d);
  return true;
}

async function dashboard(u){
  const inv=await list('invoices',u),exp=await list('expenses',u);
  const revenue=inv.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.total),0);
  const pending=inv.filter(x=>x.status!=='paid').reduce((s,x)=>s+Number(x.total),0);
  const costs=exp.reduce((s,x)=>s+Number(x.amount),0);
  return{revenue,pending,expenses:costs,profit:revenue-costs,invoiceCount:inv.length,invoices:inv.slice(0,8),series:series(inv)};
}

function series(inv){
  const days=[...Array(7)].map((_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(6-i));
    return{date:d,label:d.toLocaleDateString('en-US',{weekday:'short'}),revenue:0};
  });
  inv.filter(x=>x.status==='paid').forEach(x=>{
    const d=days.find(a=>new Date(a.date).toDateString()===new Date(x.createdAt).toDateString());
    if(d)d.revenue+=Number(x.total);
  });
  return days.map(({label,revenue})=>({label,revenue}));
}

async function analytics(u){
  const inv=await list('invoices',u),exp=await list('expenses',u);
  const months=[...Array(6)].map((_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-(5-i),1);
    return{month:d.toLocaleDateString('en-US',{month:'short'}),year:d.getFullYear(),revenue:0,expenses:0};
  });
  inv.filter(x=>x.status==='paid').forEach(x=>{
    const d=new Date(x.createdAt),m=months.find(a=>a.month===d.toLocaleDateString('en-US',{month:'short'})&&a.year===d.getFullYear());
    if(m)m.revenue+=Number(x.total);
  });
  exp.forEach(x=>{
    const d=new Date(x.createdAt),m=months.find(a=>a.month===d.toLocaleDateString('en-US',{month:'short'})&&a.year===d.getFullYear());
    if(m)m.expenses+=Number(x.amount);
  });
  const map={};
  inv.forEach(x=>{const k=x.customerEmail||x.customerName;map[k]=(map[k]||{name:x.customerName,total:0});map[k].total+=Number(x.total)});
  return{months,counts:{paid:inv.filter(x=>x.status==='paid').length,unpaid:inv.filter(x=>x.status==='unpaid').length,overdue:inv.filter(x=>x.status==='overdue').length},topCustomers:Object.values(map).sort((a,b)=>b.total-a.total).slice(0,5)};
}

module.exports={usePg:false,pool:null,initDb,loadJson,saveJson,getUser,getUserByEmail,createUser,updateUser,list,addInvoice,updateInvoice,addExpense,addMember,updateMember,addRecurring,getRecurring,addPaymentEvent,dashboard,analytics};