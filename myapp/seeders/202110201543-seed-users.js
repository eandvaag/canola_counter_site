'use strict';

var bcrypt = require('bcrypt');

module.exports = {
	up: (queryInterface, Sequelize) => {

		const salt = bcrypt.genSaltSync();
		return queryInterface.bulkInsert('users', [
			{
				username: 'kaylie',
				password: bcrypt.hashSync("#Canola@detection21", salt),
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				username: 'erik',
				password: bcrypt.hashSync("resFPN21emergence$", salt),
				createdAt: new Date(),
				updatedAt: new Date()
			}

		], {

		});
	},
	down: (queryInterface, Sequelize) => {
		return queryInterface.bulkDelete('users', null, {});
	}
};