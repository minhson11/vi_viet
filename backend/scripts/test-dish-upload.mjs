import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { MenuAdminController } from '../dist/modules/menu/controllers/menu-admin.controller.js';
import { PrismaService } from '../dist/database/prisma.service.js';

async function testUpload() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ UPLOAD ẢNH MÓN ĂN VÀO CLOUDINARY...\n');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const adminController = app.get(MenuAdminController);
  const prisma = app.get(PrismaService);

  try {
    // 1. Tìm một món ăn bất kỳ để test
    const dish = await prisma.dishes.findFirst({
      where: { deleted_at: null },
    });
    if (!dish) {
      throw new Error('Không tìm thấy món ăn nào để test upload!');
    }
    console.log(`📌 Chọn món test: "${dish.name}" (ID: ${dish.id})`);

    // 2. Tạo file ảnh giả lập (1x1 PNG)
    const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(samplePngBase64, 'base64');
    const mockFile = {
      fieldname: 'file',
      originalname: 'test-dish-upload.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: buffer,
      size: buffer.length,
    };

    const uploadDto = {
      kind: 'GALLERY',
      alt_text: 'Ảnh test upload tích hợp Cloudinary',
      sort_order: 99,
    };

    console.log('\n--- Test 1: Upload ảnh qua endpoint adminController.uploadDishImage ---');
    const uploadedRecord = await adminController.uploadDishImage(dish.id.toString(), mockFile, uploadDto);

    console.log('✅ Kết quả trả về:', uploadedRecord);

    if (!uploadedRecord.id) throw new Error('Không có ID ảnh được tạo trong CSDL');
    if (!uploadedRecord.asset_path.includes('res.cloudinary.com')) {
      throw new Error(`Đường dẫn ảnh không phải Cloudinary URL: ${uploadedRecord.asset_path}`);
    }
    console.log(`✅ Đã lưu vào CSDL dish_images với ID: ${uploadedRecord.id}`);
    console.log(`✅ Asset URL trên Cloudinary: ${uploadedRecord.asset_path}`);

    // 3. Kiểm tra query lại danh sách ảnh của món
    console.log('\n--- Test 2: Kiểm tra danh sách ảnh của món ---');
    const images = await adminController.getDishImages(dish.id.toString());
    const found = images.find(img => img.id.toString() === uploadedRecord.id.toString());
    if (!found) throw new Error('Không tìm thấy ảnh vừa upload trong danh sách dish_images');
    console.log(`✅ Ảnh vừa upload tồn tại trong danh sách ảnh của món (Tổng cộng: ${images.length} ảnh)`);

    // 4. Test dọn dẹp (xóa ảnh vừa test)
    console.log('\n--- Test 3: Xóa ảnh test và tự động dọn dẹp Cloudinary ---');
    await adminController.deleteDishImage(dish.id.toString(), uploadedRecord.id.toString());
    console.log(`✅ Đã xóa ảnh ID: ${uploadedRecord.id} thành công!`);

    const imagesAfterDelete = await adminController.getDishImages(dish.id.toString());
    const stillExists = imagesAfterDelete.some(img => img.id.toString() === uploadedRecord.id.toString());
    if (stillExists) throw new Error('Ảnh vẫn còn tồn tại trong CSDL sau khi xóa!');
    console.log(`✅ Xác nhận ảnh đã không còn trong CSDL.`);

    console.log('\n🎉 TẤT CẢ KIỂM THỬ UPLOAD ẢNH MENU THÀNH CÔNG 100%!');
  } catch (error) {
    console.error('❌ Lỗi kiểm thử:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

testUpload();

