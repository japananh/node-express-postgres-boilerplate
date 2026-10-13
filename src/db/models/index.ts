import { Sequelize } from 'sequelize';
import config from '../../config/config';
import { Role, initRole } from './role.model';
import { User, initUser } from './user.model';

const sequelize = new Sequelize({
	...config.sqlDB,
	username: config.sqlDB.user,
	logging: false,
});

initRole(sequelize);
initUser(sequelize);

// Matches the migrated schema: a role that still has users cannot be deleted.
Role.hasMany(User, {
	foreignKey: 'role_id',
	onDelete: 'NO ACTION',
});

User.belongsTo(Role, {
	foreignKey: 'role_id',
	onDelete: 'NO ACTION',
});

export { sequelize, Role, User };
