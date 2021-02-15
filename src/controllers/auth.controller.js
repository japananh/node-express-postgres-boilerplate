const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {
	authService,
	userService,
	emailService,
	tokenService,
} = require('../services');
const { setCookie, verifyToken } = require('../utils/auth');

const register = catchAsync(async (req, res) => {
	const user = await userService.createUser(req, req.body);
	res.status(httpStatus.CREATED).send({ user });
});

const login = catchAsync(async (req, res) => {
	const user = await authService.loginUserWithEmailAndPassword(req, req.body);
	const tokens = await tokenService.generateAuthTokens(req, {
		userId: user.id,
		role: user.role,
	});

	const { token: accessToken, expires } = tokens.access;
	// Set httpOnly cookie, default expires = 24 hours
	setCookie(res, 'token', accessToken, expires);

	res.send({ user, refresh: tokens.refresh });
});

const logout = catchAsync(async (req, res) => {
	await authService.logout(req, req.body.refreshToken);
	res.clearCookie('token');
	res.send({ success: true });
});

const forgotPassword = catchAsync(async (req, res) => {
	const resetPasswordToken = await tokenService.generateResetPasswordToken(
		req,
		req.body.email
	);
	await emailService.sendResetPasswordEmail(
		req.body.email,
		resetPasswordToken
	);
	res.send({ success: true });
});

const resetPassword = catchAsync(async (req, res) => {
	const { id } = await verifyToken(req.query.token);
	const user = await userService.updateUser(req, {
		password: req.body.password,
		id,
	});
	await tokenService.deleteAllTokens(req, user.id);
	res.send({ success: true });
});

module.exports = {
	register,
	login,
	logout,
	forgotPassword,
	resetPassword,
};
