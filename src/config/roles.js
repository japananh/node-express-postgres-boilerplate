const AccessControl = require('accesscontrol');

const ac = new AccessControl();

exports.roles = (function () {
	ac.grant('2').readOwn('userInfo').updateOwn('userInfo');

	ac.grant('1')
		.readAny('userInfo')
		.updateAny('userInfo')
		.deleteAny('userInfo');
	ac.grant('1').readAny('role').updateAny('role').deleteAny('role');
	return ac;
})();
