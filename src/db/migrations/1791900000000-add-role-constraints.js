// Restores the constraints of the removed flyway baseline. Fails if existing
// rows already violate them (duplicate role names, users with an unknown role).
module.exports = {
	up: async (queryInterface) => {
		await queryInterface.addConstraint('role', {
			fields: ['name'],
			type: 'unique',
			name: 'role_name_key',
		});
		await queryInterface.addConstraint('user', {
			fields: ['role_id'],
			type: 'foreign key',
			name: 'user_role_id_fkey',
			references: { table: 'role', field: 'id' },
			onDelete: 'NO ACTION',
			onUpdate: 'NO ACTION',
		});
	},
	down: async (queryInterface) => {
		await queryInterface.removeConstraint('user', 'user_role_id_fkey');
		await queryInterface.removeConstraint('role', 'role_name_key');
	},
};
