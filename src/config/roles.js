const AccessControl = require('accesscontrol');

const ac = new AccessControl();

exports.roles = (function () {
	ac.grant('user').readOwn('user').updateOwn('user');

	ac.grant('admin').readAny('user').updateAny('user').deleteAny('user');

	return ac;
})();
