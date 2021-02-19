const config = require('../config/config.js');

async function generateQuery(req, query) {
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

module.exports = {
	generateQuery,
	getOffset,
};
