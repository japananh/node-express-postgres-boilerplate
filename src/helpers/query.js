async function generateQuery(req, query) {
	const result = await req.postgres.query(query);
	return result;
}

module.exports = {
	generateQuery,
};
