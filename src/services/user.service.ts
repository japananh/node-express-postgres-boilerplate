import httpStatus from 'http-status';
import { UniqueConstraintError } from 'sequelize';
import type { InferAttributes } from 'sequelize';
import { getOffset, getSortOrder } from '../utils/query';
import ApiError from '../utils/ApiError';
import { encryptData } from '../utils/auth';
import config from '../config/config';
import { Role, User } from '../db/models';
import * as roleService from './role.service';

// `raw: true` alone flattens the joined role into dotted keys; `nest: true` rebuilds it.
type UserRow = Omit<InferAttributes<User>, 'password'> & {
	password?: string;
	role: { id: number; name: string };
};

interface PageQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
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

// config/roles.ts grants by role id, so this role must be seeded as id 2.
const DEFAULT_ROLE_NAME = 'user';

const roleInclude = {
	model: Role,
	attributes: ['id', 'name'],
};

async function getUserByEmail(email: string) {
	const user = await User.findOne({
		where: { email },
		include: [roleInclude],
		raw: true,
		nest: true,
	});

	return user as unknown as UserRow | null;
}

async function getUserById(id: number | string) {
	const user = await User.findOne({
		where: { id },
		include: [roleInclude],
		raw: true,
		nest: true,
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

	let createdUser;
	try {
		const created = await User.create({
			name,
			email,
			role_id: roleId,
			password: hashedPassword,
		});
		createdUser = created.get({ plain: true });
	} catch (error) {
		// Lost a race with a concurrent create of the same email.
		if (error instanceof UniqueConstraintError) {
			throw new ApiError(httpStatus.CONFLICT, 'This email already exits');
		}
		throw error;
	}

	return createdUser as Omit<typeof createdUser, 'password'> & {
		password?: string;
	};
}

/**
 * Public self-registration: the role is never caller-chosen.
 */
async function registerUser(req: { body: Omit<UserBody, 'roleId'> }) {
	const { email, name, password } = req.body;
	const role = await roleService.getRoleByName(DEFAULT_ROLE_NAME);

	if (!role) {
		throw new ApiError(
			httpStatus.INTERNAL_SERVER_ERROR,
			`Default role "${DEFAULT_ROLE_NAME}" is not seeded; run the database seeders`
		);
	}

	return createUser({ body: { email, name, password, roleId: role.id } });
}

async function getUsers(req: { query: PageQuery }) {
	const { page: defaultPage, limit: defaultLimit } = config.pagination;
	const { page = defaultPage, limit = defaultLimit, sortBy } = req.query;

	const offset = getOffset(page, limit);

	const users = await User.findAndCountAll({
		order: sortBy
			? getSortOrder(sortBy)
			: [
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
		nest: true,
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
	DEFAULT_ROLE_NAME,
	getUserByEmail,
	getUserById,
	createUser,
	registerUser,
	updateUser,
	getUsers,
	deleteUserById,
};
export type { UserRow };
