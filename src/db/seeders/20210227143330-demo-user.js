module.exports = {
	up: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkInsert('user', [
			{
				name: 'Nana',
				role_id: 1,
				email: 'example@example.com',
				password:
					'$2b$10$ypGY2T4RSpZQ/uGrlKqqi.LfWwF.NQhP8Njq3h7cIlFvc.2O51oE.',
				created_date_time: new Date(),
				modified_date_time: new Date(),
			},
		]);
	},
	down: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkDelete('user', null, {});
	},
};
