'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
//if (config.use_env_variable) {
//  sequelize = new Sequelize(process.env[config.use_env_variable], config);
//} else {

console.log("process.env", process.env);

sequelize = new Sequelize(process.env.DB_SCHEMA || config.database, 
                          process.env.DB_USER || config.username, 
                          process.env.DB_PASSWORD || config.password, 
                          {
                            host: process.env.DB_HOST || config.host,
                            port: process.env.DB_PORT || config.port,
                            dialect: config.dialect
                          });

/*
sequelize = new Sequelize(process.env.DB_SCHEMA, 
                          process.env.DB_USER, 
                          process.env.DB_PASSWORD, 
                          {
                            host: process.env.DB_HOST,
                            port: process.env.DB_PORT,
                            dialect: config.dialect
                          });*/
//}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;