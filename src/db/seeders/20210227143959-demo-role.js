module.exports = {
	up: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkInsert('role', [
			{
				name: 'admin',
				description: 'some description',
				created_date_time: new Date(),
			},
		]);
	},
	down: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkDelete('role', null, {});
	},
};
