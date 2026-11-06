import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Đọc .env thủ công
const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ Không tìm thấy file .env!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const getEnvVal = (key) => {
  const match = envContent.match(new RegExp(`^${key}=\\s*([^\\r\\n]+)`, 'm'));
  return match ? match[1].trim() : null;
};

const cloudName = getEnvVal('CLOUDINARY_CLOUD_NAME');
const apiKey = getEnvVal('CLOUDINARY_API_KEY');
const apiSecret = getEnvVal('CLOUDINARY_API_SECRET');
const uploadPreset = getEnvVal('CLOUDINARY_UPLOAD_PRESET') || 'vi_viet';

console.log('🔍 THÔNG SỐ CẤU HÌNH CLOUDINARY:');
console.log(` - Cloud Name:     ${cloudName}`);
console.log(` - API Key:        ${apiKey ? apiKey.slice(0, 6) + '...' : 'Thiếu'}`);
console.log(` - API Secret:     ${apiSecret ? '****** (Đã nhập)' : 'Thiếu'}`);
console.log(` - Upload Preset:  ${uploadPreset}`);

if (!cloudName || !apiKey || !apiSecret) {
  console.error('\n❌ Thiếu một trong các biến môi trường Cloudinary!');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function checkCloudinary() {
  console.log('\n📡 Đang gửi request kiểm tra kết nối đến máy chủ Cloudinary...');
  try {
    // 1. Kiểm tra Ping API
    const pingResult = await cloudinary.api.ping();
    console.log('✅ 1. PING THÀNH CÔNG:', pingResult);

    // 2. Lấy thông tin tài khoản / usage
    const usageResult = await cloudinary.api.usage();
    console.log('✅ 2. XÁC THỰC TÀI KHOẢN HỢP LỆ!');
    console.log(` - Gói dịch vụ (Plan): ${usageResult.plan}`);

    // 3. Thử upload ảnh mẫu với upload_preset = vi_viet
    console.log(`\n📤 3. Thử nghiệm Upload với Preset: [${uploadPreset}]...`);
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadResult = await cloudinary.uploader.upload(sampleBase64, {
      upload_preset: uploadPreset,
      public_id: 'preset_test_' + Date.now(),
    });
    console.log(`✅ UPLOAD THÀNH CÔNG VỚI PRESET [${uploadPreset}]!`);
    console.log(` - URL ảnh: ${uploadResult.secure_url}`);
    console.log(` - Public ID: ${uploadResult.public_id}`);

    // Dọn dẹp ảnh test
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('🧹 Đã xóa file test dọn dẹp thư mục.');

    console.log(`\n🎉 TẤT CẢ KIỂM TRA ĐỀU THÀNH CÔNG! PRESET [${uploadPreset}] HOẠT ĐỘNG HOÀN HẢO!`);
  } catch (error) {
    console.error(`\n❌ KIỂM TRA PRESET [${uploadPreset}] THẤT BẠI!`);
    console.error('Chi tiết lỗi:', error.message || error);
    if (error.error) console.error('Cloudinary Error Detail:', error.error);
    process.exit(1);
  }
}

checkCloudinary();
