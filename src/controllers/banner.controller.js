const bannerService = require('../services/banner.service');
const ApiResponse = require('../utils/api.response');

class BannerController {
    async createBanner(req, res, next) {
        try {
            const result = await bannerService.createBanner(req.body);
            return res.status(201).json(
                ApiResponse.success(201, 'Tạo banner thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Admin xem tất cả (kể cả inactive)
    async getAllBanners(req, res, next) {
        try {
            const { position, is_active } = req.query;
            const result = await bannerService.getAllBanners({
                position,
                is_active: is_active !== undefined ? is_active === 'true' : undefined
            });
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy danh sách banner thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // Public — chỉ banner đang active, dùng cho trang chủ
    async getActiveBanners(req, res, next) {
        try {
            const { position } = req.query;
            const result = await bannerService.getActiveBanners(position);
            return res.status(200).json(
                ApiResponse.success(200, 'Lấy banner thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async updateBanner(req, res, next) {
        try {
            const { id } = req.params;
            const result = await bannerService.updateBanner(id, req.body);
            return res.status(200).json(
                ApiResponse.success(200, 'Cập nhật banner thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    async deleteBanner(req, res, next) {
        try {
            const { id } = req.params;
            const result = await bannerService.deleteBanner(id);
            return res.status(200).json(
                ApiResponse.success(200, result.message, null)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BannerController();