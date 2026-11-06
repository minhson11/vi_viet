import { describe, it, expect } from 'vitest';
import { slugify } from './slug.util.js';
import { BadRequestException } from '@nestjs/common';

describe('slugify Utility (Hàm chuẩn hóa đường dẫn)', () => {
  it('Chuyển đổi tiếng Việt có dấu thành slug không dấu chuẩn', () => {
    expect(slugify('Phở Bò Tái Lăn Gia Truyền')).toBe(
      'pho-bo-tai-lan-gia-truyen',
    );
    expect(slugify('Bánh Mì Thịt Xá Xíu')).toBe('banh-mi-thit-xa-xiu');
    expect(slugify('Đặc Sản Miền Tây')).toBe('dac-san-mien-tay');
  });

  it('Loại bỏ ký tự đặc biệt và gộp nhiều dấu gạch nối', () => {
    expect(slugify('Món Ăn @#$ Ngon & Lạ!!!')).toBe('mon-an-ngon-la');
    expect(slugify('Cơm   Tấm---Sài   Gòn')).toBe('com-tam-sai-gon');
  });

  it('Xóa gạch nối ở đầu và cuối chuỗi', () => {
    expect(slugify('---Trà Sen Vàng---')).toBe('tra-sen-vang');
  });

  it('Ném lỗi BadRequestException nếu chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    expect(() => slugify('')).toThrow(BadRequestException);
    expect(() => slugify('   ')).toThrow(BadRequestException);
  });

  it('Ném lỗi BadRequestException nếu chuỗi chỉ toàn dấu câu và ký tự đặc biệt', () => {
    expect(() => slugify('???')).toThrow(BadRequestException);
    expect(() => slugify('---')).toThrow(BadRequestException);
    expect(() => slugify('!@#$%^&*()')).toThrow(BadRequestException);
  });
});
