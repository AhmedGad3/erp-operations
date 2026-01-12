import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Auth } from '../../Common';
import { UnitService } from './unit.service';
import { ConvertUnitDto, CreateUnitDto, UpdateUnitDto } from './dto';
import { UnitCategory } from '../../Common/Enums';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Auth('admin')
@Controller('/admin/units')
export class UnitController {
  constructor(private readonly unitService: UnitService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(): string {
    return I18nContext.current()?.lang || 'ar';
  }

  @Post()
  async createUnit(@Body() createUnitDto: CreateUnitDto, @Req() req: Request) {
    const lang = this.getLang();
    const result = await this.unitService.createUnit(
      createUnitDto,
      req['user'],
    );

    return {
      result,
      message: this.i18n.translate('units.created', { lang }),
    };
  }

  @Get()
  async findAll(@Query('category') category?: UnitCategory) {
    const lang = this.getLang();
    const result = await this.unitService.findAllUnits(category);

    return {
      result,
      message: this.i18n.translate('units.fetched', { lang }),
    };
  }

  @Get('base')
  async findBaseUnits() {
    const lang = this.getLang();
    const result = await this.unitService.findBaseUnits();

    return {
      result,
      message: this.i18n.translate('units.fetched', { lang }),
    };
  }

   @Get('dropdown')
  async findForDropdown(@Query('category') category?: string) {
    const lang = this.getLang();
    const result = await this.unitService.findForDropdown(category);

    return {
      result,
      message: this.i18n.translate('units.fetched', { lang }),
    };
  }

  @Get('search')
  async search(@Query('q') searchTerm: string) {
    const lang = this.getLang();
    const result = await this.unitService.searchUnits(searchTerm);

    return {
      result,
      message: this.i18n.translate('units.fetched', { lang }),
    };
  }



  @Post('convert')
  async convertUnits(@Body() convertDto: ConvertUnitDto) {
    const lang = this.getLang();
    const result = await this.unitService.convertUnits(convertDto);
    return { result, message: this.i18n.translate(  'units.converted', { lang }) };
  }

 @Get(':id')
  async findById(@Param('id') id: string) {
    const lang = this.getLang();
    const result = await this.unitService.findById(id);

    return {
      result,
      message: this.i18n.translate('units.fetched', { lang }),
    };
  }

  @Get(':id/derived')
 async findDerivedUnits(@Param('id') id: string) {
   const lang = this.getLang();
   const result = await this.unitService.findDerivedUnits(id);

   return {
     result,
     message: this.i18n.translate('units.fetched', { lang }),
   };
 }

   @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
    @Req() req: Request,
  ) {
    const lang = this.getLang();
    const result = await this.unitService.updateUnit(
      id,
      updateUnitDto,
      req['user']._id,
    );

    return {
      result,
      message: this.i18n.translate('units.updated', { lang }),
    };
  }


   @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    return await this.unitService.deleteUnit(id, req['user']._id);
  }

   @Patch(':id/activate')
  async activate(@Param('id') id: string, @Req() req: Request) {
    return await this.unitService.activateUnit(id, req['user']._id);
  }
}
