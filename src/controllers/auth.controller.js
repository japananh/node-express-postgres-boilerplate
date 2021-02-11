const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const {
	authService,
	userService,
	emailService,
	tokenService,
} = require('../services');
const { setCookie } = require('../utils/auth');

const register = catchAsync(async (req, res) => {
	const user = await userService.createUser(req, req.body);
	res.status(httpStatus.CREATED).send({ user });
});

const login = catchAsync(async (req, res) => {
	const user = await authService.loginUserWithEmailAndPassword(req, req.body);
	// Set httpOnly cookie, default expires = 24 hours
	setCookie(res, 'token', { id: user.id, role: user.role });
	res.send({ user });
});

const logout = catchAsync(async (req, res) => {
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
	await authService.resetPassword(req);
	res.send({ success: true });
});

module.exports = {
	register,
	login,
	logout,
	forgotPassword,
	resetPassword,
};
