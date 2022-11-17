const express = require("express");
const app = express();
const session = require("express-session");
//const MongoStore = require("connect-mongo");
//const advanceOptions = {useNewUrlParser:true, useUnifiedTopology: true};
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const  User  = require("./models/User");
const bcrypt = require("bcrypt");
require("dotenv").config(".env");
const process = require("process");

const  { fork } = require("child_process");
const cluster = require("cluster");
const os = require("os");

const parse = require("yargs/yargs");


const serverInfo = {
    arguments: process.argv.slice(2),
    os: process.env.os,
    node_version: process.versions.node,
    memory_usage: process.memoryUsage().rss,
    exec_path: process.execPath,
    process_id: process.pid,
    current_working_directory: process.cwd(),
};

mongoose.connect(
        process.env.MONGO_URL
    )
    .then(() => console.log("DB CONECTADA"))
    .catch((err) => console.log(err));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use("/log", express.static(__dirname + "/views"));
app.use("/registerHome", express.static(__dirname + "/views"));
app.use("/home", express.static(__dirname + "/views"));
app.use("/login-error", express.static(__dirname + "/views"));



//SESSION
app.use(session({
    secret:  process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 60000 * 10 //DIEZ MINUTOS SESION
    }
}));
//SESSION

//PASSPORT
app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new LocalStrategy((username, password, done) => {     
      User.findOne({ username }, (err, user) => {
        if (err) console.log(err);
        if (!user) return done(null, false);
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) console.log(err);
            if (isMatch) return done(null, user);
            return done(null, false);
        });
      });
    })
);

passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser( async function(id, done){    
    const user = await User.findById(id);
    done(null, user);
});
//PASSPORT


//YARGS
/*
const args = yargs.argv; 
const PORT = process.env.PORT || 8080;
*/
const numPC = os.cpus().length;
const yargs = parse(process.argv.slice(2));

const {port, mode} = yargs	
    .boolean("debug")
    .alias({
        p: "port"
    })
	.default({        
		port: 8081,		
    }
    ).argv;

const PORT = port;
//YARGS
if (mode === "cluster" && cluster.isPrimary) {
    clusterMode();
}else {
    const routerRandom = require("./routes/random_r.js");
    //EJERCICIO RANDOM
    app.use("/api/randoms", routerRandom);
    //EJERCICIO RANDOM
}

function clusterMode() {
	console.log(`NUM PC'S: ${numPC}`);
	console.log(`PID MASTER ${process.pid}`);

	
    for (let i = 0; i < numPC; i++) {
		cluster.fork();
	}
     
    //cluster.fork();
	cluster.on("exit", (worker) => {
		console.log("Worker", worker.process.pid, "died", new Date().toLocaleString());
		cluster.fork();
	});

	return false;
}

app.post("/register", (req, res) => {
    const {username, password , direccion} = req.body;    
    User.findOne({username}, async (err, user) => {
        if (err) return console.log(err);
        if (user) {
            return res.json({obj: user, status: "ok"}) 
        }
        if (!user) {//USUARIO INDEFINIDO
            const hashedPass = await bcrypt.hash(password, 10);
            const newUser = new User({
                username,
                password:hashedPass,
                direccion
            })
            await newUser.save();
            res.json({obj: newUser, status: "ok"});
        }               
    });
});

app.post("/login",passport.authenticate("local", { failureRedirect: "login-error" }), (req, res) => {
    const {username, password} = req.body;
    User.findOne({username}, (err, user) => {
        if (err) console.log(err)
        if(!user) {            
            return res.json({status: '0', message: "Datos incorrectos"})
        }
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) console.log(err);
            if (isMatch) {
                if (req.session.contador) {
                    req.session.contador++;            
                }else {
                    req.session.contador = 1;            
                }                
                req.session.user = user.username;
                req.session.admin = true;                
                res.json({status: '1', message: "Bienvenido "+user.username});
            } 
        });
    });
});

app.get("/login",passport.authenticate("local", { failureRedirect: "log" }),
    (req, res) => {
      res.redirect("/home");
    }
);
  
app.get("/home", async (req, res) => {    
    if (req.user){
        const datosUsuario = await User.findById(req.user._id);
        res.sendFile('./views/home.html', {root: __dirname, datosUsuario:datosUsuario});        
    }else {
        res.sendFile("./views/login-error.html", {root: __dirname});
    }
});

app.post("/getCookies", (req, res) => {
    res.json(req.session);
});

app.get("/log", (req, res) => { 
    res.sendFile('./views/login.html', {root: __dirname});
});

app.get("/con-session", (req, res) => {
    if (req.session.contador){
        req.session.contador++;
        res.send("Visitó el sitio "+ req.session.contador+ " veces");
    }else {
        req.session.contador = 1;
        res.send("Bienvenido");
    }
});

app.get("/registerHome", (req, res) => {   
    res.sendFile('./views/register.html', {root: __dirname});
});

app.get("/login-error", (req, res) => {   
    res.sendFile('./views/login-error.html', {root: __dirname});
});

app.get("/privado", auth, (req, res) => {
    res.send("Ok modo privado");
});

app.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err){
            return res.send({status: "0", message: err});
        }
    });
    //res.send({status: "1", message: "Hasta Luego "})
    res.redirect("/log");
});

app.get("/logout2", (req, res) => {
    const user = req.session.user;
    req.session.destroy(err => {
        if (!err) res.json({status: "1", message: "Hasta Luego "+ user})
        else res.json({status: "0", message: err}) 
    });
});

app.get("/info", (req, res) => {
    res.json(serverInfo);
});
  

function auth(req, res, next){
    if(req.session?.user === "Facu" && req.session?.admin){
        return next();
    }
    return res.status(401).send("Error de autenticacion");
}

const server = app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${server.address().port}`);
});
