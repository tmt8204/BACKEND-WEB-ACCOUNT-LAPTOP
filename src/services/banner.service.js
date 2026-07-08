const bannerRepository = require('../repositories/banner.repository');
const cloudinaryUtil = require('../utils/cloudinary.util');

class BannerService {
    async createBanner(data) {
        return await bannerRepository.createBanner(data);
    }

    async getAllBanners(query) {
        return await bannerRepository.findAllBanners(query);
    }

    async getActiveBanners(position) {
        return await bannerRepository.findActiveBanners(position);
    }

    async updateBanner(id, data) {
        const banner = await bannerRepository.findBannerById(id);
        if (!banner) {
            const error = new Error('Banner không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // Nếu thay ảnh mới thì xoá ảnh cũ trên Cloudinary
        if (data.image && banner.image?.public_id && data.image.public_id !== banner.image.public_id) {
            cloudinaryUtil.deleteImage(banner.image.public_id).catch(err =>
                console.error('Lỗi xoá ảnh banner cũ:', err.message)
            );
        }

        return await bannerRepository.updateBanner(id, data);
    }

    async deleteBanner(id) {
        const banner = await bannerRepository.findBannerById(id);
        if (!banner) {
            const error = new Error('Banner không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        if (banner.image?.public_id) {
            cloudinaryUtil.deleteImage(banner.image.public_id).catch(err =>
                console.error('Lỗi xoá ảnh banner:', err.message)
            );
        }

        await bannerRepository.deleteBanner(id);
        return { message: 'Xoá banner thành công' };
    }
}

module.exports = new BannerService();