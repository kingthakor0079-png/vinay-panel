const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// ===================== MONGODB CONNECT =====================
const MONGO_URL = process.env.MONGO_URL || "";

mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("MongoDB Error:", err));

// ===================== MODELS =====================
const AdminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const BlacklistSchema = new mongoose.Schema({
  uid: String,
  name: String,
  reason: String,
  date: String,
  addedBy: String
});

const Admin = mongoose.model("Admin", AdminSchema);
const Blacklist = mongoose.model("Blacklist", BlacklistSchema);

// ===================== MIDDLEWARE =====================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "vinay_secret_key_2026",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 6 }
  })
);

function isAuth(req, res, next) {
  if (req.session.user) return next();
  return res.redirect("/");
}

// ===================== CREATE DEFAULT ADMIN =====================
async function createDefaultAdmin() {
  const adminExists = await Admin.findOne({ username: "admin" });
  if (!adminExists) {
    await Admin.create({ username: "admin", password: "admin123" });
    console.log("Default Admin Created: admin / admin123");
  }
}
createDefaultAdmin();

// ===================== LOGIN PAGE =====================
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/panel");

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Vinay Panel - Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body{
      margin:0;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg,#0f172a,#1e293b,#0f172a);
      height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      color:white;
    }
    .box{
      width:95%;
      max-width:400px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 25px;
      backdrop-filter: blur(14px);
      box-shadow: 0px 0px 30px rgba(0,0,0,0.55);
    }
    h2{
      text-align:center;
      font-size:30px;
      margin-bottom:10px;
      color:#38bdf8;
    }
    p{
      text-align:center;
      font-size:13px;
      opacity:0.85;
      margin-bottom:22px;
    }
    input{
      width:100%;
      padding:13px;
      border:none;
      outline:none;
      border-radius:14px;
      margin-bottom:12px;
      font-size:15px;
      background: rgba(255,255,255,0.1);
      color:white;
      border: 1px solid rgba(255,255,255,0.15);
    }
    input::placeholder{
      color:rgba(255,255,255,0.6);
    }
    button{
      width:100%;
      padding:13px;
      border-radius:16px;
      border: 2px solid #38bdf8;
      background: transparent;
      color:#38bdf8;
      font-size:16px;
      cursor:pointer;
      transition:0.2s;
      font-weight:bold;
      letter-spacing:0.5px;
    }
    button:hover{
      background:#38bdf8;
      color:black;
      transform:scale(1.03);
      box-shadow: 0px 0px 18px rgba(56,189,248,0.8);
    }
    button:active{
      transform:scale(0.95);
    }
    .footer{
      margin-top:18px;
      text-align:center;
      font-size:12px;
      opacity:0.75;
    }
    .error{
      background: rgba(255,0,0,0.15);
      border: 1px solid rgba(255,0,0,0.4);
      padding: 10px;
      border-radius: 14px;
      margin-bottom: 12px;
      display:none;
      font-size:13px;
    }
  </style>
</head>
<body>

<div class="box">
  <h2>Vinay Panel</h2>
  <p>Login to access blacklist management system</p>

  <div class="error" id="errBox"></div>

  <input id="username" placeholder="Username">
  <input id="password" placeholder="Password" type="password">

  <button onclick="login()">LOGIN</button>

  <div class="footer">
    Default Login: <b>admin / admin123</b>
  </div>
</div>

<script>
async function login(){
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errBox = document.getElementById("errBox");

  errBox.style.display="none";

  if(!username || !password){
    errBox.style.display="block";
    errBox.innerText="Please enter username and password!";
    return;
  }

  const res = await fetch("/api/login",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({username,password})
  });

  const data = await res.json();

  if(data.success){
    window.location.href="/panel";
  } else {
    errBox.style.display="block";
    errBox.innerText=data.message;
  }
}
</script>

</body>
</html>
  `);
});

// ===================== PANEL PAGE =====================
app.get("/panel", isAuth, (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Vinay Panel</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body{
      margin:0;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg,#020617,#0f172a,#020617);
      color:white;
      min-height:100vh;
    }
    header{
      padding:18px;
      text-align:center;
      font-size:24px;
      font-weight:bold;
      background: rgba(255,255,255,0.05);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      color:#38bdf8;
    }
    .container{
      padding:18px;
      max-width:1100px;
      margin:auto;
    }
    .topbar{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      justify-content:space-between;
      align-items:center;
      margin-bottom:15px;
    }
    .btn{
      padding:10px 14px;
      border-radius:16px;
      border:2px solid #38bdf8;
      background: transparent;
      color:#38bdf8;
      cursor:pointer;
      font-weight:bold;
      transition:0.2s;
    }
    .btn:hover{
      background:#38bdf8;
      color:black;
      transform:scale(1.03);
      box-shadow: 0px 0px 15px rgba(56,189,248,0.7);
    }
    .btn:active{
      transform:scale(0.95);
    }
    .card{
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      padding:16px;
      border-radius:20px;
      margin-bottom:15px;
      box-shadow: 0px 0px 25px rgba(0,0,0,0.4);
    }
    input, textarea{
      width:100%;
      padding:12px;
      border-radius:14px;
      border:none;
      outline:none;
      margin-bottom:10px;
      background: rgba(255,255,255,0.08);
      color:white;
      border: 1px solid rgba(255,255,255,0.15);
      font-size:14px;
    }
    textarea{
      min-height:70px;
      resize:none;
    }
    table{
      width:100%;
      border-collapse: collapse;
      overflow:hidden;
      border-radius:14px;
    }
    th, td{
      padding:10px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      font-size:13px;
      text-align:left;
    }
    th{
      color:#38bdf8;
      font-size:14px;
    }
    .removeBtn{
      padding:6px 10px;
      border-radius:14px;
      border:2px solid rgba(255,0,0,0.6);
      background: transparent;
      color: rgba(255,0,0,0.9);
      cursor:pointer;
      font-weight:bold;
      transition:0.2s;
    }
    .removeBtn:hover{
      background: rgba(255,0,0,0.9);
      color:black;
      transform:scale(1.05);
      box-shadow: 0px 0px 12px rgba(255,0,0,0.6);
    }
    .removeBtn:active{
      transform:scale(0.95);
    }
    .search{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
    }
    .search input{
      flex:1;
    }
    .info{
      opacity:0.85;
      font-size:13px;
    }
    .tag{
      padding:5px 10px;
      border-radius:14px;
      background: rgba(56,189,248,0.15);
      border:1px solid rgba(56,189,248,0.35);
      color:#38bdf8;
      font-size:12px;
      display:inline-block;
    }
  </style>
</head>
<body>

<header>Vinay Blacklist Panel</header>

<div class="container">

  <div class="topbar">
    <div class="info">
      Logged in as: <span class="tag">${req.session.user}</span>
    </div>
    <button class="btn" onclick="logout()">LOGOUT</button>
  </div>

  <div class="card">
    <h3 style="margin-top:0;color:#38bdf8;">Add Player to Blacklist</h3>
    <input id="uid" placeholder="Player UID">
    <input id="name" placeholder="Player Name">
    <textarea id="reason" placeholder="Reason / Proof details"></textarea>
    <button class="btn" onclick="addBlacklist()">ADD TO BLACKLIST</button>
  </div>

  <div class="card">
    <h3 style="margin-top:0;color:#38bdf8;">Search Blacklist</h3>
    <div class="search">
      <input id="search" placeholder="Search UID or Name">
      <button class="btn" onclick="loadList()">SEARCH</button>
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top:0;color:#38bdf8;">Blacklist Data</h3>
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>UID</th>
            <th>Name</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Added By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  </div>

</div>

<script>
async function loadList(){
  const search = document.getElementById("search").value.trim();
  const res = await fetch("/api/blacklist?search=" + encodeURIComponent(search));
  const data = await res.json();

  const body = document.getElementById("tableBody");
  body.innerHTML = "";

  if(data.length === 0){
    body.innerHTML = "<tr><td colspan='6' style='text-align:center;opacity:0.7;'>No data found</td></tr>";
    return;
  }

  data.forEach(item=>{
    const tr = document.createElement("tr");
    tr.innerHTML = \`
      <td>\${item.uid}</td>
      <td>\${item.name}</td>
      <td>\${item.reason}</td>
      <td>\${item.date}</td>
      <td>\${item.addedBy}</td>
      <td><button class="removeBtn" onclick="removeUID('\${item.uid}')">REMOVE</button></td>
    \`;
    body.appendChild(tr);
  });
}

async function addBlacklist(){
  const uid = document.getElementById("uid").value.trim();
  const name = document.getElementById("name").value.trim();
  const reason = document.getElementById("reason").value.trim();

  if(!uid || !name || !reason){
    alert("Fill all fields!");
    return;
  }

  const res = await fetch("/api/blacklist/add",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({uid,name,reason})
  });

  const data = await res.json();

  if(data.success){
    alert("Added Successfully!");
    document.getElementById("uid").value="";
    document.getElementById("name").value="";
    document.getElementById("reason").value="";
    loadList();
  } else {
    alert(data.message);
  }
}

async function removeUID(uid){
  if(!confirm("Remove UID " + uid + " from blacklist?")) return;

  const res = await fetch("/api/blacklist/remove",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({uid})
  });

  const data = await res.json();
  if(data.success){
    alert("Removed Successfully!");
    loadList();
  } else {
    alert(data.message);
  }
}

async function logout(){
  await fetch("/api/logout");
  window.location.href="/";
}

loadList();
</script>

</body>
</html>
  `);
});

// ===================== API =====================

// Login API
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const found = await Admin.findOne({ username, password });

  if (!found) return res.json({ success: false, message: "Wrong login!" });

  req.session.user = username;
  res.json({ success: true });
});

// Logout API
app.get("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Get Blacklist
app.get("/api/blacklist", isAuth, async (req, res) => {
  const search = (req.query.search || "").toLowerCase();

  let data = await Blacklist.find().sort({ _id: -1 });

  if (search) {
    data = data.filter(
      (item) =>
        item.uid.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search)
    );
  }

  res.json(data);
});

// Add Blacklist
app.post("/api/blacklist/add", isAuth, async (req, res) => {
  const { uid, name, reason } = req.body;

  if (!uid || !name || !reason) {
    return res.json({ success: false, message: "All fields required!" });
  }

  const exists = await Blacklist.findOne({ uid });

  if (exists) {
    return res.json({ success: false, message: "UID already exists!" });
  }

  await Blacklist.create({
    uid,
    name,
    reason,
    date: new Date().toLocaleString(),
    addedBy: req.session.user,
  });

  res.json({ success: true });
});

// Remove Blacklist
app.post("/api/blacklist/remove", isAuth, async (req, res) => {
  const { uid } = req.body;

  const deleted = await Blacklist.deleteOne({ uid });

  if (deleted.deletedCount === 0) {
    return res.json({ success: false, message: "UID not found!" });
  }

  res.json({ success: true });
});

// ===================== START SERVER =====================
app.listen(PORT, () => {
  console.log("Vinay Panel Running on Port:", PORT);
});
