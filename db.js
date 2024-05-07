const {Sequelize} = require('sequelize');

module.exports = new Sequelize(
    'telega_bot',
    'root',
    'root',
    {
        host: '5.188.77.148',
        port: '5432', 
        dialect: 'postgres'
    }
)