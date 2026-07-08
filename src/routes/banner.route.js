const express = require('express');
const bannerController = require('../controllers/banner.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createBannerSchema, updateBannerSchema } = require('../middlewares/validators/banner.validator');

const router = express.Router();

// Public — hiển thị ngoài trang chủ, không cần đăng nhập
router.get('/active', (req, res, next) => bannerController.getActiveBanners(req, res, next));

// Admin quản lý
router.get(
    '/', 
    authenticate, 
    authorizeRoles(['admin']), 
    (req, res, next) => bannerController.getAllBanners(req, res, next));

router.post(
    '/', 
    authenticate, 
    authorizeRoles(['admin']), 
    validate(createBannerSchema), 
    (req, res, next) => bannerController.createBanner(req, res, next));

router.put(
    '/:id', 
    authenticate, 
    authorizeRoles(['admin']), 
    validate(updateBannerSchema), 
    (req, res, next) => bannerController.updateBanner(req, res, next));
    
router.delete(
    '/:id', 
    authenticate, 
    authorizeRoles(['admin']), 
    (req, res, next) => bannerController.deleteBanner(req, res, next));

module.exports = router;