const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {
	authService,
	userService,
	emailService,
	tokenService,
} = require('../services');

const register = catchAsync(async (req, res) => {
	const user = await userService.createUser(req, req.body);
	res.status(httpStatus.CREATED).send({ user });
});

const login = catchAsync(async (req, res) => {
	const user = await authService.loginUserWithEmailAndPassword(req, req.body);
	// Set httpOnly cookie, default expires = 24 hours
	tokenService.setCookie(res, 'token', { id: user.id, role: user.role });
	res.send({ user });
});

const logout = catchAsync(async (req, res) => {
	res.clearCookie('token');
	res.send({ success: true });
});

const forgotPassword = catchAsync(async (req, res) => {
	const resetPasswordToken = await tokenService.generateResetPasswordToken(
		req.body.email
	);
	await emailService.sendResetPasswordEmail(
		req.body.email,
		resetPasswordToken
	);
	res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
	await authService.resetPassword(req);
	res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
	register,
	login,
	logout,
	forgotPassword,
	resetPassword,
};
