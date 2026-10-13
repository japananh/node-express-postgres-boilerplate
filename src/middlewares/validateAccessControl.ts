import httpStatus from 'http-status';
import type { NextFunction, Request, Response } from 'express';
import { roles } from '../config/roles';
import ApiError from '../utils/ApiError';

type Action =
	| 'createAny'
	| 'readAny'
	| 'updateAny'
	| 'deleteAny'
	| 'createOwn'
	| 'readOwn'
	| 'updateOwn'
	| 'deleteOwn';

function grantAccess(action: Action, resource: string) {
	return async (
		req: Pick<Request, 'params' | 'user'>,
		_res: Response,
		next: NextFunction
	) => {
		try {
			const isOwnedUser = req.user!.userId === Number(req.params.userId);
			const modifiedAction = isOwnedUser
				? (action.replace('Any', 'Own') as Action)
				: action;

			const permission = roles
				.can(JSON.stringify(req.user!.roleId))
				[modifiedAction](resource);

			if (!permission.granted) {
				throw new ApiError(
					httpStatus.FORBIDDEN,
					"You don't have enough permission to perform this action"
				);
			}
			next();
		} catch (error) {
			next(error);
		}
	};
}

export { grantAccess };
