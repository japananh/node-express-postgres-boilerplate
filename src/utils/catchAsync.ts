import type { NextFunction, Request, RequestHandler, Response } from 'express';

const catchAsync =
	<
		P = Request['params'],
		ResBody = unknown,
		ReqBody = unknown,
		ReqQuery = Request['query']
	>(
		fn: (
			req: Request<P, ResBody, ReqBody, ReqQuery>,
			res: Response<ResBody>,
			next: NextFunction
		) => unknown
	): RequestHandler<P, ResBody, ReqBody, ReqQuery> =>
	(req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch((err) => next(err));
	};

export default catchAsync;
