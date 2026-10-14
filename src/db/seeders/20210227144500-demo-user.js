// Demo credentials (README): example@example.com / password1. Remove before production.
const DEMO_ADMIN_EMAIL = 'example@example.com';

module.exports = {
	up: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkInsert('user', [
			{
				name: 'Nana',
				role_id: 1,
				email: DEMO_ADMIN_EMAIL,
				// bcrypt, 10 salt rounds (utils/auth.ts), of 'password1'
				password:
					'$2b$10$2PrNShxdHJyZibC4gRGXyOTkb96seNfNP2yP84ZJBglQwizlZsNiW',
				created_date_time: new Date(),
				modified_date_time: new Date(),
			},
		]);
	},
	down: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkDelete(
			'user',
			{ email: DEMO_ADMIN_EMAIL },
			{}
		);
	},
};
