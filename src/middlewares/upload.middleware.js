const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp)');
        error.statusCode = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB / ảnh
});

module.exports = {
    uploadSingle: upload.single('image'),       // 1 ảnh, field name = "image"
    uploadMultiple: upload.array('images', 10)  // nhiều ảnh, field name = "images", tối đa 10
};