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

module.exports = router;