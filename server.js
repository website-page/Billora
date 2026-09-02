const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const DATA_FILE = path.join(__dirname, 'billora-data.json');

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return { users: [], invoices: [], expenses: [] };
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { users: [], invoices: [], expenses: [] }; }
}
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function id(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function tokenFor(user) { return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' }); }
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Session expired. Please log in again.' }); }
}
function publicUser(u) { return { id:u.id,name:u.name,email:u.email,businessName:u.businessName,plan:u.plan,createdAt:u.createdAt }; }

app.get('/api/health', (req,res)=>res.json({ok:true,app:'Billora',version:'2.0.0'}));

app.post('/api/auth/register', async (req,res)=>{
  const {name,email,password,businessName}=req.body||{};
  if(!name||!email||!password)return res.status(400).json({message:'Name, email and password are required.'});
  if(String(password).length<6)return res.status(400).json({message:'Password must be at least 6 characters.'});
  const data=loadData(), normalized=String(email).trim().toLowerCase();
  if(data.users.some(u=>u.email===normalized))return res.status(409).json({message:'An account with that email already exists.'});
  const user={id:id('usr'),name:String(name).trim(),email:normalized,businessName:String(businessName||`${name}'s Business`).trim(),password:await bcrypt.hash(password,10),plan:'free',createdAt:new Date().toISOString()};
  data.users.push(user);saveData(data);res.status(201).json({token:tokenFor(user),user:publicUser(user)});
});

app.post('/api/auth/login',async(req,res)=>{
  const {email,password}=req.body||{},data=loadData();
  const user=data.users.find(u=>u.email===String(email||'').trim().toLowerCase());
  if(!user||!(await bcrypt.compare(password||'',user.password)))return res.status(401).json({message:'Invalid email or password.'});
  res.json({token:tokenFor(user),user:publicUser(user)});
});

app.get('/api/me',auth,(req,res)=>{const user=loadData().users.find(u=>u.id===req.user.id);if(!user)return res.status(404).json({message:'User not found.'});res.json(publicUser(user));});

app.get('/api/dashboard',auth,(req,res)=>{
  const data=loadData(), invoices=data.invoices.filter(x=>x.userId===req.user.id), expenses=data.expenses.filter(x=>x.userId===req.user.id);
  const revenue=invoices.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.total||0),0),pending=invoices.filter(x=>x.status!=='paid').reduce((s,x)=>s+Number(x.total||0),0),costs=expenses.reduce((s,x)=>s+Number(x.amount||0),0);
  const monthly=Array.from({length:7},(_,i)=>({label:new Date(Date.now()-((6-i)*86400000)).toLocaleDateString('en-NG',{weekday:'short'}),revenue:0,expense:0}));
  invoices.forEach(x=>{const d=new Date(x.createdAt);const idx=Math.round((Date.now()-new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime())/86400000);if(idx>=0&&idx<7&&x.status==='paid')monthly[6-idx].revenue+=Number(x.total||0);});
  expenses.forEach(x=>{const d=new Date(x.createdAt);const idx=Math.round((Date.now()-new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime())/86400000);if(idx>=0&&idx<7)monthly[6-idx].expense+=Number(x.amount||0);});
  res.json({revenue,pending,expenses:costs,profit:revenue-costs,invoiceCount:invoices.length,invoices:invoices.slice(-8).reverse(),series:monthly});
});

app.get('/api/invoices',auth,(req,res)=>res.json(loadData().invoices.filter(x=>x.userId===req.user.id).reverse()));
app.post('/api/invoices',auth,(req,res)=>{
  const {customerName,customerEmail,items,dueDate,notes}=req.body||{};
  if(!customerName||!Array.isArray(items)||!items.length)return res.status(400).json({message:'Customer and at least one item are required.'});
  const cleanItems=items.map(i=>({description:String(i.description||'Item').trim(),quantity:Math.max(1,Number(i.quantity)||1),price:Math.max(0,Number(i.price)||0)}));
  if(cleanItems.some(i=>!i.description||i.price<=0))return res.status(400).json({message:'Each item needs a description and price.'});
  const subtotal=cleanItems.reduce((s,i)=>s+i.quantity*i.price,0), invoice={id:id('inv'),userId:req.user.id,number:`INV-${String(Date.now()).slice(-7)}`,customerName:String(customerName).trim(),customerEmail:String(customerEmail||'').trim(),items:cleanItems,subtotal,total:subtotal,status:'unpaid',dueDate:dueDate||'',notes:String(notes||''),createdAt:new Date().toISOString()};
  const data=loadData();data.invoices.push(invoice);saveData(data);res.status(201).json(invoice);
});
app.patch('/api/invoices/:id',auth,(req,res)=>{const data=loadData(),invoice=data.invoices.find(x=>x.id===req.params.id&&x.userId===req.user.id);if(!invoice)return res.status(404).json({message:'Invoice not found.'});if(req.body.status&&['paid','unpaid','overdue'].includes(req.body.status))invoice.status=req.body.status;saveData(data);res.json(invoice);});
app.get('/api/expenses',auth,(req,res)=>res.json(loadData().expenses.filter(x=>x.userId===req.user.id).reverse()));
app.post('/api/expenses',auth,(req,res)=>{const {title,amount,category}=req.body||{};if(!title||!Number(amount))return res.status(400).json({message:'Expense title and amount are required.'});const data=loadData(),expense={id:id('exp'),userId:req.user.id,title:String(title).trim(),amount:Number(amount),category:String(category||'General'),createdAt:new Date().toISOString()};data.expenses.push(expense);saveData(data);res.status(201).json(expense);});

app.post('/api/payments/subscribe',auth,async(req,res)=>{
  const secret=process.env.FLW_SECRET_KEY;if(!secret)return res.status(503).json({message:'Flutterwave is not configured yet. Add FLW_SECRET_KEY to the server environment.'});
  const amount=4500,data=loadData(),user=data.users.find(u=>u.id===req.user.id),tx_ref=`BILLORA-${user.id}-${Date.now()}`;
  try{const response=await fetch('https://api.flutterwave.com/v3/payments',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({tx_ref,amount,currency:'NGN',redirect_url:`${APP_URL}/?payment=complete&tx_ref=${encodeURIComponent(tx_ref)}`,payment_options:'card,banktransfer,ussd',customer:{email:user.email,name:user.name},customizations:{title:'Billora Pro',description:'Billora monthly Pro subscription'}})});const result=await response.json();if(!response.ok||result.status!=='success')return res.status(502).json({message:result.message||'Unable to start payment.'});res.json({link:result.data.link,tx_ref});}catch{res.status(502).json({message:'Flutterwave could not be reached right now.'});}
});
app.get('/api/payments/verify/:txRef',auth,async(req,res)=>{
  const secret=process.env.FLW_SECRET_KEY;if(!secret)return res.status(503).json({message:'Flutterwave is not configured.'});
  try{const r=await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(req.params.txRef)}`,{headers:{Authorization:`Bearer ${secret}`}}),result=await r.json(),paid=result.status==='success'&&result.data?.status==='successful'&&result.data?.currency==='NGN'&&Number(result.data?.amount)>=4500;if(paid){const data=loadData(),user=data.users.find(x=>x.id===req.user.id);user.plan='pro';user.planActivatedAt=new Date().toISOString();saveData(data);}res.json({verified:paid,user:publicUser(loadData().users.find(x=>x.id===req.user.id))});}catch{res.status(502).json({message:'Could not verify payment.'});}
});

require('./phase2')(app,{auth,loadData,saveData,id,publicUser});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`Billora running on ${APP_URL}`));
