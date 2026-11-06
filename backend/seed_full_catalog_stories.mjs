import { PrismaClient, dishes_ingredient_data_status, dishes_availability, dish_images_kind, story_sections_animation_preset } from '@prisma/client';

const prisma = new PrismaClient();

// Bộ dữ liệu 5 danh mục x 5 món = 25 món ăn truyền thống Việt Nam
const CATALOG_DATA = [
  // --- DANH MỤC 1: MÓN NƯỚC TRUYỀN THỐNG (categoryId: 1) ---
  {
    categoryId: 1n,
    categorySlug: 'mon-nuoc',
    categoryName: 'Món nước truyền thống',
    dishes: [
      {
        name: 'Phở Bò Tái Lăn Hà Thành',
        slug: 'pho-bo-tai-lan-ha-thanh',
        description: 'Thịt bò tươi xào tái lăn trên chảo gang lửa lớn cùng tỏi đập dập và hành hoa thơm nức, chan ngập nước dùng ninh ống tủy 48 giờ thảo mộc hồi quế thơm ngào ngạt.',
        story: 'Khởi nguồn từ góc phố Bát Đàn và Lò Đúc, phở bò tái lăn là sự thăng hoa của kỹ thuật điều lửa điêu luyện. Từng thớ thịt bò mềm mọng giữ trọn độ ngọt tự nhiên, hòa quyện trong làn nước dùng óng ánh tủy bò ninh chậm và vị tiêu Bắc cay the làm say lòng thực khách.',
        spicyLevel: 1,
        sortOrder: 1,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Tô phở bò tái lăn Hà Thành bốc khói ngập tràn hành hoa',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Nước dùng phở bò trong veo sóng sánh thảo mộc hoa hồi quế chi',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Thịt bò tươi thái mỏng xào tái lăn lửa bùng cùng hành tây',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh lát thịt bò tái lăn mềm ngọt và sợi bánh phở dẻo dai',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Tô Tiêu Chuẩn Phố Cổ', price: 65000, sortOrder: 1 },
          { name: 'Tô Đặc Biệt Tái Lăn Gầu Giòn', price: 85000, sortOrder: 2 },
          { name: 'Tô Thượng Hạng Thăn Bò Wagyu', price: 125000, sortOrder: 3 },
        ],
        optionGroups: [
          {
            name: 'Món Ăn Kèm Chuẩn Vị Phở',
            minSelect: 0,
            maxSelect: 4,
            options: [
              { name: 'Quẩy Giòn Vàng Ruộm (3 chiếc)', extraPrice: 10000 },
              { name: 'Trứng Gà Ta Chần Lòng Đào', extraPrice: 12000 },
              { name: 'Thêm Gầu Bò Giòn Hoa', extraPrice: 25000 },
              { name: 'Tiết Luộc Hành Trần Nước Béo', extraPrice: 10000 },
            ],
          },
          {
            name: 'Khẩu Vị Nước Dùng',
            minSelect: 0,
            maxSelect: 1,
            options: [
              { name: 'Nước Dùng Béo Ngậy Thơm Hành Hoa', extraPrice: 0 },
              { name: 'Nước Dùng Thanh Trong Ít Mỡ', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Bún Bò Huế Cố Đô Chân Giò Chả Cua',
        slug: 'bun-bo-hue-co-do',
        description: 'Nước dùng cay nồng thơm lừng hương sả ruốc Huế đặc trưng, sợi bún to trơn bóng, thịt bò bắp hoa giòn sần sật, khoanh chân giò ninh mềm nhừ cùng chả cua vàng ươm.',
        story: 'Món ăn đượm phong vị trầm mặc đất Thần Kinh. Vị ngọt thanh của xương hầm quyện với mùi thơm cay nồng nàn của ớt sa tế và mắm ruốc chưng tạo nên một khúc ca hương vị nồng hậu khó quên.',
        spicyLevel: 2,
        sortOrder: 2,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Tô bún bò Huế đầy ắp chân giò chả cua sa tế đỏ au',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Chân giò hầm mềm, bắp bò hoa và chả cua nặn tay béo ngậy',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Đĩa rau ghém hoa chuối bào sợi, giá đỗ và chanh ớt tươi',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh viên chả cua xứ Huế đỏ hồng thơm phức',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Tô Thập Cẩm Đầy Đặn', price: 68000, sortOrder: 1 },
          { name: 'Tô Đặc Biệt Khoanh Giò Bắp Bò', price: 88000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Bổ Sung',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Thêm Chả Cua Huế Hấp', extraPrice: 18000 },
              { name: 'Thêm Khoanh Chân Giò Rút Xương', extraPrice: 22000 },
              { name: 'Thêm Huyết Luộc Mềm', extraPrice: 8000 },
            ],
          },
        ],
      },
      {
        name: 'Bún Chả Hà Nội Nướng Than Hoa',
        slug: 'bun-cha-ha-noi-nuong-than',
        description: 'Chả miếng ba chỉ giòn rụm và chả viên băm nướng vàng xém cạnh trên vỉ than hồng đỏ rực, chấm ngập bát nước mắm chua ngọt ấm nóng kèm đu đủ cà rốt giòn giòn.',
        story: 'Nét tinh tế tao nhã của người Tràng An nằm trọn trong mẹt bún chả. Mùi khói than hoa đượm vào từng thớ thịt ướp hành tiêu nước hàng, ăn cùng bún rối mát lành và rau sống kinh giới thơm lừng.',
        spicyLevel: 0,
        sortOrder: 3,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Bát thịt chả nướng than hoa óng ả nước mắm chua ngọt',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Mâm bún chả Hà Nội đầy đủ bún lá, dưa góp và rau thơm',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Chả miếng nướng vàng ươm xèo xèo mỡ trên than hồng',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh miếng chả viên nướng mật mía mềm thơm',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Suất Tiêu Chuẩn Chả Nướng', price: 60000, sortOrder: 1 },
          { name: 'Suất Đặc Biệt Kèm Nem Cua Bể', price: 85000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Gọi Thêm',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Nem Cua Bể Hải Phòng (1 chiếc)', extraPrice: 20000 },
              { name: 'Thêm Phần Chả Nướng Thập Cẩm', extraPrice: 25000 },
              { name: 'Thêm Đĩa Bún Rối Tươi', extraPrice: 8000 },
            ],
          },
        ],
      },
      {
        name: 'Hủ Tiếu Nam Vang Sườn Tôm Tươi',
        slug: 'hu-tieu-nam-vang-my-tho',
        description: 'Sợi hủ tiếu dai mướt đậm đà nước hầm tôm khô mực nướng, tôm sú tươi ngọt, thịt băm xào tỏi phi thơm nức mũi và trứng cút bùi béo.',
        story: 'Giao thoa văn hóa ẩm thực phương Nam trù phú. Bát hủ tiếu với nước dùng trong vắt ngọt lịm từ xương ống và củ cải muối, hòa cùng vị thơm ngậy của tỏi phi tóp mỡ làm mê mẩn mọi lứa tuổi.',
        spicyLevel: 0,
        sortOrder: 4,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Tô hủ tiếu Nam Vang đầy đủ tôm mực sườn non thịt băm',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Tôm sú tươi đỏ au bóc nõn và thịt băm xào tỏi thơm',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Sợi hủ tiếu dai mướt kết hợp rau cần tây hẹ xanh',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Miếng sườn non hầm mềm rục ngấm trọn nước dùng ngọt thanh',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Hủ Tiếu Nước Truyền Thống', price: 65000, sortOrder: 1 },
          { name: 'Hủ Tiếu Khô Sốt Gia Truyền Kèm Chén Súp', price: 70000, sortOrder: 2 },
          { name: 'Tô Thượng Hạng Tôm Sú Càng Lớn', price: 95000, sortOrder: 3 },
        ],
        optionGroups: [
          {
            name: 'Topping Thêm',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Thêm Tôm Sú Bóc Nõn Tươi', extraPrice: 25000 },
              { name: 'Thêm Sườn Cây Non Hầm Mềm', extraPrice: 20000 },
              { name: 'Tóp Mỡ Tỏi Phi Giòn Rụm', extraPrice: 10000 },
            ],
          },
        ],
      },
      {
        name: 'Miến Lươn Xứ Nghệ Giòn Rụm',
        slug: 'mien-luon-xu-nghe-gion',
        description: 'Lươn đồng chiên giòn rụm tẩm ướp tiêu ớt đậm đà, miến dong dai mướt ngấm nước hầm xương lươn ngọt đậm cùng rau răm thơm nồng.',
        story: 'Đặc sản xứ Nghệ trứ danh với vị ngọt tự nhiên của lươn đồng tự nhiên. Sợi miến dong đỏ nấu khéo léo giữ nguyên độ dai giòn sần sật, hòa quyện với rau răm cay ấm tạo nên cảm giác ấm lòng giữa tiết trời se lạnh.',
        spicyLevel: 1,
        sortOrder: 5,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Bát miến lươn giòn vàng óng rau răm hạt tiêu cay',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Lươn đồng xào mềm nghệ vàng óng đậm đà gia vị',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Thịt lươn chiên giòn rụm tẩm bột nghệ vàng tươi',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh miếng lươn giòn tan vàng rộm ngấm sốt',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Miến Lươn Trộn Chua Cay Đặc Sắc', price: 65000, sortOrder: 1 },
          { name: 'Miến Lươn Nước Dùng Xương Hầm', price: 65000, sortOrder: 2 },
          { name: 'Tô Thượng Hạng Lươn Giòn & Lươn Mềm', price: 89000, sortOrder: 3 },
        ],
        optionGroups: [
          {
            name: 'Topping Miến Lươn',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Đĩa Lươn Chiên Giòn Rụm', extraPrice: 30000 },
              { name: 'Trứng Chần Lòng Đào Nước Dùng', extraPrice: 12000 },
            ],
          },
        ],
      },
    ],
  },

  // --- DANH MỤC 2: CƠM & MÓN CHÍNH (categoryId: 2) ---
  {
    categoryId: 2n,
    categorySlug: 'com-mon-chinh',
    categoryName: 'Cơm & Món chính',
    dishes: [
      {
        name: 'Cơm Tấm Sườn Bì Chả Trứng Ốp La Sài Gòn',
        slug: 'com-tam-suon-bi-cha-dac-biet',
        description: 'Hạt cơm tấm thơm lừng mỡ hành tóp mỡ giòn, miếng sườn cốt lết dày dặn nướng mật ong vàng óng, chả trứng hấp bùi béo, bì heo trộn thính thơm và trứng ốp la lòng đào tan chảy.',
        story: 'Linh hồn của ẩm thực đường phố Sài Gòn phương Nam. Miếng sườn cốt lết được ướp sả ớt, mật ong và nước tương gia truyền, nướng trực tiếp trên than đước đỏ rực xém cạnh tỏa hương thơm nức mũi cả góc phố.',
        spicyLevel: 0,
        sortOrder: 1,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa cơm tấm sườn bì chả mỡ hành trứng ốp la đượm sốt mắm kẹo',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Miếng sườn cốt lết nướng mật ong vàng ươm xém than hồng',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Chả trứng hấp nấm mèo hoàng kim mềm mịn và bì trộn thính',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh lát sườn cốt lết nướng đậm đà sốt mật ong',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Đĩa Tiêu Chuẩn Sườn Cốt Lết', price: 55000, sortOrder: 1 },
          { name: 'Đĩa Thập Cẩm Sườn Bì Chả Trứng', price: 75000, sortOrder: 2 },
          { name: 'Cơm Tấm Sườn Cây Khổng Lồ', price: 95000, sortOrder: 3 },
        ],
        optionGroups: [
          {
            name: 'Topping Cơm Tấm',
            minSelect: 0,
            maxSelect: 4,
            options: [
              { name: 'Thêm Sườn Cốt Lết Nướng Than', extraPrice: 35000 },
              { name: 'Miếng Chả Trứng Hấp Hoàng Kim', extraPrice: 15000 },
              { name: 'Trứng Ốp La Lòng Đào Tan Chảy', extraPrice: 10000 },
              { name: 'Canh Khổ Qua Nhồi Thịt Nóng', extraPrice: 20000 },
            ],
          },
        ],
      },
      {
        name: 'Cơm Gà Hội An Niêu Đất Gà Ta Xé Sợi',
        slug: 'com-ga-hoi-an-nieu-dat',
        description: 'Cơm nấu từ nước luộc gà béo ngậy vàng ươm sắc nghệ, thịt gà ta thả vườn da giòn thịt ngọt xé sợi bóp gỏi hành tây rau răm rắc tiêu rừng thơm ngát.',
        story: 'Nét duyên dáng thanh tao của phố cổ Hội An. Từng hạt gạo dẻo thơm ngấm trọn mỡ gà béo ngậy, phối hợp ăn ý với vị chua thanh của hành tây ngâm giấm và tương ớt xào Triều Phát cay dịu dàng.',
        spicyLevel: 1,
        sortOrder: 2,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa cơm gà Hội An hạt cơm vàng óng thịt gà xé phay rau răm',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Gà ta thả vườn luộc vàng mướt bóp gỏi hành tây giòn',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Bát súp lòng mề trứng non nóng hổi thơm mùi lá chanh',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Miếng đùi gà ta da vàng giòn sần sật thịt ngọt đậm',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Cơm Gà Xé Phay Truyền Thống', price: 65000, sortOrder: 1 },
          { name: 'Cơm Đùi Gà Góc Tư Hoàng Kim', price: 85000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Cơm Gà',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Thêm Đĩa Gỏi Gà Xé Bóp Hành', extraPrice: 30000 },
              { name: 'Trứng Non Lòng Mề Rim Mặn Ngọt', extraPrice: 25000 },
              { name: 'Thêm Cơm Niêu Nấu Nước Gà', extraPrice: 15000 },
            ],
          },
        ],
      },
      {
        name: 'Cá Bống Kho Tộ Nước Hàng Sốt Tiêu Rừng',
        slug: 'ca-bong-kho-to-tieu-rung',
        description: 'Cá bống tươi béo rim trong tộ đất liu riu nhỏ lửa cho đến khi thịt săn chắc, nước sốt kẹo lại đậm vị ngọt mặn cay nồng tiêu sọ Phú Quốc.',
        story: 'Bữa cơm sum vầy truyền thống bên bếp lửa mẹ nấu. Tộ đất giữ nhiệt sôi liu riu tỏa hương thơm mộc mạc của nước mắm nhĩ và tiêu rừng, ăn cùng cơm niêu cháy giòn hai mặt là phong vị tuyệt đỉnh.',
        spicyLevel: 1,
        sortOrder: 3,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Tộ đất cá bống kho tiêu sệt óng ánh ớt chỉ thiên',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Cá kho tộ đất đun liu riu ngấm đẫm nước sốt nâu cánh gián',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Đĩa rau luộc thập cẩm xanh mướt chấm kho quẹt tôm khô',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Con cá bống kho săn chắc đậm đà hạt tiêu đen',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Phần Cá Kho Tộ Tiêu Chuẩn', price: 75000, sortOrder: 1 },
          { name: 'Set Cơm Niêu Cá Kho & Canh Rau Đay Cua Đồng', price: 110000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Món Kèm Cơm Niêu',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Cơm Niêu Cháy Giòn 2 Mặt', extraPrice: 20000 },
              { name: 'Rau Luộc Thập Cẩm Chấm Kho Quẹt', extraPrice: 25000 },
              { name: 'Canh Chua Cá Bớp Nấu Khế', extraPrice: 35000 },
            ],
          },
        ],
      },
      {
        name: 'Bò Kho Niêu Gốm Gia Truyền Bánh Mì Nóng',
        slug: 'bo-kho-nieu-gom-banh-mi',
        description: 'Nạm bò và gân bò hoa hầm mềm rục cùng cà rốt trong nước sốt thảo mộc hoa hồi sả cay sánh ngậy thơm lừng, dùng kèm bánh mì giòn tan rụm.',
        story: 'Hương vị giao thoa ấm áp của ẩm thực Việt. Từng thớ thịt bò gân hoa ninh nhừ nhưng vẫn giữ độ sần sật mọng nước, hòa quyện trong làn nước sốt màu hồng ngọc sánh mịn thơm mùi sả đập dập.',
        spicyLevel: 1,
        sortOrder: 4,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1547496502-affa22d38842?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Niêu bò kho sánh đỏ húng quế ớt sừng bánh mì nóng',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Thịt nạm bò và gân bò hoa ninh mềm béo ngậy',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Ổ bánh mì nướng vàng giòn rụm bên niêu sốt bò kho nóng hổi',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Miếng gân bò hoa trong veo mềm dẻo ngấm sốt vang đỏ',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Bò Kho Bánh Mì Nướng Giòn', price: 68000, sortOrder: 1 },
          { name: 'Bò Kho Ăn Kèm Cơm Trắng Dẻo', price: 68000, sortOrder: 2 },
          { name: 'Hủ Tiếu Bò Kho Đậm Đà', price: 72000, sortOrder: 3 },
        ],
        optionGroups: [
          {
            name: 'Topping Bò Kho',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Phần Nạm Bò & Gân Giòn', extraPrice: 30000 },
              { name: 'Thêm 2 Ổ Bánh Mì Nướng Nóng', extraPrice: 12000 },
            ],
          },
        ],
      },
      {
        name: 'Sườn Non Rim Mật Mía Tây Bắc Cay Ngọt',
        slug: 'suon-non-rim-mat-mia-tay-bac',
        description: 'Dẻ sườn non heo chặt khúc nhỏ chiên vàng đều, rim liu riu cùng mật mía cô đặc nguyên chất, ớt chỉ thiên và hạt dổi rừng cay thơm nồng nàn.',
        story: 'Bản sắc đại ngàn kết hợp cùng nguyên liệu tự nhiên thuần khiết. Mật mía ngọt thơm đượm màu hổ phách ôm trọn lấy dẻ sườn non béo ngậy, tạo nên món ăn đưa cơm bậc nhất.',
        spicyLevel: 1,
        sortOrder: 5,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa sườn non rim mật mía óng ánh màu cánh gián rắc vừng rang',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Sườn non đảo chảo sốt mật mía hạt dổi sánh kẹo',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Dẻ sườn heo mọng nước thơm mùi tiêu sả',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Từng miếng sườn róc xương đậm đà sốt cay ngọt',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Phần Nhỏ (Dành cho 1-2 người)', price: 89000, sortOrder: 1 },
          { name: 'Phần Lớn Sum Vầy Gia Đình', price: 145000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Ăn Kèm Thêm',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Thố Cơm Trắng Niêu Gang', extraPrice: 15000 },
              { name: 'Canh Chua Sườn Non Nấu Dọc Mùng', extraPrice: 30000 },
            ],
          },
        ],
      },
    ],
  },

  // --- DANH MỤC 3: BÁNH MÌ & ĂN NHẸ (categoryId: 3) ---
  {
    categoryId: 3n,
    categorySlug: 'banh-mi-an-nhe',
    categoryName: 'Bánh mì & Ăn nhẹ',
    dishes: [
      {
        name: 'Bánh Mì Thập Cẩm Pate Gan Phố Cổ Hà Nội',
        slug: 'banh-mi-thap-cam-pate-pho-co',
        description: 'Ổ bánh mì nướng lò vỏ vàng giòn rụm ruột xốp mềm, quết đẫm pate gan béo ngậy gia truyền, bơ trứng thơm lừng, thịt xá xíu, giò lụa, dưa góp giòn tan và sốt ớt cay cay.',
        story: 'Biểu tượng ẩm thực đường phố được vinh danh khắp thế giới. Bánh mì của chúng tôi giữ vẹn nguyên công thức pate gan hấp cách thủy 8 tiếng theo lối thủ công Hà thành xưa, đem đến hương vị ngậy béo nồng nàn mà tao nhã.',
        spicyLevel: 1,
        sortOrder: 1,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Ổ bánh mì Việt Nam kẹp đầy ắp pate xá xíu dưa leo rau mùi',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1600490036275-35f5f1656861?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Lớp pate gan béo ngậy trét dày cùng bơ vàng trứng gà',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Vỏ bánh mì nướng lò than giòn rụm vỡ tan khi cắn',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh miếng xá xíu đỏ hồng đậm đà bên lớp pate mịn',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Ổ Tiêu Chuẩn Truyền Thống', price: 35000, sortOrder: 1 },
          { name: 'Ổ Đặc Biệt Gấp Đôi Pate Xá Xíu', price: 48000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Kẹp Thêm',
            minSelect: 0,
            maxSelect: 4,
            options: [
              { name: 'Thêm Lớp Pate Gan Béo Gia Truyền', extraPrice: 10000 },
              { name: 'Trứng Ốp La Lòng Đào', extraPrice: 10000 },
              { name: 'Thêm Miếng Phô Mai Bò Cười', extraPrice: 8000 },
              { name: 'Thêm Thịt Xá Xíu Nướng', extraPrice: 12000 },
            ],
          },
        ],
      },
      {
        name: 'Bánh Mì Chảo Bò Bít Tết Trứng Lòng Đào Xíu Mại',
        slug: 'banh-mi-chao-bo-bit-tet-trung',
        description: 'Chiếc chảo gang nóng hổi xèo xèo gồm thịt bò mềm áp chảo sốt tiêu đen, viên xíu mại tôm thịt đẫm sốt cà chua, trứng ốp la béo ngậy và pate áp chảo thơm lừng.',
        story: 'Bữa sáng tràn đầy năng lượng gắn liền với giới trẻ. Từng ổ bánh mì nóng giòn rụm xé chấm ngập trong nước sốt tiêu đen béo sánh, quyện cùng lòng đỏ trứng gà chảy sóng sánh ngon khó cưỡng.',
        spicyLevel: 1,
        sortOrder: 2,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Chảo gang bánh mì chảo bò bít tết trứng xíu mại sôi xèo xèo',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Viên xíu mại tôm thịt đẫm nước sốt cà chua đỏ tươi',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Ổ bánh mì giòn tan xé chấm nước sốt sánh mịn đậm vị',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Lòng đỏ trứng gà tan chảy trên miếng thịt bò mềm mọng',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Chảo Đầy Đủ Xíu Mại Trứng Pate', price: 55000, sortOrder: 1 },
          { name: 'Chảo Thượng Hạng Bò Bít Tết Phô Mai Kéo Sợi', price: 75000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Món Thêm Cho Chảo',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Thêm Bánh Mì Nướng Nóng Giòn', extraPrice: 6000 },
              { name: 'Thêm Viên Xíu Mại Sốt Cà', extraPrice: 15000 },
              { name: 'Phô Mai Mozzarella Tan Chảy', extraPrice: 12000 },
            ],
          },
        ],
      },
      {
        name: 'Bánh Mì Thịt Nướng Sả Mật Ong Sài Gòn',
        slug: 'banh-mi-thit-nuong-sa-mat-ong',
        description: 'Thịt nạc vai heo ướp sả ớt mật ong nướng than hoa vàng rộm xém cạnh, kẹp cùng đồ chua cà rốt củ cải trắng giòn sần sật và nước tương đen thơm bùi.',
        story: 'Mùi khói thịt nướng lan tỏa khắp con hẻm nhỏ Sài Gòn mỗi độ xế chiều. Vị ngọt đậm đà của thịt nướng than quyện cùng độ giòn thanh mát của dưa góp tạo nên bữa ăn nhẹ hoàn hảo.',
        spicyLevel: 1,
        sortOrder: 3,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Ổ bánh mì kẹp xiên thịt nướng sả mật ong than hoa thơm lừng',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Xiên thịt nạc vai ướp sả nướng trên than hồng rực lửa',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1600490036275-35f5f1656861?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Đồ chua củ cải cà rốt giòn ngọt rưới nước sốt bơ béo',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Lát thịt nướng óng ả màu mật ong vàng rộm',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Ổ Tiêu Chuẩn Thịt Nướng Sả', price: 35000, sortOrder: 1 },
          { name: 'Ổ Thịt Nướng Gấp Đôi Kèm Chả Lụa', price: 50000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Kèm',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Xiên Thịt Nướng Sả Mật Ong', extraPrice: 15000 },
              { name: 'Thêm Chả Lụa Chiên Giòn', extraPrice: 10000 },
            ],
          },
        ],
      },
      {
        name: 'Xôi Xéo Mỡ Hành Gà Xé Nấm Hương Cố Đô',
        slug: 'xoi-xeo-mo-hanh-ga-xe-nam-huong',
        description: 'Hạt nếp cái hoa vàng dẻo thơm nhuộm vàng bột nghệ, bào mỏng từng lát đỗ xanh bùi ngậy, rưới mỡ hành phi thơm nức mũi và thịt gà ta xé phay xào nấm hương.',
        story: 'Món quà sớm đong đầy ký ức của người Hà Nội. Hạt xôi nếp bóng bẩy dẻo quánh, từng lát đỗ xanh thái mỏng tơi xốp tan trong miệng, phủ ngập hành phi tự phi vàng giòn rụm.',
        spicyLevel: 0,
        sortOrder: 4,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Gói xôi xéo vàng óng rải đỗ xanh bào mỏng hành phi gà xé',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Hành phi vàng giòn ruộm thơm nức mũi tự tay phi thủ công',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Thịt gà xé sợi xào nấm hương nấm đông cô thơm lừng',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Hạt nếp nương dẻo quánh vàng ươm màu nghệ tự nhiên',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Gói Tiêu Chuẩn Đậu Xanh Hành Phi', price: 30000, sortOrder: 1 },
          { name: 'Gói Đặc Biệt Gà Xé Nấm Hương Chả Quế', price: 52000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Xôi Xéo',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Thêm Gà Xé Phay Xào Nấm Hương', extraPrice: 18000 },
              { name: 'Thêm Chả Quế Nướng Vàng', extraPrice: 12000 },
              { name: 'Thêm Hành Phi Giòn Rụm', extraPrice: 6000 },
            ],
          },
        ],
      },
      {
        name: 'Bánh Bao Thượng Hạng Nhân Xá Xíu Trứng Cút Hoàng Kim',
        slug: 'banh-bao-xa-xiu-trung-cut',
        description: 'Vỏ bánh bao trắng mịn tơi xốp ủ men tự nhiên, nhân thịt nạc vai xá xíu đậm đà quyện mộc nhĩ giòn sần sật và hai quả trứng cút luộc bùi béo.',
        story: 'Thức ăn nhẹ ấm bụng trong những buổi sớm mai hay xế chiều muộn. Bánh được hấp nóng hổi trong xửng tre truyền thống, giữ trọn độ ẩm mịn màng và nước sốt nhân ngọt ngào đậm đà.',
        spicyLevel: 0,
        sortOrder: 5,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Xửng tre bánh bao trắng mềm nóng hổi nghi ngút khói',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Bánh bao bẻ đôi lộ rõ nhân thịt xá xíu mộc nhĩ trứng cút',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Xửng hấp bánh bao thủ công truyền thống tỏa hơi thơm',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh vỏ bánh mềm mịn như bông và nhân thịt sốt',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Bánh Bao Xá Xíu Trứng Cút', price: 25000, sortOrder: 1 },
          { name: 'Bánh Bao Thượng Hạng Trứng Muối Lạp Xưởng', price: 32000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Tùy Chọn Nhân',
            minSelect: 0,
            maxSelect: 1,
            options: [
              { name: 'Nhân Xá Xíu Truyền Thống', extraPrice: 0 },
              { name: 'Nhân Bò Phô Mai Sốt Tiêu Đen', extraPrice: 8000 },
            ],
          },
        ],
      },
    ],
  },

  // --- DANH MỤC 4: THỨC UỐNG & TRÁNG MIỆNG (categoryId: 4) ---
  {
    categoryId: 4n,
    categorySlug: 'do-uong-trang-mieng',
    categoryName: 'Thức uống & Tráng miệng',
    dishes: [
      {
        name: 'Trà Sen Vàng Long Nhãn Băng Tuyết',
        slug: 'tra-sen-vang-long-nhan',
        description: 'Trà Ô Long thanh mát hòa quyện hạt sen tươi Tây Hồ bùi bở ninh đường phèn, nhãn lồng cùi dày mọng nước và lớp củ năng giòn sần sật mát lạnh.',
        story: 'Thức uống thanh tao giải nhiệt mùa hè. Hương thơm dìu dịu của hoa sen Tây Hồ kết hợp cùng vị ngọt mát của long nhãn Hưng Yên, mang lại cảm giác an yên và sảng khoái sau mỗi bữa ăn.',
        spicyLevel: 0,
        sortOrder: 1,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Ly trà sen vàng óng ánh lớp kem và hạt sen bùi bở',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Hạt sen Tây Hồ hầm mềm bở tơi trong nước đường phèn',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Củ năng bọc bột lọc giòn sần sật hòa trong đá lạnh tuyết',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh hạt sen vàng óng và long nhãn giòn ngọt thanh',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Ly Vừa Size M (500ml)', price: 45000, sortOrder: 1 },
          { name: 'Ly Lớn Size L (700ml)', price: 55000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Trà Sen',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Thêm Hạt Sen Ninh Đường Phèn', extraPrice: 10000 },
              { name: 'Thêm Long Nhãn Cùi Dày Giòn', extraPrice: 10000 },
              { name: 'Thạch Củ Năng Giòn Sần Sật', extraPrice: 8000 },
            ],
          },
          {
            name: 'Mức Độ Ngọt & Đá',
            minSelect: 0,
            maxSelect: 1,
            options: [
              { name: '100% Đường Phèn - 100% Đá', extraPrice: 0 },
              { name: '70% Đường Phèn - 70% Đá Mát', extraPrice: 0 },
              { name: '50% Ngọt Thanh - Ít Đá', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Cà Phê Trứng Hà Nội Béo Ngậy',
        slug: 'ca-phe-trung-ha-noi',
        description: 'Cốt cà phê Robusta Đắk Lắk nguyên chất đắng đậm đà, bên trên phủ lớp kem trứng đánh bông mịn như mây béo ngậy thơm nồng vani không hề tanh.',
        story: 'Nét văn hóa cà phê độc bản của thủ đô. Ra đời từ những năm 1946 tại phố cổ, cà phê trứng là sự hòa quyện kỳ diệu giữa vị đắng nồng của cà phê phin và sự mịn màng, ngọt béo của lòng đỏ trứng gà tươi.',
        spicyLevel: 0,
        sortOrder: 2,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Tách cà phê trứng Hà Nội lớp kem bọt vàng óng ngâm trong bát nước nóng',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Kem trứng đánh bông thủ công mịn màng sánh như nhung',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Cốt cà phê phin đậm đặc chảy từng giọt chậm rãi',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Thìa kem trứng bồng bềnh béo ngậy ngọt ngào',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Cà Phê Trứng Nóng Truyền Thống', price: 45000, sortOrder: 1 },
          { name: 'Cà Phê Trứng Đá Mát Lạnh', price: 48000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Thêm Hương Vị',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Lớp Kem Trứng Bông Mịn', extraPrice: 15000 },
              { name: 'Thêm 1 Shot Espresso Đậm Đà', extraPrice: 12000 },
            ],
          },
        ],
      },
      {
        name: 'Chè Hạt Sen Long Nhãn Cố Đô Huế',
        slug: 'che-hat-sen-long-nhan-co-do',
        description: 'Hạt sen Huế hạt nhỏ thơm bùi được lồng khéo léo vào từng cùi nhãn ngọt lịm, nấu trong nước đường phèn thanh tao ướp hoa bưởi thoang thoảng.',
        story: 'Món tráng miệng cung đình quý phái bậc nhất xứ Huế. Từng viên sen lồng nhãn trong suốt như ngọc bích, vị ngọt thanh mát tan dần nơi đầu lưỡi mang theo phong vị nhã nhặn kinh thành.',
        spicyLevel: 0,
        sortOrder: 3,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Bát chè hạt sen long nhãn trong veo ướp hoa bưởi thanh khiết',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Hạt sen bở bùi lồng gọn trong cùi nhãn trắng giòn',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Nước đường phèn ninh hoa nhài thơm ngát dịu dàng',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Viên sen lồng nhãn óng ánh nước đường phèn trong suốt',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Bát Chè Nóng Thanh Cảnh', price: 38000, sortOrder: 1 },
          { name: 'Bát Chè Ướp Lạnh Băng Tuyết', price: 40000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Kèm',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Nước Cốt Dừa Thơm Béo', extraPrice: 8000 },
              { name: 'Thạch Hoa Đậu Biếc Thanh Mát', extraPrice: 8000 },
            ],
          },
        ],
      },
      {
        name: 'Nước Ép Cóc Ổi Hồng Muối Ớt Tuyết',
        slug: 'nuoc-ep-coc-oi-hong-muoi-tuyet',
        description: 'Cóc non và ổi hồng ruột đào ép nguyên chất 100%, chua ngọt thanh tự nhiên giàu vitamin C, viền miệng ly muối tôm Tây Ninh hồng cay nồng.',
        story: 'Sự bùng nổ vị giác sảng khoái của trái cây nhiệt đới tươi mới. Vị chua thanh giòn tan của cóc non quyện với hương thơm ngát của ổi hồng đào, điểm xuyết hạt muối ớt cay tê lưỡi.',
        spicyLevel: 1,
        sortOrder: 4,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Ly nước ép cóc ổi màu hồng cam rực rỡ viền miệng muối ớt',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Ổi hồng đào và cóc non tươi cắt lát thơm mọng nước',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Nước ép trái cây tươi mát lạnh giải nhiệt tức thì',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Hạt muối tôm Tây Ninh hồng tuyết cay nồng viền miệng ly',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Ly Tiêu Chuẩn 500ml', price: 42000, sortOrder: 1 },
          { name: 'Bình Lớn Thưởng Thức 1000ml', price: 65000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Muối Viền Miệng Ly',
            minSelect: 0,
            maxSelect: 1,
            options: [
              { name: 'Muối Tôm Tây Ninh Truyền Thống', extraPrice: 0 },
              { name: 'Muối Ớt Tuyết Cay Nồng', extraPrice: 0 },
              { name: 'Không Viền Muối Ớt', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Tàu Hũ Nóng Nước Đường Gừng Trân Châu',
        slug: 'tau-hu-nong-nuoc-duong-gung',
        description: 'Tàu hũ non mềm mịn mướt tan ngay nơi đầu lưỡi, chan nước đường mật mía nấu gừng tươi ấm nồng, kèm trân châu đường đen dẻo dai sần sật.',
        story: 'Thức quà vặt gắn liền với ký ức tuổi thơ trên những gánh hàng rong buổi chiều. Từng lát đậu hũ trắng ngà bốc khói nghi ngút, ấm nồng vị gừng cay dịu xua tan mọi mỏi mệt.',
        spicyLevel: 0,
        sortOrder: 5,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Chén tàu hũ non trắng mềm chan nước đường gừng trân châu đen',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Nước đường mật mía thơm lừng từng lát gừng già đập dập',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Trân châu đường đen dai dẻo sánh đậm vị mật ngọt',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Thìa tàu hũ non mịn màng bốc khói ấm áp',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Chén Tàu Hũ Nóng Truyền Thống', price: 28000, sortOrder: 1 },
          { name: 'Thố Thập Cẩm Trân Châu & Cốt Dừa Béo', price: 38000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Topping Tàu Hũ',
            minSelect: 0,
            maxSelect: 3,
            options: [
              { name: 'Trân Châu Đường Đen Dẻo Dai', extraPrice: 8000 },
              { name: 'Nước Cốt Dừa Ép Béo Ngậy', extraPrice: 6000 },
              { name: 'Thạch Dừa Non Giòn', extraPrice: 8000 },
            ],
          },
        ],
      },
    ],
  },

  // --- DANH MỤC 5: MÓN CUỘN & GỎI CẢI TIẾN (categoryId: 5593371) ---
  {
    categoryId: 5593371n,
    categorySlug: 'mon-cuon-goi-cai-tien',
    categoryName: 'Món Cuốn & Gỏi Cải Tiến',
    dishes: [
      {
        name: 'Gỏi Cuốn Tôm Thịt Nam Bộ Sốt Tương Bơ Đậu Phộng',
        slug: 'goi-cuon-tom-thit-nam-bo',
        description: 'Bánh tráng phơi sương mỏng dẻo cuộn tôm sú đỏ au, thịt ba chỉ luộc thái mỏng, bún tươi và hẹ xanh rau thơm, chấm sốt tương đen bơ đậu phộng béo bùi rắc hành phi.',
        story: 'Món ăn thanh đạm trứ danh của miền đất phù sa Nam Bộ. Sự cân bằng tuyệt hảo giữa tôm thịt giàu đạm và rau thơm tươi mát, chấm ngập trong chén tương đậu béo ngậy tạo nên trải nghiệm ẩm thực tinh khôi.',
        spicyLevel: 0,
        sortOrder: 1,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa gỏi cuốn tôm thịt bánh tráng trong suốt lộ rõ tôm đỏ au',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Rau xà lách, rau thơm kinh giới và hẹ xanh tươi mơn mởn',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Chén tương đen bơ đậu phộng rắc ớt băm và hành phi vàng',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Cận cảnh cuống tôm sú luộc căng mọng và thịt ba chỉ mềm',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Phần 3 Cuốn Ăn Nhẹ', price: 45000, sortOrder: 1 },
          { name: 'Mẹt 5 Cuốn Lớn Thỏa Thích', price: 70000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Loại Nước Chấm',
            minSelect: 0,
            maxSelect: 1,
            options: [
              { name: 'Tương Đen Bơ Đậu Phộng Béo Bùi', extraPrice: 0 },
              { name: 'Nước Mắm Chua Ngọt Tỏi Ớt Miền Tây', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Phở Cuốn Bò Áp Chảo Rau Thơm Ngũ Xã',
        slug: 'pho-cuon-bo-ap-chao-ngu-xa',
        description: 'Lá bánh phở mỏng dai mướt cuộn thịt thăn bò xào áp chảo thơm lừng tỏi hoa, rau xà lách, rau mùi kinh giới, chấm nước mắm pha chua ngọt chuẩn vị phố cổ.',
        story: 'Sáng tạo tài hoa của những người con làng đúc đồng Ngũ Xã bên hồ Trúc Bạch. Thịt bò áp chảo đậm vị được gói trọn trong bánh phở mềm mượt, mang lại cảm giác thanh mát nhẹ nhàng.',
        spicyLevel: 0,
        sortOrder: 2,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa phở cuốn trắng ngần cuộn thịt bò và rau sống tươi mát',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Rau thơm xà lách kinh giới rửa sạch tươi giòn',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Thịt bò thăn thái mỏng áp chảo tỏi hoa thơm nức',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Chén nước chấm chua ngọt đu đủ cà rốt tỏi ớt băm nhuyễn',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Đĩa 5 Cuốn Phố Cổ', price: 55000, sortOrder: 1 },
          { name: 'Mẹt 10 Cuốn Gia Đình Sum Vầy', price: 98000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Ăn Kèm Thêm',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Chén Nước Chấm Đu Đủ Chua Ngọt', extraPrice: 8000 },
              { name: 'Đĩa Phở Chiên Phồng Xào Bò', extraPrice: 45000 },
            ],
          },
        ],
      },
      {
        name: 'Nem Lụi Nướng Sả Cố Đô Huế Bánh Tráng Rau Rừng',
        slug: 'nem-lui-nuong-sa-co-do-hue',
        description: 'Thịt heo xay nhuyễn quết dẻo bọc quanh thân cây sả tươi, nướng vàng xém trên than hồng tỏa hương ngào ngạt, cuốn bánh tráng rau rừng chấm nước lèo bùi ngậy.',
        story: 'Nét tinh túy của ẩm thực cung đình pha lẫn phong vị dân gian cố đô. Nước lèo chấm nem lụi nấu từ gan heo, đậu phộng rang và tương đậu nành sánh mịn làm tôn vinh vị thơm của thịt nướng sả.',
        spicyLevel: 1,
        sortOrder: 3,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Mẹt nem lụi quấn thân cây sả nướng than hoa vàng rộm',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Nem lụi nướng xém cạnh thơm nức mùi sả tươi',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Mâm rau sống rau rừng đa dạng kèm bánh tráng cuốn',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Bát nước lèo gan heo đậu phộng béo bùi đặc trưng xứ Huế',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Phần Tiêu Chuẩn 6 Cây Nem Lụi', price: 65000, sortOrder: 1 },
          { name: 'Phần Lớn 10 Cây Nem Lụi No Say', price: 98000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Gọi Thêm',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm 2 Cây Nem Lụi Nướng Sả', extraPrice: 22000 },
              { name: 'Đĩa Rau Rừng & Bánh Tráng Cuốn', extraPrice: 15000 },
            ],
          },
        ],
      },
      {
        name: 'Bò Bía Nam Bộ Lạp Xưởng Trứng Sợi',
        slug: 'bo-bia-nam-bo-lap-xuong',
        description: 'Bánh tráng mỏng cuộn củ sắn luộc ngọt nước, lạp xưởng nướng thái lát mỏng, trứng gà tráng sợi vàng óng, ruốc tôm thơm phức và rau thơm chấm tương đen cay cay.',
        story: 'Món ăn vặt tuổi thơ đầy ắp kỷ niệm của bao thế hệ Sài Gòn. Từng cuốn nhỏ xinh mộc mạc mang vị ngọt giòn sần sật của củ sắn luộc và vị mằn mặn béo ngậy của lạp xưởng nướng than.',
        spicyLevel: 1,
        sortOrder: 4,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa bò bía cuộn lạp xưởng trứng sợi chấm sốt tương đen',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Củ sắn luộc ngọt nước rau thơm cuộn trong bánh tráng mỏng',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Chén tương đen rắc đậu phộng rang giòn và ớt sa tế',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Lạp xưởng nướng thơm ngọt thái lát mỏng óng ả',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Đĩa 4 Cuốn Nhỏ Nhẹ', price: 35000, sortOrder: 1 },
          { name: 'Đĩa 8 Cuốn Thỏa Thích Cùng Bạn Bè', price: 65000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Gia Vị Chấm',
            minSelect: 0,
            maxSelect: 1,
            options: [
              { name: 'Tương Đen Ngọt Đậu Phộng Tỏi Phi', extraPrice: 0 },
              { name: 'Nước Mắm Me Chua Cay Sệt', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Chạo Tôm Bọc Mía Nướng Than Hồng Giòn Ngọt',
        slug: 'chao-tom-boc-mia-nuong-than',
        description: 'Tôm sú tươi quết dẻo dai bọc tròn quanh thanh mía lau mọng nước, nướng chín tới trên than hồng thơm lừng, thịt tôm ngấm vị ngọt thanh tao tự nhiên của mía lau.',
        story: 'Món ăn tiệc trang trọng và quý phái của vùng đất phương Nam. Vị ngọt đậm đà của tôm sú biển cả hòa quyện cùng từng giọt nước mía thanh ngọt tiết ra trong làn khói nướng tạo nên dư vị khó quên.',
        spicyLevel: 0,
        sortOrder: 5,
        images: [
          {
            assetPath: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.COVER,
            altText: 'Đĩa chạo tôm bọc thanh mía lau nướng than hoa vàng ươm',
            sortOrder: 0,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Tôm sú quết dai nướng vàng giòn mọng nước ngọt ngào',
            sortOrder: 1,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.GALLERY,
            altText: 'Mâm chạo tôm ăn kèm bánh hỏi mỡ hành và rau sống',
            sortOrder: 2,
          },
          {
            assetPath: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
            kind: dish_images_kind.CUTOUT,
            altText: 'Thanh mía lau nướng ngấm trọn vị tôm sú biển ngọt thanh',
            sortOrder: 3,
          },
        ],
        variants: [
          { name: 'Đĩa 4 Cây Chạo Tôm', price: 75000, sortOrder: 1 },
          { name: 'Mẹt Chạo Tôm Cuốn Bánh Hỏi Mỡ Hành', price: 115000, sortOrder: 2 },
        ],
        optionGroups: [
          {
            name: 'Món Kèm Bánh Hỏi',
            minSelect: 0,
            maxSelect: 2,
            options: [
              { name: 'Thêm Đĩa Bánh Hỏi Mỡ Hành Tươi', extraPrice: 18000 },
              { name: 'Thêm Nước Chấm Chua Ngọt Đặc Biệt', extraPrice: 8000 },
            ],
          },
        ],
      },
    ],
  },
];

// Định nghĩa 3 Storytelling Sections nghệ thuật cho 3 danh mục đầu
const STORIES_DATA = [
  {
    categoryIndex: 0, // Món nước truyền thống
    mainDishIndex: 0, // Phở Bò Tái Lăn Hà Thành
    chapterLabel: 'Tinh Hoa Nước Dùng Di Sản',
    headlineTitle: 'Hơi Thở Sông Hồng & Niềm Kiêu Hãnh Nước Dùng 48 Giờ',
    headlineHighlight: 'Thảo Quả, Quế Hồi & Nước Hầm Xương Khói Trầm',
    badgeTag: 'Signature Tasting · Nước Dùng Di Sản',
    themeColor: 'terracotta',
    animationPreset: story_sections_animation_preset.ROLL_LEFT,
    animationType: 'roll',
    badgeTop: 'Nước Dùng Ninh 48H',
    badgeBottom: '100% Tinh Hoa Thảo Mộc',
    description:
      'Khởi nguồn từ những gánh phở rong kĩu kịt sớm đông Hà Nội, nghệ thuật nấu phở của chúng tôi là sự chắt chiu suốt 48 giờ từ ống tủy bò hảo hạng và thảo mộc tự nhiên. Từng muỗng nước dùng thanh trong, đậm đà mà không ngấy, tỏa khói trầm ấm đánh thức mọi giác quan của người thưởng ẩm.',
    flavors: {
      top: 'Hương hoa hồi nướng, quế chi ấm nồng quyện gừng già nướng than đập dập thơm lừng',
      heart: 'Vị ngọt sâu từ tủy xương bò ninh chậm 48 giờ, béo ngậy thanh tao không một gợn mỡ thừa',
      base: 'Hậu vị ngọt thảo quả, mộc mạc hạt tiêu Phú Quốc cay nhẹ lưu luyến nơi cuống họng',
    },
    ctaLabel: 'Khám Phá Di Sản Nước Dùng',
    sortOrder: 1,
  },
  {
    categoryIndex: 1, // Cơm & Món chính
    mainDishIndex: 0, // Cơm Tấm Sườn Bì Chả Trứng Ốp La Sài Gòn
    chapterLabel: 'Bếp Mẹ Yêu Thương',
    headlineTitle: 'Hạt Ngọc Trời Nam & Bếp Lửa Gia Đình Việt',
    headlineHighlight: 'Niêu Đất Cháy Giòn & Mùi Gạo Tấm Thơm Ngào Ngạt',
    badgeTag: 'Cơm Niêu Di Sản · Tinh Hoa Bếp Việt',
    themeColor: 'gold',
    animationPreset: story_sections_animation_preset.SLIDE_RIGHT,
    animationType: '3dflip',
    badgeTop: 'Gạo Tấm Thơm Nồng',
    badgeBottom: 'Than Hồng Đỏ Lửa',
    description:
      'Cơm tấm – từ thức quà mộc mạc của người lao động phương Nam nay đã trở thành biểu tượng ẩm thực vang danh quốc tế. Từng hạt gạo tấm nhỏ nhắn dẻo thơm, quyện cùng miếng sườn cốt lết tẩm ướp mật ong nướng xém than hồng, chả trứng hấp bùi ngậy và thìa mỡ hành tóp mỡ béo bùi tái hiện trọn vẹn phong vị góc phố Sài Gòn xưa.',
    flavors: {
      top: 'Mùi sườn nướng mật ong xém than hoa nức mũi quyện hành phi béo ngậy thơm lừng',
      heart: 'Vị ngọt đậm đà thịt ướp sả ớt mật mía, chả trứng hấp mềm tan bùi bùi nấm mèo',
      base: 'Nước mắm kẹo chua ngọt gia truyền sánh đậm đọng lại hậu vị ngọt ngào nơi đầu lưỡi',
    },
    ctaLabel: 'Thưởng Thức Hương Vị Bếp Việt',
    sortOrder: 2,
  },
  {
    categoryIndex: 2, // Bánh mì & Ăn nhẹ
    mainDishIndex: 0, // Bánh Mì Thập Cẩm Pate Gan Phố Cổ Hà Nội
    chapterLabel: 'Vũ Điệu Đường Phố',
    headlineTitle: 'Tiếng Giòn Rụm Phố Xưa & Bản Giao Hưởng Vị Giác',
    headlineHighlight: 'Bơ Tươi, Pate Béo Ngậy & Lớp Vỏ Vàng Ươm Nóng Hổi',
    badgeTag: 'Bánh Mì Huyền Thoại · Vũ Điệu Đường Phố',
    themeColor: 'forest',
    animationPreset: story_sections_animation_preset.RISE,
    animationType: 'spiral',
    badgeTop: 'Vỏ Giòn Ruột Xốp',
    badgeBottom: 'Pate Gan Gia Truyền',
    description:
      'Vượt qua ranh giới một món ăn đường phố thông thường, ổ bánh mì Việt là cuộc giao thoa văn hóa ẩm thực kỳ diệu. Lớp vỏ nướng lò vàng giòn rụm vỡ tan khi cắn, bao bọc bên trong là lớp pate gan thủ công béo ngậy, bơ vàng thơm phức, thịt xá xíu đậm đà cùng vị thanh mát của dưa góp rau mùi tạo nên một bản giao hưởng vị giác hoàn mỹ.',
    flavors: {
      top: 'Mùi bơ tươi thơm ngậy và lớp vỏ bánh nướng lò vàng ươm giòn rụm vỡ tan',
      heart: 'Pate gan thủ công ngậy béo lan tỏa, thịt xá xíu đậm đà đan xen giò lụa thơm thanh',
      base: 'Dưa góp giòn sần sật chua thanh cân bằng tuyệt hảo, sốt ớt cay the đánh thức vị giác',
    },
    ctaLabel: 'Trải Nghiệm Bánh Mì Di Sản',
    sortOrder: 3,
  },
];

async function seed() {
  console.log('🚀 Bắt đầu nạp dữ liệu Catalog và Story Sections...');

  // Lưu trữ các món đã tạo theo từng category để liên kết Story
  const createdCategories = [];

  for (const catData of CATALOG_DATA) {
    console.log(`\n📂 Xử lý danh mục: "${catData.categoryName}" (ID: ${catData.categoryId})`);

    const createdDishesForCat = [];

    for (const dishData of catData.dishes) {
      console.log(`  🍲 Tạo/Cập nhật món: "${dishData.name}" (${dishData.slug})`);

      // 1. Kiểm tra món đã tồn tại chưa (kể cả món chưa bị xóa hoặc đã soft-delete)
      let existing = await prisma.dishes.findUnique({
        where: { slug: dishData.slug },
      });

      let dishId;
      if (existing) {
        // Cập nhật lại món ăn
        const updated = await prisma.dishes.update({
          where: { id: existing.id },
          data: {
            name: dishData.name,
            category_id: catData.categoryId,
            description: dishData.description,
            story: dishData.story,
            spicy_level: dishData.spicyLevel,
            ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
            availability: dishes_availability.AVAILABLE,
            sort_order: dishData.sortOrder,
            deleted_at: null, // Đảm bảo active
          },
        });
        dishId = updated.id;
        console.log(`     -> Đã cập nhật món ID: ${dishId}`);
      } else {
        // Tạo món ăn mới
        const created = await prisma.dishes.create({
          data: {
            name: dishData.name,
            slug: dishData.slug,
            category_id: catData.categoryId,
            description: dishData.description,
            story: dishData.story,
            spicy_level: dishData.spicyLevel,
            ingredient_data_status: dishes_ingredient_data_status.VERIFIED,
            availability: dishes_availability.AVAILABLE,
            sort_order: dishData.sortOrder,
          },
        });
        dishId = created.id;
        console.log(`     -> Đã tạo món mới ID: ${dishId}`);
      }

      // 2. Làm mới 4 ảnh (xóa ảnh cũ nếu có rồi thêm lại để đồng bộ)
      await prisma.dish_images.deleteMany({
        where: { dish_id: dishId },
      });

      for (const img of dishData.images) {
        await prisma.dish_images.create({
          data: {
            dish_id: dishId,
            asset_path: img.assetPath,
            kind: img.kind,
            alt_text: img.altText,
            sort_order: img.sortOrder,
          },
        });
      }
      console.log(`     -> Đã thêm 4 ảnh chuẩn xác (1 COVER + 3 Phụ)`);

      // 3. Làm mới biến thể (variants)
      await prisma.dish_variants.deleteMany({
        where: { dish_id: dishId },
      });

      for (const v of dishData.variants) {
        await prisma.dish_variants.create({
          data: {
            dish_id: dishId,
            name: v.name,
            price: v.price,
            is_active: true,
          },
        });
      }
      console.log(`     -> Đã thêm ${dishData.variants.length} biến thể`);

      // 4. Làm mới Option Groups và Option Values
      // Xóa option values trước do foreign key
      await prisma.option_values.deleteMany({
        where: { dish_id: dishId },
      });
      await prisma.option_groups.deleteMany({
        where: { dish_id: dishId },
      });

      for (const grp of dishData.optionGroups) {
        const createdGroup = await prisma.option_groups.create({
          data: {
            dish_id: dishId,
            name: grp.name,
            min_select: grp.minSelect,
            max_select: grp.maxSelect,
            is_active: true,
          },
        });

        for (const opt of grp.options) {
          await prisma.option_values.create({
            data: {
              group_id: createdGroup.id,
              dish_id: dishId,
              name: opt.name,
              extra_price: opt.extraPrice,
              is_active: true,
            },
          });
        }
      }
      console.log(`     -> Đã thêm ${dishData.optionGroups.length} nhóm topping ăn kèm`);

      createdDishesForCat.push({
        id: dishId,
        name: dishData.name,
        slug: dishData.slug,
        coverImage: dishData.images[0].assetPath,
        price: dishData.variants[0].price,
      });
    }

    createdCategories.push({
      ...catData,
      dishesList: createdDishesForCat,
    });
  }

  // 5. Xóa sạch các story sections cũ để thiết lập 3 câu chuyện chuẩn văn hóa ẩm thực
  console.log('\n📖 Tạo 3 Story Sections nghệ thuật cho 3 danh mục đầu...');
  await prisma.story_sections.deleteMany({});

  for (const story of STORIES_DATA) {
    const cat = createdCategories[story.categoryIndex];
    const mainDish = cat.dishesList[story.mainDishIndex];
    const satelliteDishes = cat.dishesList
      .filter((_, idx) => idx !== story.mainDishIndex)
      .map((d) => ({
        id: d.id.toString(),
        name: d.name,
        slug: d.slug,
        image: d.coverImage,
        price: d.price,
      }));

    const extraAssets = {
      category_id: cat.categoryId.toString(),
      category_name: cat.categoryName,
      category_slug: cat.categorySlug,
      badge_tag: story.badgeTag,
      headline_title: story.headlineTitle,
      headline_highlight: story.headlineHighlight,
      description: story.description,
      theme_color: story.themeColor,
      animation_type: story.animationType,
      badge_top: story.badgeTop,
      badge_bottom: story.badgeBottom,
      flavors: story.flavors,
      main_dish: {
        id: mainDish.id.toString(),
        name: mainDish.name,
        slug: mainDish.slug,
        image: mainDish.coverImage,
        price: mainDish.price,
      },
      satellite_dishes: satelliteDishes,
    };

    const createdStory = await prisma.story_sections.create({
      data: {
        dish_id: mainDish.id,
        chapter_label: story.chapterLabel,
        headline: story.headlineTitle,
        body: story.description,
        cta_label: story.ctaLabel,
        background_color: '#fff8f6',
        text_color: '#1c1917',
        animation_preset: story.animationPreset,
        sort_order: story.sortOrder,
        is_published: true,
        extra_assets: extraAssets,
      },
    });

    console.log(`  ✨ Đã tạo Story Section ${story.sortOrder}:`);
    console.log(`     - Danh mục: "${cat.categoryName}"`);
    console.log(`     - Headline: "${story.headlineTitle}"`);
    console.log(`     - Món chính: "${mainDish.name}"`);
    console.log(`     - Món vệ tinh: ${satelliteDishes.length} món`);
  }

  console.log('\n🎉 HOÀN THÀNH TOÀN BỘ SEED DỮ LIỆU THÀNH CÔNG RỰC RỠ!');
}

seed()
  .catch((err) => {
    console.error('❌ Lỗi khi chạy seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
