const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');

const router = express.Router();

router.post('/register', validateRegister, (req, res, next) => {
  authController.register(req, res, next);
});

router.post('/login', validateLogin, (req, res, next) => {
  authController.login(req, res, next);
});

router.post('/refresh-token', (req, res, next) => {
  authController.refreshToken(req, res, next);
});

router.post('/verify-email', (req, res, next) => {
  authController.verifyEmail(req, res, next);
});

router.post('/resend-otp', (req, res, next) => {
  authController.resendOTP(req, res, next);
});

module.exports = router;