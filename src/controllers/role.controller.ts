import httpStatus from 'http-status';
import type { Request } from 'express';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import { roleService } from '../services';

interface RoleBody {
	name: string;
	description?: string;
}

interface PageQuery {
	page?: number;
	limit?: number;
	sortBy?: string;
}

const createRole = catchAsync(
	async (req: Request<Record<string, string>, unknown, RoleBody>, res) => {
		const role = await roleService.createRole(req);
		res.send({ role });
	}
);

const getRoles = catchAsync(
	async (
		req: Request<Record<string, string>, unknown, unknown, PageQuery>,
		res
	) => {
		const roles = await roleService.getRoles(req);
		res.send({ roles });
	}
);

const getRole = catchAsync(async (req, res) => {
	const role = await roleService.getRoleById(req.params.roleId);
	if (!role) {
		throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
	}
	res.send({ role });
});

const deleteRole = catchAsync(async (req, res) => {
	await roleService.deleteRoleById(req.params.roleId);
	res.send({ success: true });
});

const updateRole = catchAsync(
	async (
		req: Request<{ roleId: string }, unknown, Partial<RoleBody>>,
		res
	) => {
		const role = await roleService.updateRole(req);
		if (!role) {
			throw new ApiError(httpStatus.NOT_FOUND, 'Role not found');
		}
		res.send({ role });
	}
);

export { createRole, getRoles, getRole, updateRole, deleteRole };
