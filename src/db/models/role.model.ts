import {
	CreationOptional,
	DataTypes,
	InferAttributes,
	InferCreationAttributes,
	Model,
	Sequelize,
} from 'sequelize';

class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
	declare id: CreationOptional<number>;

	declare name: string;

	declare description: string | null;

	declare created_date_time: CreationOptional<Date>;

	declare modified_date_time: CreationOptional<Date>;
}

function initRole(sequelize: Sequelize) {
	Role.init(
		{
			id: {
				type: DataTypes.INTEGER,
				allowNull: false,
				primaryKey: true,
				autoIncrement: true,
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			description: {
				type: DataTypes.STRING,
				allowNull: true,
			},
			created_date_time: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
			modified_date_time: {
				type: DataTypes.DATE,
				defaultValue: DataTypes.NOW,
				allowNull: false,
			},
		},
		{
			sequelize,
			modelName: 'role',
			/**
			 * By default, sequelize will automatically transform all passed model names into plural
			 * References: https://sequelize.org/master/manual/model-basics.html#table-name-inference
			 */
			tableName: 'role',
		}
	);
	return Role;
}

export { Role, initRole };
