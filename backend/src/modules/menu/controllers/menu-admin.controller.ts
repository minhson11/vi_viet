/// <reference types="multer" />
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CategoriesService } from '../services/categories.service.js';
import { DishesService } from '../services/dishes.service.js';
import { VariantsService } from '../services/variants.service.js';
import { OptionsService } from '../services/options.service.js';
import { IngredientsAndTagsService } from '../services/ingredients-tags.service.js';
import { DishImagesService } from '../services/dish-images.service.js';
import { MenuImportService } from '../services/menu-import.service.js';

import { CreateCategoryDto } from '../dto/create-category.dto.js';
import { UpdateCategoryDto } from '../dto/update-category.dto.js';
import { CreateDishDto } from '../dto/create-dish.dto.js';
import { UpdateDishDto } from '../dto/update-dish.dto.js';
import { UpdateDishAvailabilityDto } from '../dto/update-dish-availability.dto.js';
import { QueryDishesDto } from '../dto/query-dishes.dto.js';
import {
  CreateVariantDto,
  UpdateVariantDto,
} from '../dto/create-variant.dto.js';
import {
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
} from '../dto/create-option-group.dto.js';
import {
  CreateOptionValueDto,
  UpdateOptionValueDto,
} from '../dto/create-option-value.dto.js';
import { CreateDishImageDto } from '../dto/create-dish-image.dto.js';
import { UploadDishImageDto } from '../dto/upload-dish-image.dto.js';
import { SyncDishImagesDto } from '../dto/sync-dish-images.dto.js';
import { AssignTagsDto } from '../dto/assign-tags.dto.js';
import { AssignIngredientsDto } from '../dto/assign-ingredients.dto.js';
import { CreateIngredientDto } from '../dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from '../dto/update-ingredient.dto.js';

import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../common/enums/role.enum.js';

const ExcelImportFileInterceptor = FileInterceptor('file', {
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
      return callback(
        new BadRequestException('Chỉ chấp nhận file Excel định dạng .xlsx.'),
        false,
      );
    }
    callback(null, true);
  },
});

@Roles(Role.ADMIN)
@Controller('admin/menu')
export class MenuAdminController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly dishesService: DishesService,
    private readonly variantsService: VariantsService,
    private readonly optionsService: OptionsService,
    private readonly ingredientsAndTagsService: IngredientsAndTagsService,
    private readonly dishImagesService: DishImagesService,
    private readonly menuImportService: MenuImportService,
  ) {}

  // ==========================================
  // 1. QUẢN LÝ DANH MỤC (CATEGORIES)
  // ==========================================
  @Get('categories')
  async getAllCategories() {
    return this.categoriesService.findAllAdmin();
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Post('ingredients')
  async createIngredient(@Body() dto: CreateIngredientDto) {
    return this.ingredientsAndTagsService.createIngredient(dto);
  }

  @Patch('ingredients/:ingredientId')
  async updateIngredient(
    @Param('ingredientId') ingredientId: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.ingredientsAndTagsService.updateIngredient(ingredientId, dto);
  }

  // ==========================================
  // 2. QUẢN LÝ MÓN ĂN (DISHES)
  // ==========================================
  @Get('import/template')
  async downloadImportTemplate(@Res() response: Response) {
    const buffer = await this.menuImportService.createTemplate();
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="mau-import-thuc-don.xlsx"',
    );
    response.send(buffer);
  }

  @Post('import/preview')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(ExcelImportFileInterceptor)
  async previewImport(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng chọn file Excel.');
    return this.menuImportService.preview(file.buffer);
  }

  @Post('import')
  @UseInterceptors(ExcelImportFileInterceptor)
  async importMenu(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng chọn file Excel.');
    return this.menuImportService.import(file.buffer);
  }

  @Get('dishes')
  async getAllDishes(@Query() query: QueryDishesDto) {
    return this.dishesService.findAllAdmin(query);
  }

  @Get('dishes/:id')
  async getDishById(@Param('id') id: string) {
    return this.dishesService.findById(id);
  }

  @Post('dishes')
  async createDish(@Body() dto: CreateDishDto) {
    return this.dishesService.create(dto);
  }

  @Put('dishes/:id')
  async updateDish(@Param('id') id: string, @Body() dto: UpdateDishDto) {
    return this.dishesService.update(id, dto);
  }

  /**
   * Nút báo hết món nhanh: Cho phép cả ADMIN, OPERATOR, KITCHEN (BR-22)
   */
  @Roles(Role.ADMIN, Role.OPERATOR, Role.KITCHEN)
  @Patch('dishes/:id/availability')
  async updateDishAvailability(
    @Param('id') id: string,
    @Body() dto: UpdateDishAvailabilityDto,
  ) {
    return this.dishesService.updateAvailability(id, dto.availability);
  }

  @Delete('dishes/:id')
  async deleteDish(@Param('id') id: string) {
    return this.dishesService.softDelete(id);
  }

  // ==========================================
  // 3. QUẢN LÝ BIẾN THỂ (VARIANTS)
  // ==========================================
  @Get('dishes/:dishId/variants')
  async getVariants(@Param('dishId') dishId: string) {
    return this.variantsService.findByDishId(dishId);
  }

  @Post('dishes/:dishId/variants')
  async createVariant(
    @Param('dishId') dishId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.variantsService.create(dishId, dto);
  }

  @Put('dishes/:dishId/variants/:variantId')
  async updateVariant(
    @Param('dishId') dishId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.variantsService.update(dishId, variantId, dto);
  }

  @Delete('dishes/:dishId/variants/:variantId')
  async deleteVariant(
    @Param('dishId') dishId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.variantsService.remove(dishId, variantId);
  }

  // ==========================================
  // 4. QUẢN LÝ NHÓM TÙY CHỌN & LỰA CHỌN (OPTIONS)
  // ==========================================
  @Get('dishes/:dishId/option-groups')
  async getOptionGroups(@Param('dishId') dishId: string) {
    return this.optionsService.findGroupsByDishId(dishId);
  }

  @Post('dishes/:dishId/option-groups')
  async createOptionGroup(
    @Param('dishId') dishId: string,
    @Body() dto: CreateOptionGroupDto,
  ) {
    return this.optionsService.createGroup(dishId, dto);
  }

  @Put('dishes/:dishId/option-groups/:groupId')
  async updateOptionGroup(
    @Param('dishId') dishId: string,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateOptionGroupDto,
  ) {
    return this.optionsService.updateGroup(dishId, groupId, dto);
  }

  @Delete('dishes/:dishId/option-groups/:groupId')
  async deleteOptionGroup(
    @Param('dishId') dishId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.optionsService.removeGroup(dishId, groupId);
  }

  @Post('dishes/:dishId/option-groups/:groupId/values')
  async createOptionValue(
    @Param('dishId') dishId: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreateOptionValueDto,
  ) {
    return this.optionsService.createValue(dishId, groupId, dto);
  }

  @Put('dishes/:dishId/option-groups/:groupId/values/:valueId')
  async updateOptionValue(
    @Param('dishId') dishId: string,
    @Param('groupId') groupId: string,
    @Param('valueId') valueId: string,
    @Body() dto: UpdateOptionValueDto,
  ) {
    return this.optionsService.updateValue(dishId, groupId, valueId, dto);
  }

  @Delete('dishes/:dishId/option-groups/:groupId/values/:valueId')
  async deleteOptionValue(
    @Param('dishId') dishId: string,
    @Param('groupId') groupId: string,
    @Param('valueId') valueId: string,
  ) {
    return this.optionsService.removeValue(dishId, groupId, valueId);
  }

  // ==========================================
  // 5. QUẢN LÝ HÌNH ẢNH MÓN (DISH IMAGES)
  // ==========================================
  @Get('dishes/:dishId/images')
  async getDishImages(@Param('dishId') dishId: string) {
    return this.dishImagesService.findByDishId(dishId);
  }

  @Post('dishes/:dishId/images')
  async addDishImage(
    @Param('dishId') dishId: string,
    @Body() dto: CreateDishImageDto,
  ) {
    return this.dishImagesService.addImage(dishId, dto);
  }

  @Post('dishes/:dishId/images/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException(
              'Định dạng file không hỗ trợ! Vui lòng chỉ tải lên ảnh JPG, PNG hoặc WebP.',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadDishImage(
    @Param('dishId') dishId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDishImageDto,
  ) {
    return this.dishImagesService.uploadAndAddImage(dishId, file, dto);
  }

  @Delete('dishes/:dishId/images/:imageId')
  async deleteDishImage(
    @Param('dishId') dishId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.dishImagesService.removeImage(dishId, imageId);
  }

  @Put('dishes/:dishId/images/sync')
  async syncDishImages(
    @Param('dishId') dishId: string,
    @Body() dto: SyncDishImagesDto,
  ) {
    return this.dishImagesService.syncImages(dishId, dto);
  }

  @Patch('dishes/:dishId/images/:imageId/cover')
  async setCoverImage(
    @Param('dishId') dishId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.dishImagesService.setCover(dishId, imageId);
  }

  // ==========================================
  // 6. GẮN TAGS & NGUYÊN LIỆU CHO MÓN
  // ==========================================
  @Put('dishes/:dishId/tags')
  async assignTags(
    @Param('dishId') dishId: string,
    @Body() dto: AssignTagsDto,
  ) {
    return this.ingredientsAndTagsService.assignTagsToDish(dishId, dto);
  }

  @Put('dishes/:dishId/ingredients')
  async assignIngredients(
    @Param('dishId') dishId: string,
    @Body() dto: AssignIngredientsDto,
  ) {
    return this.ingredientsAndTagsService.assignIngredientsToDish(dishId, dto);
  }
}
