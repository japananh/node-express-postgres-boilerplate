import httpStatus from 'http-status';
import type { InferAttributes } from 'sequelize';
import { getOffset } from '../utils/query';
import ApiError from '../utils/ApiError';
import { encryptData } from '../utils/auth';
import config from '../config/config';
import { Role, User } from '../db/models';
import * as roleService from './role.service';

// `raw: true` flattens the joined role into dotted keys.
type UserRow = Omit<InferAttributes<User>, 'password'> & {
	password?: string;
	'role.id': number | null;
	'role.name': string | null;
};

interface PageQuery {
	page?: number;
	limit?: number;
}

interface UserBody {
	email: string;
	name: string;
	password: string;
	roleId: number;
}

type UpdateBody = Partial<Pick<UserBody, 'email' | 'name' | 'password'>> & {
	id?: number;
};

const roleInclude = {
	model: Role,
	attributes: ['id', 'name'],
};

async function getUserByEmail(email: string) {
	const user = await User.findOne({
		where: { email },
		include: [roleInclude],
		raw: true,
	});

	return user as unknown as UserRow | null;
}

async function getUserById(id: number | string) {
	const user = await User.findOne({
		where: { id },
		include: [roleInclude],
		raw: true,
	});

	return user as unknown as UserRow | null;
}

async function createUser(req: { body: UserBody }) {
	const { email, name, password, roleId } = req.body;
	const hashedPassword = await encryptData(password);
	const user = await getUserByEmail(email);

	if (user) {
		throw new ApiError(httpStatus.CONFLICT, 'This email already exits');
	}

	const role = await roleService.getRoleById(roleId);

	if (!role) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}

	const createdUser = await User.create({
		name,
		email,
		role_id: roleId,
		password: hashedPassword,
	}).then((resultEntity) => resultEntity.get({ plain: true }));

	return createdUser as Omit<typeof createdUser, 'password'> & {
		password?: string;
	};
}

async function getUsers(req: { query: PageQuery }) {
	const { page: defaultPage, limit: defaultLimit } = config.pagination;
	const { page = defaultPage, limit = defaultLimit } = req.query;

	const offset = getOffset(page, limit);

	const users = await User.findAndCountAll({
		order: [
			['name', 'ASC'],
			['created_date_time', 'DESC'],
			['modified_date_time', 'DESC'],
		],
		include: [roleInclude],
		attributes: [
			'id',
			'name',
			'email',
			'created_date_time',
			'modified_date_time',
		],
		offset,
		limit,
		raw: true,
	});

	return users;
}

async function deleteUserById(userId: number | string) {
	const deletedUser = await User.destroy({
		where: { id: userId },
	});

	if (!deletedUser) {
		throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
	}

	return deletedUser;
}

async function updateUser(req: {
	params: { userId?: string };
	body: UpdateBody;
}) {
	const { password, email } = req.body;

	if (password) {
		const hashedPassword = await encryptData(password);

		if (!hashedPassword) {
			throw new ApiError(
				httpStatus.INTERNAL_SERVER_ERROR,
				'Internal Server Error'
			);
		}

		req.body.password = hashedPassword;
	}

	if (email) {
		const existedUser = await getUserByEmail(email);

		if (existedUser) {
			throw new ApiError(
				httpStatus.CONFLICT,
				'This email is already exist'
			);
		}
	}

	const [, rows] = await User.update(
		{ ...req.body },
		{
			where: { id: (req.params.userId || req.body.id)! },
			returning: true,
		}
	);

	return rows[0]?.get({ plain: true }) as UserRow | undefined;
}

export {
	getUserByEmail,
	getUserById,
	createUser,
	updateUser,
	getUsers,
	deleteUserById,
};
export type { UserRow };
