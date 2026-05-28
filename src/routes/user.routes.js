const express = require("express");
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/get-profile", verifyToken, (req, res, next) => {
    userController.getProfile(req, res, next);
});

module.exports = router;