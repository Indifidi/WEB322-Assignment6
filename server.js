/********************************************************************************
*  WEB322 – Assignment 04
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Daniel Kim Student ID: 100118231 Date: July 6, 2025
*
*  Published URL: https://web-322-assignment4-gold.vercel.app/
*
********************************************************************************/


const express = require("express");
const path = require("path");
const cors = require("cors");
const projectData = require("./modules/projects");

//create express app
const app = express();
const port = process.env.PORT || 3000;

//setting up the server
//set view engine to ejs
app.set("view engine", "ejs");
//set views directory
app.set("views", path.join(__dirname, "views"));


//middleware
app.use(cors()); //allow cross-origin requests
app.use(express.json()); //parse JSON bodies
app.use(express.urlencoded({ extended: true })); //parse URL-encoded bodies forms

//serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

//initialize projects
projectData
    .Initialize()
    .then(() => {
        console.log("Projects initialized successfully.");
    })
    .catch((error) => {
        console.error("Error initializing projects:");
    });

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
app.get("/solutions/addProject", (req, res) => {
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
app.post("/solutions/addProject", (req, res) => {
    projectData
        .addProject(req.body)
        .then(() => {
            res.redirect("/solutions/projects");
        })
        .catch((error) => {
            res.render("500", { message: `I'm sorry, but we have encountered the following error: ${error}` });
        });
});

//404 page 
app.use((req, res) => {
    res.status(404).render("404", { message: "No view matched for a specific route." });
});

//start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


