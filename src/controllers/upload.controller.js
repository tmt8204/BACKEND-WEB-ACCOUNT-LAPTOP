const cloudinaryUtil = require('../utils/cloudinary.util');
const ApiResponse = require('../utils/api.response');

class UploadController {
    // POST /api/v1/upload/single?folder=products
    async uploadSingle(req, res, next) {
        try {
            if (!req.file) {
                const error = new Error('Vui lòng chọn file ảnh để upload');
                error.statusCode = 400;
                throw error;
            }

            const folder = req.query.folder || 'general';
            const result = await cloudinaryUtil.uploadImage(req.file.buffer, folder);

            return res.status(200).json(
                ApiResponse.success(200, 'Upload ảnh thành công', result)
            );
        } catch (error) {
            next(error);
        }
    }

    // POST /api/v1/upload/multiple?folder=products
    async uploadMultiple(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                const error = new Error('Vui lòng chọn ít nhất 1 file ảnh để upload');
                error.statusCode = 400;
                throw error;
            }

            const folder = req.query.folder || 'general';
            const results = await cloudinaryUtil.uploadMultipleImages(req.files, folder);

            return res.status(200).json(
                ApiResponse.success(200, 'Upload ảnh thành công', results)
            );
        } catch (error) {
            next(error);
        }
    }

    // DELETE /api/v1/upload
    // body: { public_id } hoặc { public_ids: [] }
    async deleteImage(req, res, next) {
        try {
            const { public_id, public_ids } = req.body;

            if (public_ids && Array.isArray(public_ids)) {
                await cloudinaryUtil.deleteMultipleImages(public_ids);
            } else if (public_id) {
                await cloudinaryUtil.deleteImage(public_id);
            } else {
                const error = new Error('Thiếu public_id hoặc public_ids');
                error.statusCode = 400;
                throw error;
            }

            return res.status(200).json(
                ApiResponse.success(200, 'Xoá ảnh thành công', null)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UploadController();