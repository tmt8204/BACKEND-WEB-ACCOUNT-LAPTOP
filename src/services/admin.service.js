const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');
const passwordUtil = require('../utils/password.util');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');

class AdminService {

    // ── Dashboard ──────────────────────────────────────────────

    async getDashboard() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            const [
                totalOrders,
                pendingOrders,
                completedOrders,
                cancelledOrders,
                totalCustomers,
                totalProducts,
                revenueThisMonth,
                revenueLastMonth,
                recentOrders,
                openTickets
            ] = await Promise.all([
                Order.countDocuments(),
                Order.countDocuments({ status: 'pending' }),
                Order.countDocuments({ status: 'completed' }),
                Order.countDocuments({ status: 'cancelled' }),
                User.countDocuments({ role: await roleRepository.findRoleByName('customer').then(r => r?._id) }),
                Product.countDocuments({ is_active: true }),
                Order.aggregate([
                    { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
                    { $group: { _id: null, total: { $sum: '$total_amount' } } }
                ]).then(r => r[0]?.total || 0),
                Order.aggregate([
                    { $match: { status: 'completed', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                    { $group: { _id: null, total: { $sum: '$total_amount' } } }
                ]).then(r => r[0]?.total || 0),
                Order.find().sort({ createdAt: -1 }).limit(5)
                    .populate('user_id', 'fullname email')
            ]);

            const revenueGrowth = revenueLastMonth > 0
                ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
                : null;

            return {
                summary: {
                    total_orders: totalOrders,
                    pending_orders: pendingOrders,
                    completed_orders: completedOrders,
                    cancelled_orders: cancelledOrders,
                    total_customers: totalCustomers,
                    total_products: totalProducts,
                    open_tickets: openTickets
                },
                revenue: {
                    this_month: revenueThisMonth,
                    last_month: revenueLastMonth,
                    growth_percent: revenueGrowth
                },
                recent_orders: recentOrders
            };
        } catch (error) {
            throw error;
        }
    }

    // ── Báo cáo ────────────────────────────────────────────────

    async getReport({ from, to, type = 'revenue' }) {
        try {
            const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const toDate = to ? new Date(to) : new Date();

            if (type === 'revenue') {
                const data = await Order.aggregate([
                    {
                        $match: {
                            status: 'completed',
                            createdAt: { $gte: fromDate, $lte: toDate }
                        }
                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            revenue: { $sum: '$total_amount' },
                            order_count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]);

                const total_revenue = data.reduce((sum, d) => sum + d.revenue, 0);
                const total_orders = data.reduce((sum, d) => sum + d.order_count, 0);

                return { type, from: fromDate, to: toDate, total_revenue, total_orders, data };
            }

            if (type === 'products') {
                const data = await Order.aggregate([
                    {
                        $match: {
                            status: 'completed',
                            createdAt: { $gte: fromDate, $lte: toDate }
                        }
                    },
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.product_id',
                            product_name: { $first: '$items.product_name' },
                            product_type: { $first: '$items.product_type' },
                            total_sold: { $sum: 1 },
                            total_revenue: { $sum: '$items.sale_price' }
                        }
                    },
                    { $sort: { total_sold: -1 } },
                    { $limit: 20 }
                ]);

                return { type, from: fromDate, to: toDate, data };
            }

            if (type === 'customers') {
                const customerRole = await roleRepository.findRoleByName('customer');
                const data = await Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: fromDate, $lte: toDate }
                        }
                    },
                    {
                        $group: {
                            _id: '$user_id',
                            order_count: { $sum: 1 },
                            total_spent: { $sum: '$total_amount' }
                        }
                    },
                    { $sort: { total_spent: -1 } },
                    { $limit: 20 }
                ]);

                const new_customers = await User.countDocuments({
                    role: customerRole?._id,
                    createdAt: { $gte: fromDate, $lte: toDate }
                });

                return { type, from: fromDate, to: toDate, new_customers, top_customers: data };
            }

            const error = new Error('Loại báo cáo không hợp lệ. Chọn: revenue | products | customers');
            error.statusCode = 400;
            throw error;
        } catch (error) {
            throw error;
        }
    }

    // ── Quản lí nhân viên ──────────────────────────────────────

    async getAllStaff({ page = 1, limit = 10, search } = {}) {
        try {
            const staffRole = await roleRepository.findRoleByName('staff');
            if (!staffRole) {
                const error = new Error('Không tìm thấy role staff');
                error.statusCode = 500;
                throw error;
            }

            const query = { role: staffRole._id };
            if (search) {
                query.$or = [
                    { fullname: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [staff, total] = await Promise.all([
                User.find(query)
                    .select('-password -refreshToken -otp -otpExpiresAt -otpSentAt -resetOtp -resetOtpExpiresAt -resetOtpSentAt')
                    .populate('role', 'name description')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                User.countDocuments(query)
            ]);

            return { staff, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) };
        } catch (error) {
            throw error;
        }
    }

    async createStaff(staffData) {
        try {
            const { fullname, email, phone, address, position, password } = staffData;

            const existingEmail = await userRepository.findUserByEmail(email);
            if (existingEmail) {
                const error = new Error('Email đã được sử dụng');
                error.statusCode = 400;
                throw error;
            }

            const existingPhone = await userRepository.findUserByPhone(phone);
            if (existingPhone) {
                const error = new Error('Số điện thoại đã được sử dụng');
                error.statusCode = 400;
                throw error;
            }

            const staffRole = await roleRepository.findRoleByName('staff');
            if (!staffRole) {
                const error = new Error('Không tìm thấy role staff');
                error.statusCode = 500;
                throw error;
            }

            const hashedPassword = await passwordUtil.hashPassword(password);

            const newStaff = await userRepository.createUser({
                fullname,
                email: email.toLowerCase(),
                password: hashedPassword,
                phone,
                address,
                position,
                role: staffRole._id,
                isVerified: true
            });

            const staffResponse = newStaff.toObject();
            delete staffResponse.password;
            delete staffResponse.refreshToken;

            return staffResponse;
        } catch (error) {
            throw error;
        }
    }

    async updateStaff(staffId, updateData) {
        try {
            const staff = await userRepository.findUserById(staffId);
            if (!staff) {
                const error = new Error('Nhân viên không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            if (staff.role?.name === 'admin') {
                const error = new Error('Không thể chỉnh sửa tài khoản admin');
                error.statusCode = 403;
                throw error;
            }

            const allowedFields = ['fullname', 'phone', 'address', 'position', 'isActive'];
            const safeData = {};
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) safeData[field] = updateData[field];
            }

            if (updateData.phone && updateData.phone !== staff.phone) {
                const existing = await userRepository.findUserByPhone(updateData.phone);
                if (existing) {
                    const error = new Error('Số điện thoại đã được sử dụng');
                    error.statusCode = 400;
                    throw error;
                }
            }

            const updated = await userRepository.updateUserProfile(staffId, safeData);
            const staffResponse = updated.toObject();
            delete staffResponse.password;
            delete staffResponse.refreshToken;

            return staffResponse;
        } catch (error) {
            throw error;
        }
    }

    async deleteStaff(staffId) {
        try {
            const staff = await userRepository.findUserById(staffId);
            if (!staff) {
                const error = new Error('Nhân viên không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            if (staff.role?.name === 'admin') {
                const error = new Error('Không thể xóa tài khoản admin');
                error.statusCode = 403;
                throw error;
            }

            await userRepository.updateUserProfile(staffId, { isActive: false });
        } catch (error) {
            throw error;
        }
    }

    // Phân quyền
    async assignRole(staffId, roleId) {
        try {
            const user = await userRepository.findUserById(staffId);
            if (!user) {
                const error = new Error('Người dùng không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            const role = await roleRepository.findRoleById(roleId);
            if (!role) {
                const error = new Error('Role không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            if (role.name === 'admin') {
                const error = new Error('Không thể phân quyền admin');
                error.statusCode = 403;
                throw error;
            }

            const updated = await userRepository.updateUserProfile(staffId, { role: roleId });
            const userResponse = updated.toObject();
            delete userResponse.password;
            delete userResponse.refreshToken;

            return userResponse;
        } catch (error) {
            throw error;
        }
    }

    // ── Quản lí khách hàng ─────────────────────────────────────

    async getAllCustomers({ page = 1, limit = 10, search } = {}) {
        try {
            const customerRole = await roleRepository.findRoleByName('customer');
            const query = { role: customerRole?._id };

            if (search) {
                query.$or = [
                    { fullname: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const [customers, total] = await Promise.all([
                User.find(query)
                    .select('-password -refreshToken -otp -otpExpiresAt -otpSentAt -resetOtp -resetOtpExpiresAt -resetOtpSentAt')
                    .populate('role', 'name')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                User.countDocuments(query)
            ]);

            return { customers, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) };
        } catch (error) {
            throw error;
        }
    }

    async getCustomerDetail(customerId) {
        try {
            const customer = await User.findById(customerId)
                .select('-password -refreshToken -otp -otpExpiresAt -otpSentAt -resetOtp -resetOtpExpiresAt -resetOtpSentAt')
                .populate('role', 'name');

            if (!customer) {
                const error = new Error('Khách hàng không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            // Lấy lịch sử đơn hàng của khách
            const orders = await Order.find({ user_id: customerId })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('status total_amount payment_method createdAt');

            const totalSpent = await Order.aggregate([
                { $match: { user_id: customer._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$total_amount' } } }
            ]).then(r => r[0]?.total || 0);

            return { customer, order_history: orders, total_spent: totalSpent };
        } catch (error) {
            throw error;
        }
    }

    async toggleCustomerStatus(customerId) {
        try {
            const customer = await userRepository.findUserById(customerId);
            if (!customer) {
                const error = new Error('Khách hàng không tồn tại');
                error.statusCode = 404;
                throw error;
            }

            const updated = await userRepository.updateUserProfile(customerId, { isActive: !customer.isActive });
            const response = updated.toObject();
            delete response.password;
            delete response.refreshToken;

            return response;
        } catch (error) {
            throw error;
        }
    }

    // ── Quản lí hệ thống ───────────────────────────────────────

    async getSystemInfo() {
        try {
            const [roles, totalUsers, totalProducts, dbStats] = await Promise.all([
                roleRepository.findAllRoles(),
                User.countDocuments(),
                Product.countDocuments(),
                Promise.resolve({
                    node_version: process.version,
                    uptime_seconds: Math.floor(process.uptime()),
                    memory_mb: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
                })
            ]);

            return {
                roles,
                stats: { total_users: totalUsers, total_products: totalProducts },
                system: dbStats
            };
        } catch (error) {
            throw error;
        }
    }

    async getRoles() {
        try {
            return await roleRepository.findAllRoles();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AdminService();