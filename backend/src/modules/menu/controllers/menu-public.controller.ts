import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service.js';
import { DishesService } from '../services/dishes.service.js';
import { IngredientsAndTagsService } from '../services/ingredients-tags.service.js';
import { QueryDishesDto } from '../dto/query-dishes.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Controller('menu')
export class MenuPublicController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly dishesService: DishesService,
    private readonly ingredientsAndTagsService: IngredientsAndTagsService,
  ) {}

  @Public()
  @Get('categories')
  async getCategories() {
    return this.categoriesService.findAllPublic();
  }

  @Public()
  @Get('dishes')
  async getDishes(@Query() query: QueryDishesDto) {
    return this.dishesService.findPublicDishes(query);
  }

  @Public()
  @Get('dishes/:slug')
  async getDishBySlug(@Param('slug') slug: string) {
    return this.dishesService.findPublicDishBySlug(slug);
  }

  @Public()
  @Get('tags')
  async getTags() {
    return this.ingredientsAndTagsService.findAllTags();
  }

  @Public()
  @Get('ingredients')
  async getIngredients() {
    return this.ingredientsAndTagsService.findAllIngredients();
  }
}
