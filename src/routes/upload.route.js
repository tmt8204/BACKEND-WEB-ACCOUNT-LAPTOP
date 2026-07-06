const express = require('express');
const uploadController = require('../controllers/upload.controller');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

// Ai đăng nhập cũng upload được (vd: avatar). Nếu chỉ admin/staff upload ảnh sản phẩm
// thì tách route riêng hoặc check quyền theo query "folder" trong controller.
router.post('/single', authenticate, uploadSingle, (req, res, next) => {
    uploadController.uploadSingle(req, res, next);
});

router.post(
    '/multiple',
    authenticate,
    authorizeRoles(['admin', 'staff']), // ảnh sản phẩm -> chỉ admin/staff
    uploadMultiple,
    (req, res, next) => {
        uploadController.uploadMultiple(req, res, next);
    }
);

router.delete('/', authenticate, authorizeRoles(['admin', 'staff']), (req, res, next) => {
    uploadController.deleteImage(req, res, next);
});

module.exports = router;