// Ids are explicit: src/config/roles.ts grants permissions by role id.
const roles = [
	{ id: 1, name: 'admin', description: 'administrator' },
	{ id: 2, name: 'user', description: 'regular user' },
];

module.exports = {
	up: async (queryInterface /* , Sequelize */) => {
		const now = new Date();
		await queryInterface.bulkInsert(
			'role',
			roles.map((role) => ({
				...role,
				created_date_time: now,
				modified_date_time: now,
			}))
		);
		// Explicit ids leave the serial sequence behind; later inserts would collide.
		await queryInterface.sequelize.query(
			`SELECT setval(pg_get_serial_sequence('"role"', 'id'), (SELECT MAX(id) FROM "role"))`
		);
	},
	down: (queryInterface /* , Sequelize */) => {
		return queryInterface.bulkDelete(
			'role',
			{ name: roles.map((role) => role.name) },
			{}
		);
	},
};
