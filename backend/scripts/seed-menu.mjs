import { PrismaClient, dishes_availability, dishes_ingredient_data_status, dish_images_kind } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu Thực đơn Vị Việt vào TiDB Cloud...');

  // 1. Tạo Danh mục (Categories)
  console.log('📁 Tạo danh mục...');
  const catData = [
    { name: 'Món nước truyền thống', slug: 'mon-nuoc', sort_order: 1 },
    { name: 'Cơm & Món chính', slug: 'com-mon-chinh', sort_order: 2 },
    { name: 'Bánh mì & Ăn nhẹ', slug: 'banh-mi-an-nhe', sort_order: 3 },
    { name: 'Thức uống & Tráng miệng', slug: 'do-uong-trang-mieng', sort_order: 4 },
  ];

  const categories = {};
  for (const cat of catData) {
    const record = await prisma.categories.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sort_order: cat.sort_order, is_active: true },
      create: { name: cat.name, slug: cat.slug, sort_order: cat.sort_order, is_active: true },
    });
    categories[cat.slug] = record;
  }

  // 2. Tạo Tags
  console.log('🏷️ Tạo Tags đặc điểm món...');
  const tagsData = [
    { name: 'Bán chạy', code: 'ban-chay' },
    { name: 'Đặc sản Vị Việt', code: 'dac-san' },
    { name: 'Bữa sáng', code: 'bua-sang' },
    { name: 'Ít cay / Thanh đạm', code: 'it-cay' },
    { name: 'Món chay', code: 'mon-chay' },
  ];

  const tags = {};
  for (const t of tagsData) {
    const record = await prisma.tags.upsert({
      where: { code: t.code },
      update: { name: t.name },
      create: { name: t.name, code: t.code },
    });
    tags[t.code] = record;
  }

  // 3. Tạo Ingredients
  console.log('🥦 Tạo nguyên liệu & chất gây dị ứng...');
  const ingData = [
    { name: 'Thịt bò tươi', code: 'thit-bo', is_allergen: false },
    { name: 'Bánh phở tươi', code: 'banh-pho', is_allergen: false },
    { name: 'Thịt heo ba chỉ', code: 'thit-heo', is_allergen: false },
    { name: 'Tôm sú tươi', code: 'tom', is_allergen: true },
    { name: 'Đậu phộng / Lạc rang', code: 'dau-phong', is_allergen: true },
    { name: 'Trứng gà', code: 'trung-ga', is_allergen: true },
    { name: 'Bột mì (Gluten)', code: 'gluten', is_allergen: true },
  ];

  const ingredients = {};
  for (const ing of ingData) {
    const record = await prisma.ingredients.upsert({
      where: { code: ing.code },
      update: { name: ing.name, is_allergen: ing.is_allergen },
      create: { name: ing.name, code: ing.code, is_allergen: ing.is_allergen },
    });
    ingredients[ing.code] = record;
  }

  // 4. Tạo Món ăn (Dishes), Biến thể (Variants), Nhóm tùy chọn (Option Groups), Lựa chọn (Option Values)
  console.log('🍲 Khởi tạo món ăn chi tiết...');
  await prisma.dishes.updateMany({ data: { deleted_at: null, availability: dishes_availability.AVAILABLE } });

  // MÓN 1: Phở bò tái lăn gia truyền
  const phoBo = await prisma.dishes.upsert({
    where: { slug: 'pho-bo-tai-lan-gia-truyen' },
    update: {
      category_id: categories['mon-nuoc'].id,
      name: 'Phở bò tái lăn gia truyền',
      description: 'Phở bò tái lăn áp chảo thơm nức mùi tỏi, nước dùng ninh từ xương bò 12 tiếng cùng thảo mộc tự nhiên.',
      story: 'Bát phở bò tái lăn mang đậm phong vị Hà Thành. Thịt bò tươi thái mỏng được đảo nhanh tay trên chảo gang đỏ lửa cùng gừng và tỏi, giữ trọn độ mọng nước mềm ngọt.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      deleted_at: null,
      sort_order: 1,
    },
    create: {
      category_id: categories['mon-nuoc'].id,
      name: 'Phở bò tái lăn gia truyền',
      slug: 'pho-bo-tai-lan-gia-truyen',
      description: 'Phở bò tái lăn áp chảo thơm nức mùi tỏi, nước dùng ninh từ xương bò 12 tiếng cùng thảo mộc tự nhiên.',
      story: 'Bát phở bò tái lăn mang đậm phong vị Hà Thành. Thịt bò tươi thái mỏng được đảo nhanh tay trên chảo gang đỏ lửa cùng gừng và tỏi, giữ trọn độ mọng nước mềm ngọt.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      deleted_at: null,
      sort_order: 1,
    },
  });

  // Biến thể Phở
  await prisma.dish_variants.deleteMany({ where: { dish_id: phoBo.id } });
  await prisma.dish_variants.createMany({
    data: [
      { dish_id: phoBo.id, name: 'Tô vừa', price: 55000, is_active: true },
      { dish_id: phoBo.id, name: 'Tô lớn', price: 65000, is_active: true },
      { dish_id: phoBo.id, name: 'Tô đặc biệt (Nhiều thịt)', price: 75000, is_active: true },
    ],
  });

  // Nhóm tùy chọn Phở
  await prisma.option_values.deleteMany({ where: { dish_id: phoBo.id } });
  await prisma.option_groups.deleteMany({ where: { dish_id: phoBo.id } });

  const phoGroupCay = await prisma.option_groups.create({
    data: { dish_id: phoBo.id, name: 'Mức cay', min_select: 0, max_select: 1, is_active: true },
  });
  await prisma.option_values.createMany({
    data: [
      { group_id: phoGroupCay.id, dish_id: phoBo.id, name: 'Không cay', extra_price: 0 },
      { group_id: phoGroupCay.id, dish_id: phoBo.id, name: 'Cay nhẹ (Ớt tươi lát)', extra_price: 0 },
      { group_id: phoGroupCay.id, dish_id: phoBo.id, name: 'Cay nhiều (Tương ớt Bắc)', extra_price: 0 },
    ],
  });

  const phoGroupTopping = await prisma.option_groups.create({
    data: { dish_id: phoBo.id, name: 'Món ăn kèm & Topping', min_select: 0, max_select: 4, is_active: true },
  });
  await prisma.option_values.createMany({
    data: [
      { group_id: phoGroupTopping.id, dish_id: phoBo.id, name: 'Quẩy giòn (2 chiếc)', extra_price: 5000 },
      { group_id: phoGroupTopping.id, dish_id: phoBo.id, name: 'Trứng gà chần', extra_price: 8000 },
      { group_id: phoGroupTopping.id, dish_id: phoBo.id, name: 'Thịt bò xào lăn thêm', extra_price: 20000 },
      { group_id: phoGroupTopping.id, dish_id: phoBo.id, name: 'Bánh phở thêm', extra_price: 10000 },
    ],
  });

  // Ảnh Phở
  await prisma.dish_images.deleteMany({ where: { dish_id: phoBo.id } });
  await prisma.dish_images.createMany({
    data: [
      { dish_id: phoBo.id, asset_path: '/assets/dishes/pho-tai-lan-cover.webp', kind: dish_images_kind.COVER, alt_text: 'Bát phở bò tái lăn nghi ngút khói', sort_order: 1 },
      { dish_id: phoBo.id, asset_path: '/assets/dishes/pho-tai-lan-cutout.webp', kind: dish_images_kind.CUTOUT, alt_text: 'Tô phở tách nền cho scrollytelling', sort_order: 2 },
    ],
  });

  // Tags & Ingredients Phở
  await prisma.dish_tags.deleteMany({ where: { dish_id: phoBo.id } });
  await prisma.dish_tags.createMany({
    data: [
      { dish_id: phoBo.id, tag_id: tags['ban-chay'].id },
      { dish_id: phoBo.id, tag_id: tags['dac-san'].id },
      { dish_id: phoBo.id, tag_id: tags['bua-sang'].id },
    ],
  });

  await prisma.dish_ingredients.deleteMany({ where: { dish_id: phoBo.id } });
  await prisma.dish_ingredients.createMany({
    data: [
      { dish_id: phoBo.id, ingredient_id: ingredients['thit-bo'].id, note: 'Thịt bắp bò tươi nguyên chất' },
      { dish_id: phoBo.id, ingredient_id: ingredients['banh-pho'].id, note: 'Bánh phở làm từ gạo tẻ' },
      { dish_id: phoBo.id, ingredient_id: ingredients['trung-ga'].id, note: 'Tùy chọn trứng chần thêm' },
    ],
  });

  // MÓN 2: Bún chả Hà Nội nướng than hoa
  const bunCha = await prisma.dishes.upsert({
    where: { slug: 'bun-cha-ha-noi-nuong-than-hoa' },
    update: {
      category_id: categories['mon-nuoc'].id,
      name: 'Bún chả Hà Nội nướng than hoa',
      description: 'Chả miếng ba chỉ và chả băm nướng thơm lừng trên than hoa, kèm bát nước chấm đu đủ cà rốt chua ngọt.',
      story: 'Bí quyết nước chấm gia truyền cân bằng chua ngọt, hòa cùng mùi thơm khói bếp than hoa đặc trưng khó quên.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      sort_order: 2,
    },
    create: {
      category_id: categories['mon-nuoc'].id,
      name: 'Bún chả Hà Nội nướng than hoa',
      slug: 'bun-cha-ha-noi-nuong-than-hoa',
      description: 'Chả miếng ba chỉ và chả băm nướng thơm lừng trên than hoa, kèm bát nước chấm đu đủ cà rốt chua ngọt.',
      story: 'Bí quyết nước chấm gia truyền cân bằng chua ngọt, hòa cùng mùi thơm khói bếp than hoa đặc trưng khó quên.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      sort_order: 2,
    },
  });

  await prisma.dish_variants.deleteMany({ where: { dish_id: bunCha.id } });
  await prisma.dish_variants.createMany({
    data: [
      { dish_id: bunCha.id, name: 'Phần tiêu chuẩn', price: 60000, is_active: true },
      { dish_id: bunCha.id, name: 'Phần đặc biệt (Thêm nem)', price: 75000, is_active: true },
    ],
  });

  await prisma.dish_images.deleteMany({ where: { dish_id: bunCha.id } });
  await prisma.dish_images.create({
    data: { dish_id: bunCha.id, asset_path: '/assets/dishes/bun-cha-cover.webp', kind: dish_images_kind.COVER, alt_text: 'Bún chả nướng than hoa', sort_order: 1 },
  });

  await prisma.dish_tags.deleteMany({ where: { dish_id: bunCha.id } });
  await prisma.dish_tags.createMany({
    data: [
      { dish_id: bunCha.id, tag_id: tags['ban-chay'].id },
      { dish_id: bunCha.id, tag_id: tags['dac-san'].id },
    ],
  });

  // MÓN 3: Cơm tấm sườn bì chả Sài Gòn
  const comTam = await prisma.dishes.upsert({
    where: { slug: 'com-tam-suon-bi-cha-sai-gon' },
    update: {
      category_id: categories['com-mon-chinh'].id,
      name: 'Cơm tấm sườn bì chả Sài Gòn',
      description: 'Hạt cơm tấm thơm dẻo, sườn cốt lết ướp mật ong nướng vàng óng, bì heo thơm thính và chả trứng hấp béo ngậy.',
      story: 'Món ăn biểu tượng của đất phương Nam, ăn kèm mỡ hành tóp mỡ giòn rụm và chén nước mắm kẹo đậm đà.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      sort_order: 3,
    },
    create: {
      category_id: categories['com-mon-chinh'].id,
      name: 'Cơm tấm sườn bì chả Sài Gòn',
      slug: 'com-tam-suon-bi-cha-sai-gon',
      description: 'Hạt cơm tấm thơm dẻo, sườn cốt lết ướp mật ong nướng vàng óng, bì heo thơm thính và chả trứng hấp béo ngậy.',
      story: 'Món ăn biểu tượng của đất phương Nam, ăn kèm mỡ hành tóp mỡ giòn rụm và chén nước mắm kẹo đậm đà.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      sort_order: 3,
    },
  });

  await prisma.dish_variants.deleteMany({ where: { dish_id: comTam.id } });
  await prisma.dish_variants.createMany({
    data: [
      { dish_id: comTam.id, name: 'Cơm sườn nướng', price: 50000, is_active: true },
      { dish_id: comTam.id, name: 'Cơm sườn bì chả', price: 65000, is_active: true },
      { dish_id: comTam.id, name: 'Cơm tấm đặc biệt (Sườn, bì, chả, trứng)', price: 78000, is_active: true },
    ],
  });

  await prisma.dish_images.deleteMany({ where: { dish_id: comTam.id } });
  await prisma.dish_images.create({
    data: { dish_id: comTam.id, asset_path: '/assets/dishes/com-tam-cover.webp', kind: dish_images_kind.COVER, alt_text: 'Dĩa cơm tấm sườn bì chả thơm ngon', sort_order: 1 },
  });

  await prisma.dish_tags.deleteMany({ where: { dish_id: comTam.id } });
  await prisma.dish_tags.create({
    data: { dish_id: comTam.id, tag_id: tags['ban-chay'].id },
  });

  // MÓN 4: Bánh mì thịt xá xíu giòn tan
  const banhMi = await prisma.dishes.upsert({
    where: { slug: 'banh-mi-thit-xa-xiu-gion-tan' },
    update: {
      category_id: categories['banh-mi-an-nhe'].id,
      name: 'Bánh mì thịt xá xíu giòn tan',
      description: 'Vỏ bánh mì giòn rụm, nhân xá xíu đậm vị hòa quyện sốt bơ trứng béo ngậy và pate nhà làm.',
      story: 'Bánh mì nướng nóng hổi, kẹp dưa leo ngập giòn, rau răm thơm mát và ớt tươi đánh thức vị giác.',
      spicy_level: 1,
      ingredient_data_status: dishes_ingredient_data_status.PARTIAL,
      availability: dishes_availability.AVAILABLE,
      sort_order: 4,
    },
    create: {
      category_id: categories['banh-mi-an-nhe'].id,
      name: 'Bánh mì thịt xá xíu giòn tan',
      slug: 'banh-mi-thit-xa-xiu-gion-tan',
      description: 'Vỏ bánh mì giòn rụm, nhân xá xíu đậm vị hòa quyện sốt bơ trứng béo ngậy và pate nhà làm.',
      story: 'Bánh mì nướng nóng hổi, kẹp dưa leo ngập giòn, rau răm thơm mát và ớt tươi đánh thức vị giác.',
      spicy_level: 1,
      ingredient_data_status: dishes_ingredient_data_status.PARTIAL,
      availability: dishes_availability.AVAILABLE,
      sort_order: 4,
    },
  });

  await prisma.dish_variants.deleteMany({ where: { dish_id: banhMi.id } });
  await prisma.dish_variants.createMany({
    data: [
      { dish_id: banhMi.id, name: 'Ổ tiêu chuẩn', price: 30000, is_active: true },
      { dish_id: banhMi.id, name: 'Ổ đặc biệt (Nhiều thịt & pate)', price: 40000, is_active: true },
    ],
  });

  await prisma.dish_images.deleteMany({ where: { dish_id: banhMi.id } });
  await prisma.dish_images.create({
    data: { dish_id: banhMi.id, asset_path: '/assets/dishes/banh-mi-cover.webp', kind: dish_images_kind.COVER, alt_text: 'Ổ bánh mì giòn rụm thơm lừng', sort_order: 1 },
  });

  await prisma.dish_tags.deleteMany({ where: { dish_id: banhMi.id } });
  await prisma.dish_tags.createMany({
    data: [
      { dish_id: banhMi.id, tag_id: tags['bua-sang'].id },
      { dish_id: banhMi.id, tag_id: tags['ban-chay'].id },
    ],
  });

  // MÓN 5: Trà sen vàng long nhãn
  const traSen = await prisma.dishes.upsert({
    where: { slug: 'tra-sen-vang-long-nhan' },
    update: {
      category_id: categories['do-uong-trang-mieng'].id,
      name: 'Trà sen vàng long nhãn',
      description: 'Trà ô long ướp hoa sen thanh nhã, kết hợp hạt sen hầm mềm bùi và long nhãn ngọt thanh giải nhiệt.',
      story: 'Vị trà thanh dịu kết hợp lớp kem phô mai béo nhẹ hoặc uống thanh mát, giúp cân bằng hoàn hảo sau bữa ăn đậm vị.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      sort_order: 5,
    },
    create: {
      category_id: categories['do-uong-trang-mieng'].id,
      name: 'Trà sen vàng long nhãn',
      slug: 'tra-sen-vang-long-nhan',
      description: 'Trà ô long ướp hoa sen thanh nhã, kết hợp hạt sen hầm mềm bùi và long nhãn ngọt thanh giải nhiệt.',
      story: 'Vị trà thanh dịu kết hợp lớp kem phô mai béo nhẹ hoặc uống thanh mát, giúp cân bằng hoàn hảo sau bữa ăn đậm vị.',
      spicy_level: 0,
      ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
      availability: dishes_availability.AVAILABLE,
      sort_order: 5,
    },
  });

  await prisma.dish_variants.deleteMany({ where: { dish_id: traSen.id } });
  await prisma.dish_variants.createMany({
    data: [
      { dish_id: traSen.id, name: 'Ly vừa (Size M)', price: 35000, is_active: true },
      { dish_id: traSen.id, name: 'Ly lớn (Size L)', price: 45000, is_active: true },
    ],
  });

  await prisma.option_values.deleteMany({ where: { dish_id: traSen.id } });
  await prisma.option_groups.deleteMany({ where: { dish_id: traSen.id } });

  const traGroupDa = await prisma.option_groups.create({
    data: { dish_id: traSen.id, name: 'Lượng đá', min_select: 1, max_select: 1, is_active: true },
  });
  await prisma.option_values.createMany({
    data: [
      { group_id: traGroupDa.id, dish_id: traSen.id, name: '100% Đá', extra_price: 0 },
      { group_id: traGroupDa.id, dish_id: traSen.id, name: '50% Đá', extra_price: 0 },
      { group_id: traGroupDa.id, dish_id: traSen.id, name: 'Không đá', extra_price: 0 },
    ],
  });

  const traGroupDuong = await prisma.option_groups.create({
    data: { dish_id: traSen.id, name: 'Lượng đường', min_select: 1, max_select: 1, is_active: true },
  });
  await prisma.option_values.createMany({
    data: [
      { group_id: traGroupDuong.id, dish_id: traSen.id, name: '100% Đường (Chuẩn vị)', extra_price: 0 },
      { group_id: traGroupDuong.id, dish_id: traSen.id, name: '70% Đường', extra_price: 0 },
      { group_id: traGroupDuong.id, dish_id: traSen.id, name: '50% Đường (Ít ngọt)', extra_price: 0 },
      { group_id: traGroupDuong.id, dish_id: traSen.id, name: 'Không đường', extra_price: 0 },
    ],
  });

  await prisma.dish_images.deleteMany({ where: { dish_id: traSen.id } });
  await prisma.dish_images.create({
    data: { dish_id: traSen.id, asset_path: '/assets/dishes/tra-sen-cover.webp', kind: dish_images_kind.COVER, alt_text: 'Ly trà sen vàng long nhãn mát lạnh', sort_order: 1 },
  });

  await prisma.dish_tags.deleteMany({ where: { dish_id: traSen.id } });
  await prisma.dish_tags.createMany({
    data: [
      { dish_id: traSen.id, tag_id: tags['it-cay'].id },
      { dish_id: traSen.id, tag_id: tags['ban-chay'].id },
    ],
  });

  console.log('🎉 NẠP THỰC ĐƠN MẪU THÀNH CÔNG!');
}

main()
  .catch((e) => {
    console.error('❌ LỖI SEED DATA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

