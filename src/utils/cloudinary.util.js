const cloudinary = require('../configs/cloudinary.config');
const streamifier = require('streamifier');

class CloudinaryUtil {
    /**
     * Upload 1 buffer ảnh lên Cloudinary
     * @param {Buffer} buffer
     * @param {string} folder - thư mục lưu trên Cloudinary (vd: 'products', 'avatars', 'tickets')
     */
    uploadImage(buffer, folder = 'general') {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `laptop-shop/${folder}`,
                    resource_type: 'image',
                    transformation: [{ quality: 'auto', fetch_format: 'auto' }]
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id
                    });
                }
            );
            streamifier.createReadStream(buffer).pipe(uploadStream);
        });
    }

    /** Upload nhiều ảnh cùng lúc */
    async uploadMultipleImages(files, folder = 'general') {
        const uploads = files.map(file => this.uploadImage(file.buffer, folder));
        return Promise.all(uploads);
    }

    /** Xoá 1 ảnh theo public_id */
    async deleteImage(publicId) {
        try {
            return await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw error;
        }
    }

    /** Xoá nhiều ảnh */
    async deleteMultipleImages(publicIds = []) {
        if (!publicIds.length) return;
        return await cloudinary.uploader.delete_resources(publicIds);
    }

    /** Lấy public_id từ URL Cloudinary (dùng khi model chỉ lưu URL) */
    extractPublicId(url) {
        try {
            const parts = url.split('/');
            const fileWithExt = parts[parts.length - 1];
            const folderPath = parts.slice(parts.indexOf('laptop-shop'), parts.length - 1).join('/');
            const fileName = fileWithExt.split('.')[0];
            return `${folderPath}/${fileName}`;
        } catch (error) {
            return null;
        }
    }
}

module.exports = new CloudinaryUtil();