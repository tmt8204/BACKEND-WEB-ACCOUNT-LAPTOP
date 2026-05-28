const express = require("express");
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { updateProfileSchema } = require("../middlewares/validators/user.validator");

const router = express.Router();

router.get("/get-profile", verifyToken, (req, res, next) => {
    userController.getProfile(req, res, next);
});

router.put("/update-profile", verifyToken, validate(updateProfileSchema), (req, res, next) => {
    userController.updateProfile(req, res, next);
});

module.exports = router;