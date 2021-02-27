module.exports = {
	up: (queryInterface, Sequelize) =>
		queryInterface.createTable('user', {
			id: {
				type: Sequelize.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			name: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true,
			},
			role_id: {
				type: Sequelize.INTEGER,
				allowNull: false,
			},
			created_date_time: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: false,
			},
			modified_date_time: {
				type: Sequelize.DATE,
				defaultValue: Sequelize.NOW,
				allowNull: false,
			},
			password: {
				type: Sequelize.STRING,
				allowNull: false,
			},
		}),
	down: (queryInterface /* , Sequelize */) =>
		queryInterface.dropTable('user'),
};
