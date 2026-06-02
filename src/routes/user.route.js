const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { updateProfileSchema } = require("../middlewares/validators/user.validator");
const { changePasswordSchema } = require("../middlewares/validators/user.validator");

const router = express.Router();

router.get("/get-profile", authenticate, (req, res, next) => {
    userController.getProfile(req, res, next);
});

router.put("/update-profile", authenticate, validate(updateProfileSchema), (req, res, next) => {
    userController.updateProfile(req, res, next);
});

router.put('/change-password', authenticate, validate(changePasswordSchema), (req, res, next) => {
    userController.changePassword(req, res, next);
});

module.exports = router;