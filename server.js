/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Daniel Kim Student ID: 100118231 Date: July 19, 2025
*
*  Published URL: 
*
********************************************************************************/

const express = require("express");
const path = require("path");
const cors = require("cors");
const projectData = require("./modules/projects");
const authData = require ("./modules/auth-service");
const clientSessions = require ("client-sessions");

//create express app
const app = express();
const port = process.env.HTTP_PORT || 3000;

//setting up the server
//set view engine to ejs
app.set("view engine", "ejs");
//set views directory
app.set("views", path.join(__dirname, "views"));


//middleware
app.use(cors()); //allow cross-origin requests
app.use(express.json()); //parse JSON bodies
app.use(express.urlencoded({ extended: true })); //parse URL-encoded bodies forms
app.use(clientSessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    duration: 10 * 60 * 1000, // 10 minutes
    activeDuration: 1000 * 60, // 1 minute
    cookie: {
        ephemeral: false,       // delete cookie when browser closes?
        httpOnly: true,         // restrict access from JavaScript
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        maxAge: 30 * 60 * 1000  // how long the cookie stays valid
  }
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

//helper middleware to ensure user is logged in
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

//serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

//routes
//home page
app.get("/", (request, response) => {
    response.render("home");
});

//about page
app.get("/about", (request, response) => {
    response.render("about");
});

//projects page
app.get("/solutions/projects/", (req, res) => {
    if (!req.query.sector) {
        res.render("projects", { projects: [] });
        return;
    }
    const projectSector = req.query.sector;

    projectData
        .getProjectsBySector(projectSector)
        .then((projects) => {
            res.render("projects", { projects: projects });
        })
        .catch((error) => {
            res.status(404).render("404", { message: "No projects found for the specified sector." });

        });
});

//project page
app.get("/solutions/projects/:id", (req, res) => {
    const projectId = req.params.id; 

    projectData
        .getProjectsById(parseInt(projectId, 10))
        .then((project) => {
            res.render("project", { project: project });
        })
        .catch((error) => {
            res.status(404).render("404", { message: "The requested project could not be found." });
        });
});

//add project page
app.get("/solutions/addProject", ensureLogin, (req, res) => {
    projectData
        .getAllSectors()
        .then((sectorData) => {
            res.render("addProject", { sectors: sectorData });
        })
        .catch((error) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
        });
});

//add project form submission
app.post("/solutions/addProject", ensureLogin, (req, res) => {
    projectData
        .addProject(req.body)
        .then(() => {
            res.redirect("/solutions/projects");
        })
        .catch((error) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
        });
});

//edit project page
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
    const projectId = req.params.id;
    
    Promise.all([
        projectData.getProjectsById(parseInt(projectId, 10)),
        projectData.getAllSectors()
    ])
    .then(([project, sectorData]) => {
        res.render("editProject", { sectors: sectorData, project: project });
    })
    .catch((err) => {
        res.status(404).render("404", { message: err.message });
    });
});

//edit project form submission
app.post("/solutions/editProject", ensureLogin, (req, res) => {
    projectData
        .editProject(req.body.id, req.body)
        .then(() => {
            res.redirect("/solutions/projects");
        })
        .catch((error) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
        });
});

//delete project
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
    const projectId = req.params.id;
    projectData
        .deleteProject(parseInt(projectId, 10))
        .then(() => {
            res.redirect("/solutions/projects");
        })
        .catch((err) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

app.get("/login", (req, res) => {
    res.render("login", { errorMessage: "", userName: "", page: "/login" });
});

app.get("/register", (req, res) => {
    res.render("register", { errorMessage: "", successMessage: "", userName: "", page: "/register" });
});

//register form submission

app.post("/register", (req, res) => {

    authData.registerUser(req.body)
        .then(() => {
            res.render("register", { errorMessage: "", successMessage: "User created", userName: "", page: "/register" });
        })
        .catch((err) => {
            res.render("register", { errorMessage: err, successMessage: "", userName: req.body.userName, page: "/register" });
        });
});

//login form submission
app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/solutions/projects');
        })
        .catch((err) => {
            res.render("login", { errorMessage: err, userName: req.body.userName, page: "/login" });
        });
});

//logout route
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect('/');
});

//user history page (protected route)
app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", { loginHistory: req.session.user.loginHistory, page: "/userHistory" });
});

//user history page (protected route)
app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", { loginHistory: req.session.user.loginHistory, page: "/userHistory" });
});

//404 page 
app.use((req, res) => {
    res.status(404).render("404", { message: "No view matched for a specific route." });
});

//start the server
projectData.initialize()
.then(authData.initialize)
.then(function(){
    app.listen(port, function(){
        console.log(`app listening on:  http://localhost:${port}`);
    });
}).catch(function(err){
    console.log(`unable to start server: ${err}`);
});



