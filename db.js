const Sequelize = require("sequelize");
const sequelize = new Sequelize(null, null, null, {
    dialect: "sqlite",
    storage: "database.sqlite"
});

const Build = sequelize.define("build", {
    author: { type: Sequelize.STRING },
    message: { type: Sequelize.STRING },
    code: { type: Sequelize.INTEGER },
    uuid: { type: Sequelize.STRING },
    stderr: { type: Sequelize.STRING },
    stdout: { type: Sequelize.STRING }
});

function init(callback) {
    return sequelize.sync();
}

module.exports = {
    init: init,
    build: Build
};
