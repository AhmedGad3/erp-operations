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

  @Auth('admin')
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

  @Auth('admin', 'accountant', 'manager')
  @Get()
  async findAllClients() {
    const lang = this.getLang();
    const result = await this.clientService.findAllClients();
    return { result, message: this.i18n.translate('clients.found', { lang }) };
  }

  // ✅ Static routes أولاً
  @Auth('admin', 'accountant', 'manager')
  @Get('search')
  async searchClients(@Query('q') searchTerm: string) {
    const lang = this.getLang();
    const result = await this.clientService.searchClients(searchTerm);
    return { result, message: this.i18n.translate('clients.fetched', { lang }) };
  }

  // ✅ Dynamic routes آخراً
  @Auth('admin', 'accountant', 'manager')
  @Get(':id')
  async findById(@Param('id') id: string) {
    const lang = this.getLang();
    const result = await this.clientService.findById(id);
    return { result, message: this.i18n.translate('clients.fetched', { lang }) };
  }

  @Auth('admin')
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

  @Auth('admin')
  @Patch(':id/activate')
  async activateClient(@Param('id') id: string, @Req() req: Request) {
    const lang = this.getLang();
    const result = await this.clientService.activateClient(id, req['user']);
    return {
      result,
      message: this.i18n.translate('clients.activated', { lang }),
    };
  }

  @Auth('admin')
  @Delete(':id')
  async deleteClient(@Param('id') id: string, @Req() req: Request) {
    const lang = this.getLang();
    const result = await this.clientService.deleteClient(id, req['user']);
    return { message: this.i18n.translate('clients.deleted', { lang }) };
  }
}
