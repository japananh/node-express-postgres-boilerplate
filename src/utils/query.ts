import type { Request } from 'express';
import config from '../config/config';

async function generateQuery(req: Pick<Request, 'postgres'>, query: string) {
	const result = await req.postgres
		.query(query)
		.then((res) => res.rows)
		.catch((err) => {
			throw new Error(err.stack);
		});
	return result;
}

function getOffset(
	page = config.pagination.page,
	limit = config.pagination.limit
) {
	return (page - 1) * limit;
}

export { generateQuery, getOffset };
