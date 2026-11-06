import { Test } from '@nestjs/testing';
import { AppModule } from '../dist/app.module.js';
import { MenuPublicController } from '../dist/modules/menu/controllers/menu-public.controller.js';
import { MenuAdminController } from '../dist/modules/menu/controllers/menu-admin.controller.js';
import { DishesService } from '../dist/modules/menu/services/dishes.service.js';
import { PrismaService } from '../dist/database/prisma.service.js';

async function verify() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CHỨC NĂNG MODULE MENU...\n');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const publicController = app.get(MenuPublicController);
  const adminController = app.get(MenuAdminController);
  const dishesService = app.get(DishesService);
  const prisma = app.get(PrismaService);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, description) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${description}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${description}`);
    }
  }

  try {
    // ==========================================
    // 1. KIỂM THỬ DANH MỤC (CATEGORIES)
    // ==========================================
    console.log('--- 1. Quản lý Danh mục (Categories) ---');
    const publicCategories = await publicController.getCategories();
    assert(publicCategories.length >= 4, `Lấy được ${publicCategories.length} danh mục công khai (mong đợi >= 4)`);
    assert(publicCategories[0].name !== undefined, `Danh mục có tên: ${publicCategories[0]?.name}`);
    assert(publicCategories[0]._count?.dishes !== undefined, `Đếm được số món ăn trong danh mục: ${publicCategories[0]?._count?.dishes}`);

    const adminCategories = await adminController.getAllCategories();
    assert(adminCategories.length >= publicCategories.length, `Admin lấy toàn bộ ${adminCategories.length} danh mục`);

    // Tạo danh mục mới
    const newCat = await adminController.createCategory({
      name: 'Món Cuốn & Trộn ' + Date.now(),
      sort_order: 8,
    });
    assert(newCat.id !== undefined, `Admin tạo danh mục mới thành công ID: ${newCat.id}`);

    // Cập nhật danh mục
    const updatedCat = await adminController.updateCategory(newCat.id.toString(), {
      name: 'Món Cuốn Gia Truyền',
    });
    assert(updatedCat.name === 'Món Cuốn Gia Truyền', `Cập nhật tên danh mục thành công: ${updatedCat.name}`);

    // ==========================================
    // 2. KIỂM THỬ MÓN ĂN & BIẾN THỂ (DISHES & VARIANTS)
    // ==========================================
    console.log('\n--- 2. Tạo món ăn & Biến thể ban đầu (BR-03) ---');
    const newDish = await adminController.createDish({
      category_id: newCat.id.toString(),
      name: 'Gỏi cuốn tôm thịt đặc sản ' + Date.now(),
      description: 'Gỏi cuốn thanh mát với tôm tươi và thịt heo',
      spicy_level: 0,
      ingredient_data_status: 'VERIFIED',
      default_variant: {
        name: 'Phần 3 cuốn',
        price: 45000,
      },
    });
    assert(newDish.id !== undefined, `Tạo món ăn thành công ID: ${newDish.id}`);
    assert(newDish.default_variant !== undefined, 'Tạo kèm biến thể mặc định để bảo đảm BR-03 thành công');

    // Thêm biến thể thứ 2
    const var2 = await adminController.createVariant(newDish.id.toString(), {
      name: 'Phần 5 cuốn lớn',
      price: 70000,
      is_active: true,
    });
    assert(var2.id !== undefined, `Thêm biến thể thứ hai thành công: ${var2.name} (70.000đ)`);

    // Sửa giá biến thể
    const updatedVar2 = await adminController.updateVariant(newDish.id.toString(), var2.id.toString(), {
      price: 75000,
    });
    assert(Number(updatedVar2.price) === 75000, `Cập nhật giá biến thể thành công: ${Number(updatedVar2.price)}đ`);

    // Xóa biến thể phụ an toàn (vẫn còn biến thể mặc định active)
    await adminController.deleteVariant(newDish.id.toString(), var2.id.toString());
    const remainingVariants = await adminController.getVariants(newDish.id.toString());
    assert(remainingVariants.length === 1, `Xóa biến thể phụ thành công, còn lại ${remainingVariants.length} biến thể`);

    // ==========================================
    // 3. KIỂM THỬ NHÓM TÙY CHỌN & LỰA CHỌN (OPTIONS)
    // ==========================================
    console.log('\n--- 3. Nhóm tùy chọn & Lựa chọn (Option Groups & Values) ---');
    const group = await adminController.createOptionGroup(newDish.id.toString(), {
      name: 'Chọn nước chấm',
      min_select: 1,
      max_select: 2,
    });
    assert(group.id !== undefined, `Tạo nhóm tùy chọn thành công ID: ${group.id}`);

    const val1 = await adminController.createOptionValue(newDish.id.toString(), group.id.toString(), {
      name: 'Tương đậu phộng đặc chế',
      extra_price: 0,
    });
    const val2 = await adminController.createOptionValue(newDish.id.toString(), group.id.toString(), {
      name: 'Nước mắm chua ngọt',
      extra_price: 3000,
    });
    assert(val1.id !== undefined && val2.id !== undefined, 'Thêm 2 lựa chọn vào nhóm thành công');

    const groupsWithValues = await adminController.getOptionGroups(newDish.id.toString());
    assert(groupsWithValues[0].option_values.length === 2, `Lấy được 2 lựa chọn trong nhóm ${groupsWithValues[0].name}`);

    // ==========================================
    // 4. GÁN TAGS & NGUYÊN LIỆU (TAGS & INGREDIENTS)
    // ==========================================
    console.log('\n--- 4. Gán Tags & Thành phần nguyên liệu ---');
    const sampleTags = await prisma.tags.findMany({ take: 2 });
    if (sampleTags.length >= 2) {
      // Gán tags kèm khử trùng lặp (Audit Fix 6)
      const assignedTags = await adminController.assignTags(newDish.id.toString(), {
        tag_ids: [sampleTags[0].id.toString(), sampleTags[0].id.toString(), sampleTags[1].id.toString()],
      });
      assert(assignedTags.length === 2, `Gán tags thành công và tự động khử trùng lặp (${assignedTags.length} tags)`);
    }

    const sampleIngs = await prisma.ingredients.findMany({ take: 1 });
    if (sampleIngs.length >= 1) {
      const assignedIngs = await adminController.assignIngredients(newDish.id.toString(), {
        ingredients: [{ ingredient_id: sampleIngs[0].id.toString(), note: 'Tôm tươi làm sạch' }],
      });
      assert(assignedIngs.length === 1, `Gán nguyên liệu thành công: ${assignedIngs[0]?.note}`);
    }

    // ==========================================
    // 5. QUẢN LÝ ẢNH MÓN ĂN (DISH IMAGES)
    // ==========================================
    console.log('\n--- 5. Quản lý Hình ảnh món ăn ---');
    const imgRecord = await adminController.addDishImage(newDish.id.toString(), {
      asset_path: 'https://res.cloudinary.com/vi-viet/image/upload/v1/test-image.jpg',
      kind: 'COVER',
      alt_text: 'Ảnh bìa test',
      sort_order: 1,
    });
    assert(imgRecord.id !== undefined, `Thêm ảnh đại diện COVER thành công ID: ${imgRecord.id}`);

    const dishImages = await adminController.getDishImages(newDish.id.toString());
    assert(dishImages.length >= 1, `Lấy danh sách ảnh món thành công (${dishImages.length} ảnh)`);

    await adminController.deleteDishImage(newDish.id.toString(), imgRecord.id.toString());
    const afterDelImages = await adminController.getDishImages(newDish.id.toString());
    assert(afterDelImages.length === 0, 'Xóa ảnh món ăn thành công');

    // ==========================================
    // 6. KHÁCH HÀNG: XEM THỰC ĐƠN, LỌC & TÌM KIẾM
    // ==========================================
    console.log('\n--- 6. Khách hàng xem thực đơn & Lọc món ---');
    const allDishes = await publicController.getDishes({});
    assert(allDishes.items.length >= 5, `Khách hàng lấy được ${allDishes.items.length} món ăn công khai`);
    assert(allDishes.items[0].starting_price !== undefined, `Món ăn hiển thị starting_price tối ưu: ${allDishes.items[0]?.starting_price}đ`);

    const filteredPho = await publicController.getDishes({ search: 'Phở' });
    assert(filteredPho.items.length >= 1, `Tìm kiếm từ khóa "Phở" ra ${filteredPho.items.length} món`);

    const detailPho = await publicController.getDishBySlug('pho-bo-tai-lan-gia-truyen');
    assert(detailPho.name === 'Phở bò tái lăn gia truyền', `Xem chi tiết món theo slug: ${detailPho.name}`);
    assert(detailPho.variants.length >= 1, `Eager load ${detailPho.variants.length} biến thể`);
    assert(detailPho.option_groups.length >= 1, `Eager load ${detailPho.option_groups.length} nhóm tùy chọn`);

    // ==========================================
    // 7. XÓA MỀM & GIẢI PHÓNG SLUG (BR-33 & AUDIT FIX 3)
    // ==========================================
    console.log('\n--- 7. Xóa mềm BR-33 & Giải phóng Slug ---');
    const softDelResult = await dishesService.softDelete(newDish.id.toString());
    assert(softDelResult.deleted_at !== null, 'deleted_at đã được gán thời gian');
    assert(softDelResult.availability === 'HIDDEN', 'Trạng thái chuyển thành HIDDEN');
    assert(softDelResult.slug.includes('_del_'), `Slug đã được giải phóng hậu tố timestamp: ${softDelResult.slug}`);

    // Tạo lại món mới có cùng slug ban đầu xem có thành công không
    const recreatedDish = await adminController.createDish({
      category_id: newCat.id.toString(),
      name: newDish.name,
      slug: newDish.slug,
      default_variant: { name: 'Tiêu chuẩn', price: 45000 },
    });
    assert(recreatedDish.slug === newDish.slug, `Tạo lại món mới có cùng slug thành công không bị kẹt: ${recreatedDish.slug}`);

    // Dọn dẹp bản ghi tạm
    await prisma.dish_variants.deleteMany({ where: { dish_id: recreatedDish.id } });
    await prisma.dishes.delete({ where: { id: recreatedDish.id } });
    await prisma.option_values.deleteMany({ where: { dish_id: newDish.id } });
    await prisma.option_groups.deleteMany({ where: { dish_id: newDish.id } });
    await prisma.dish_tags.deleteMany({ where: { dish_id: newDish.id } });
    await prisma.dish_ingredients.deleteMany({ where: { dish_id: newDish.id } });
    await prisma.dish_variants.deleteMany({ where: { dish_id: newDish.id } });
    await prisma.dishes.delete({ where: { id: newDish.id } });
    await adminController.deleteCategory(newCat.id.toString());
    assert(true, 'Hoàn tất dọn dẹp sạch sẽ toàn bộ bản ghi test tạm');

    console.log(`\n========================================`);
    console.log(`KẾT QUẢ: ${passedTests}/${totalTests} TESTS CHỨC NĂNG ĐẠT YÊU CẦU! 🎉`);
    console.log(`========================================`);

  } finally {
    await app.close();
  }
}

verify().catch((e) => {
  console.error('❌ Lỗi khi chạy kiểm thử:', e);
  process.exit(1);
});
