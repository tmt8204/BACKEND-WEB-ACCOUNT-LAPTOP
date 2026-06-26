const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware')
const { createStaffSchema, updateStaffSchema, assignRoleSchema, getReportSchema } = require('../middlewares/validators/admin.validator');

const router = express.Router();

// Lấy dữ liệu tổng quan Dashboard
router.get(
    '/dashboard',
    authenticate,
    authorizeRoles(['admin']),
    adminController.getDashboard
);

// Lấy báo cáo thống kê (Revenue, Products, Customers)
router.get(
    '/reports',
    authenticate,
    authorizeRoles(['admin']),
    validate(getReportSchema), // Thêm validate query params nếu cần (?type=...)
    adminController.getReport
);

// Lấy thông tin cấu hình và tài nguyên hệ thống
router.get(
    '/system/info',
    authenticate,
    authorizeRoles(['admin']),
    adminController.getSystemInfo
);

// Lấy danh sách tất cả các Role trong hệ thống
router.get(
    '/system/roles',
    authenticate,
    authorizeRoles(['admin']),
    adminController.getRoles
);


// ======================================================
// QUẢN LÝ NHÂN VIÊN (STAFF)
// ======================================================

// Lấy danh sách nhân viên có phân trang & tìm kiếm
router.get(
    '/staffs',
    authenticate,
    authorizeRoles(['admin']),
    adminController.getAllStaff
);

// Tạo tài khoản nhân viên mới
router.post(
    '/staffs',
    authenticate,
    authorizeRoles(['admin']),
    validate(createStaffSchema),
    adminController.createStaff
);

// Cập nhật thông tin nhân viên
router.put(
    '/staffs/:staffId',
    authenticate,
    authorizeRoles(['admin']),
    validate(updateStaffSchema),
    adminController.updateStaff
);

// Xóa (hoặc khóa) tài khoản nhân viên
router.delete(
    '/staffs/:staffId',
    authenticate,
    authorizeRoles(['admin']),
    adminController.deleteStaff
);

// Phân quyền lại cho nhân viên (Thay đổi Role)
router.patch(
    '/staffs/:staffId/assign-role',
    authenticate,
    authorizeRoles(['admin']),
    validate(assignRoleSchema),
    adminController.assignRole
);


// ======================================================
// QUẢN LÝ KHÁCH HÀNG (CUSTOMER)
// ======================================================

// Lấy danh sách khách hàng có phân trang & tìm kiếm
router.get(
    '/customers',
    authenticate,
    authorizeRoles(['admin']),
    adminController.getAllCustomers
);

// Chi tiết một khách hàng kèm lịch sử mua hàng
router.get(
    '/customers/:customerId',
    authenticate,
    authorizeRoles(['admin']),
    adminController.getCustomerDetail
);

// Khóa hoặc mở khóa tài khoản khách hàng
router.patch(
    '/customers/:customerId/toggle-status',
    authenticate,
    authorizeRoles(['admin']),
    adminController.toggleCustomerStatus
);

module.exports = router;