// test-notification.js (đặt ở thư mục gốc project, cùng cấp package.json)
require('dotenv').config();
const mongoose = require('mongoose');
const notificationService = require('./src/services/notification.service');

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Thay bằng 1 user _id thật trong DB của bạn (bất kỳ, kể cả customer)
    const testUserId = '6a472a7668bab1624f5c9e89';

    const result = await notificationService.notifyRole('staff', {
        type: 'system',
        title: 'Test broadcast staff',
        message: 'Test gửi cho toàn bộ staff'
    });
    console.log('Số lượng notification tạo ra:', result.length);
    console.log('Chi tiết:', result);

    process.exit(0);
}

test().catch(err => {
    console.error('LỖI:', err);
    process.exit(1);
});