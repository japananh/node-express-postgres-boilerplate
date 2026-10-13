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

Role.hasMany(User, {
	foreignKey: 'id',
	onDelete: 'CASCADE',
});

User.belongsTo(Role, {
	foreignKey: 'role_id',
	onDelete: 'CASCADE',
});

export { sequelize, Role, User };
