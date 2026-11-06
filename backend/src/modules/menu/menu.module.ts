import { Module } from '@nestjs/common';
import { UploadModule } from '../upload/upload.module.js';
import { CategoriesService } from './services/categories.service.js';
import { DishesService } from './services/dishes.service.js';
import { VariantsService } from './services/variants.service.js';
import { OptionsService } from './services/options.service.js';
import { IngredientsAndTagsService } from './services/ingredients-tags.service.js';
import { DishImagesService } from './services/dish-images.service.js';
import { MenuImportService } from './services/menu-import.service.js';
import { MenuPublicController } from './controllers/menu-public.controller.js';
import { MenuAdminController } from './controllers/menu-admin.controller.js';

@Module({
  imports: [UploadModule],
  controllers: [MenuPublicController, MenuAdminController],
  providers: [
    CategoriesService,
    DishesService,
    VariantsService,
    OptionsService,
    IngredientsAndTagsService,
    DishImagesService,
    MenuImportService,
  ],
})
export class MenuModule {}
