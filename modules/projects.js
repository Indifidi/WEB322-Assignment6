const projectData = require("../data/projectData");
const sectorData = require("../data/sectorData");

let projects = [];

function Initialize() {

    return new Promise((resolve, reject) => {
        try {
            
            projectData.forEach((project) => {
                const sectorFind = sectorData.find((sector) => sector.id === project.sector_id);         

                const newProject = {
                    ...project,
                    sector_name: sectorFind ? sectorFind.sector_name : "Unknown Sector",
                };

                projects.push(newProject);
            });
            resolve();
            resolve("Initialize projects....");
        } catch (error) {
            console.error("Error initialization", error);
            reject;
        }

    });
}

function getAllProjects() {
    return new Promise((resolve, reject) => {
        try {
            if (projects.length === 0) {
                throw new Error("No projects available.");
            }
            resolve(projects);
        } catch (error) {
            reject("No projects available.");
        }
    });
}

function getProjectsById(projectId) {
  return new Promise((resolve, reject) => {
    try {
      const projectRes = projects.find((project) => project.id === projectId);

      if (!projectRes) {
        throw new Error(`unable to find requested project`);
      }

      resolve(projectRes);
    } catch (error) {
      reject("unable to find requested project");
    }
  });
}

function getProjectsBySector(sector) {
    return new Promise((resolve, reject) => {
        try {
            const projectsBySector = projects.filter((project) =>
                project.sector_name.toLowerCase().includes(sector.toLowerCase())
            );

            if (projectsBySector.length === 0) {
                throw new Error(`unable to find requested sectoss`);
            }
            resolve(projectsBySector);
        } catch (error) {
            reject(`unable to find requested sectors`);
        }
    });
}

module.exports = {
    Initialize,
    getAllProjects,
    getProjectsById,
    getProjectsBySector
}
