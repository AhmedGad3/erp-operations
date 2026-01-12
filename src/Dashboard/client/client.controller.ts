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
} from '@nestjs/common';
import { Auth } from '../../Common';
import { CreateClientDto, UpdateClientDto } from './dto';
import { ClientService } from './client.service';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Auth('admin')
@Controller('admin/clients')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(): string {
    return I18nContext.current()?.lang || 'ar';
  }

  @Post()
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @Req() req: Request,
  ) {
    const lang = this.getLang();
    const result = await this.clientService.createClient(
      createClientDto,
      req['user'],
    );
    return { result, message: this.i18n.translate('clients.created', { lang }) };
  }

  @Get()
  async findAllClients() {
    const lang = this.getLang();
    const result = await this.clientService.findAllClients();
    return { result, message: this.i18n.translate('clients.found', { lang }) };
  }

  // ✅ Static routes أولاً
  @Get('search')
  async searchClients(@Query('q') searchTerm: string) {
    const lang = this.getLang();
    const result = await this.clientService.searchClients(searchTerm);
    return { result, message: this.i18n.translate('clients.fetched', { lang }) };
  }

  // ✅ Dynamic routes آخراً
  @Get(':id')
  async findById(@Param('id') id: string) {
    const lang = this.getLang();
    const result = await this.clientService.findById(id);
    return { result, message: this.i18n.translate('clients.fetched', { lang }) };
  }

  @Put(':id')
  async updateClient(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: Request,
  ) {
    const lang = this.getLang();
    const result = await this.clientService.updateClient(
      id,
      updateClientDto,
      req['user'],
    );
    return { result, message: this.i18n.translate('clients.updated', { lang }) };
  }

  @Patch(':id/activate')
  async activateClient(@Param('id') id: string, @Req() req: Request) {
    const lang = this.getLang();
    const result = await this.clientService.activateClient(id, req['user']);
    return {
      result,
      message: this.i18n.translate('clients.activated', { lang }),
    };
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: string, @Req() req: Request) {
    const lang = this.getLang();
    const result = await this.clientService.deleteClient(id, req['user']);
    return { message: this.i18n.translate('clients.deleted', { lang }) };
  }
}