import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/Common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { Types } from 'mongoose';
import { ClientLedgerService } from './client-ledger.service';

@Auth('admin')
@Controller('/admin/ledger/clients')
export class ClientLedgerController {
  constructor(
    private readonly ledgerService: ClientLedgerService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(): string {
    return I18nContext.current()?.lang || 'ar';
  }

  @Get()
  async getAllLedger() {
    const result = await this.ledgerService.findAll();
    return {
      result,
      message: this.i18n.translate('ledger.fetched', {
        lang: this.getLang(),
      }),
    };
  }

 




  @Get(':clientId')
  async getLedgerByClient(@Param('clientId') clientId: string) {
    const result = await this.ledgerService.findByClient(clientId);
    return {
      result,
      message: this.i18n.translate('ledger.byClientFetched', {
        lang: this.getLang(),
      }),
    };
  }

  @Get(':clientId/project/:projectId/balance')
  async getClientProjectBalance(
    @Param('clientId') clientId: string,
    @Param('projectId') projectId: string,
  ) {
    const amountDue = await this.ledgerService.getCurrentBalance(
      new Types.ObjectId(clientId),
      new Types.ObjectId(projectId),
    );
// console.log(amountDue);

    return {
      result: { amountDue },
      message: this.i18n.translate('ledger.balanceFetched', {
        lang: this.getLang(),
      }),
    };
  }

  @Get(':clientId/total-balance')
  async getTotalClientBalance(@Param('clientId') clientId: string) {
    const totalBalance =
      await this.ledgerService.getTotalClientBalance(
        new Types.ObjectId(clientId),
      );

    return {
      result: { totalBalance },
      message: this.i18n.translate('ledger.balanceFetched', {
        lang: this.getLang(),
      }),
    };
  }

  @Get(':clientId/breakdown')
  async getClientBalanceBreakdown(@Param('clientId') clientId: string) {
    const result =
      await this.ledgerService.getClientBalanceBreakdown(clientId);

    return {
      result,
      message: this.i18n.translate('ledger.balanceFetched', {
        lang: this.getLang(),
      }),
    };
  }
}
