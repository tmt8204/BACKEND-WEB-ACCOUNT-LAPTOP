const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, refreshTokenSchema, verifyEmailSchema, newPasswordSchema, verifyOTPSchema, changePasswordSchema, googleLoginSchema } = require('../middlewares/validators/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema), (req, res, next) => {
  authController.register(req, res, next);
});

router.post('/login', validate(loginSchema), (req, res, next) => {
  authController.login(req, res, next);
});

router.post('/google', validate(googleLoginSchema), (req, res, next) => {
  authController.googleLogin(req, res, next);
});

router.post('/refresh-token', validate(refreshTokenSchema), (req, res, next) => {
  authController.refreshToken(req, res, next);
});

router.post('/verify-email', validate(verifyEmailSchema), (req, res, next) => {
  authController.verifyEmail(req, res, next);
});

router.post('/send-otp', validate(verifyEmailSchema), (req, res, next) => {
  authController.sendOTP(req, res, next);
});

router.post('/forgot-password', validate(verifyEmailSchema), (req, res, next) => {
  authController.forgotPassword(req, res, next);
});

router.post('/verify-reset-otp', validate(verifyOTPSchema), (req, res, next) => {
  authController.verifyResetOTP(req, res, next);
});

router.post('/reset-password', validate(newPasswordSchema), (req, res, next) => {
  authController.resetPassword(req, res, next);
});

module.exports = router;