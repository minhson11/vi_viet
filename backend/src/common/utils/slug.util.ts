import { BadRequestException } from '@nestjs/common';

export function slugify(text: string): string {
  if (!text) {
    throw new BadRequestException(
      'Tiêu đề hoặc đường dẫn (slug) không được để trống!',
    );
  }

  const cleaned = text
    .toString()
    .normalize('NFD') // Tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '') // Xóa ký tự đặc biệt
    .replace(/\s+/g, '-') // Đổi khoảng trắng thành gạch nối
    .replace(/-+/g, '-') // Xóa gạch nối lặp
    .replace(/^-+|-+$/g, ''); // Xóa gạch nối ở đầu và cuối

  if (!cleaned) {
    throw new BadRequestException(
      'Tiêu đề hoặc đường dẫn (slug) không hợp lệ (phải chứa ít nhất một ký tự chữ hoặc số)!',
    );
  }

  return cleaned;
}
