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

// sortBy is `field:asc|desc`, already whitelisted by the route validation.
// `id` is appended so pages stay stable when the sorted column has ties.
function getSortOrder(sortBy: string): [string, 'ASC' | 'DESC'][] {
	const [field, direction] = sortBy.split(':');
	return [
		[field, direction === 'desc' ? 'DESC' : 'ASC'],
		['id', 'ASC'],
	];
}

function getOffset(
	page = config.pagination.page,
	limit = config.pagination.limit
) {
	return (page - 1) * limit;
}

export { generateQuery, getOffset, getSortOrder };
