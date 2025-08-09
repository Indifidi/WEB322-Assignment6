require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');



let sequelize = new Sequelize(
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD,
    {
        host: process.env.PGHOST,
        dialect: 'postgres',
        dialectOptions: {
            ssl: { rejectUnauthorized: false }
        }
    }
);

const Sector = sequelize.define('Sector', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    sector_name: Sequelize.STRING
}, {
    timestamps: false
});


const Project = sequelize.define('Project', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: Sequelize.STRING,
    feature_img_url: Sequelize.STRING,
    summary_short: Sequelize.TEXT,
    intro_short: Sequelize.TEXT,
    impact: Sequelize.TEXT,
    original_source_url: Sequelize.STRING,
    sector_id: Sequelize.INTEGER
}, {
    timestamps: false
});

Project.belongsTo(Sector, { foreignKey: 'sector_id' });

function initialize() {
    return sequelize.sync()
        .then(() => {
            console.log("Database connected successfully.");
            return Promise.resolve("Sequelize sync successful.");
        })
        .catch((error) => {
            console.error("Database connection failed:");
            return Promise.reject(error);
        });
}

function getAllProjects() {
    return Project.findAll({
        include: [Sector]
    });
}

function getProjectsById(projectId) {
    return Project.findAll({
        where: { id: projectId },
        include: [Sector]
    })
    .then((projects) => {
        if (!projects || projects.length === 0) {
            throw new Error("Unable to find requested project");
        }
        return projects[0];
    });
}

function getProjectsBySector(sector) {
    return Project.findAll({
        include: [Sector],
        where: {
            '$Sector.sector_name$': {
                [Sequelize.Op.iLike]: `%${sector}%`
            }
        }
    })
    .then((projects) => {
        if (!projects || projects.length === 0) {
            throw new Error("Unable to find requested projects");
        }
        return projects;
    });
}

function getAllSectors (){
    return Sector.findAll();
}

function addProject(projectData) {
    return Project.create(projectData)
        .then(() => {
            return Promise.resolve();
        })
        .catch((err) => {
            throw new Error(err.errors[0].message);
        });
}

function editProject(projectId, projectData) {
    return Project.update(projectData, {
        where: { id: projectId }
    })
    .then(() => {
        return Promise.resolve();
    })
    .catch((err) => {
        throw new Error(err.errors[0].message);
    });
}

function deleteProject (projectId) {
    return Project.destroy({
        where: { id: projectId }
    })
    .then(() => {
        return Promise.resolve();
    })
    .catch((err) => {
        throw new Error(err.errors[0].message);
    });
}

module.exports = {
    initialize,
    getAllProjects,
    getProjectsById,
    getProjectsBySector,
    getAllSectors,
    addProject,
    editProject,
    deleteProject
}
