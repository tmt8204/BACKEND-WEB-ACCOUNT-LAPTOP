const Banner = require('../models/banner.model');

class BannerRepository {
    async createBanner(data) {
        const banner = new Banner(data);
        return await banner.save();
    }

    async findAllBanners({ position, is_active } = {}) {
        const query = {};
        if (position) query.position = position;
        if (is_active !== undefined) query.is_active = is_active;
        return await Banner.find(query).sort({ display_order: 1, createdAt: -1 });
    }

    // Banner đang hiển thị công khai (dùng cho trang chủ, không cần đăng nhập)
    async findActiveBanners(position) {
        const now = new Date();
        const query = {
            is_active: true,
            $and: [
                { $or: [{ start_date: null }, { start_date: { $lte: now } }] },
                { $or: [{ end_date: null }, { end_date: { $gte: now } }] }
            ]
        };
        if (position) query.position = position;
        return await Banner.find(query).sort({ display_order: 1 });
    }

    async findBannerById(id) {
        return await Banner.findById(id);
    }

    async updateBanner(id, data) {
        return await Banner.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteBanner(id) {
        return await Banner.findByIdAndDelete(id);
    }
}

module.exports = new BannerRepository();