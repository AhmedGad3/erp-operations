import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { TUser } from '../../../../DB';
import { Project, TProject } from '../../../../DB/Models/Project/project.schema';
import {
  ClientsPayment,
  ClientsPaymentDocument,
} from '../../../../DB/Models/Transaction/client/client.payment.schema';
import { CounterService } from '../../common/counter.service';
import { ClientLedgerService } from '../../ledger/Client/client-ledger.service';
import { CreateClientPaymentDto } from './dto/create-client-payment.dto';

@Injectable()
export class ClientPaymentService {
  constructor(
    @InjectModel(ClientsPayment.name)
    private readonly clientPaymentModel: Model<ClientsPaymentDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<TProject>,

    @InjectConnection()
    private readonly connection: Connection,

    private readonly clientLedgerService: ClientLedgerService,
    private readonly counterService: CounterService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(): string {
    return I18nContext.current()?.lang || 'ar';
  }

  async createClientPayment(dto: CreateClientPaymentDto, user: TUser) {
    const lang = this.getLang();

    if (dto.totalAmount !== dto.contractPayment + dto.additionalPayment) {
      throw new BadRequestException(
        this.i18n.translate('payments.errors.invalidTotal', { lang }),
      );
    }

    if (dto.totalAmount <= 0) {
      throw new BadRequestException(
        this.i18n.translate('payments.errors.invalidAmount', { lang }),
      );
    }

    const session = await this.connection.startSession();

    try {
      let createdPayment: ClientsPaymentDocument | null = null;

      await session.withTransaction(async () => {
        const project = await this.projectModel
          .findById(dto.projectId)
          .session(session);

        if (!project || !project.isActive) {
          throw new NotFoundException(
            this.i18n.translate('projects.errors.notFound', { lang }),
          );
        }

        const contractRemaining = project.contractAmount - project.totalPaid;
        const ledgerBalance = await this.clientLedgerService.getCurrentBalance(
          project.clientId,
          project._id,
          session,
        );

        if (dto.contractPayment > contractRemaining) {
          throw new BadRequestException(
            this.i18n.translate('payments.errors.exceedsContract', {
              lang,
              args: { remaining: contractRemaining },
            }),
          );
        }

        if (contractRemaining > 0 && dto.contractPayment === 0) {
          throw new BadRequestException(
            this.i18n.translate('payments.errors.contractMustBePaidFirst', {
              lang,
            }),
          );
        }

        if (ledgerBalance <= 0 && dto.additionalPayment > 0) {
          throw new BadRequestException(
            this.i18n.translate('payments.errors.noAdditionalBalance', {
              lang,
            }),
          );
        }

        if (ledgerBalance > 0 && dto.additionalPayment > ledgerBalance) {
          throw new BadRequestException(
            this.i18n.translate('payments.errors.exceedsLedger', {
              lang,
              args: { balance: ledgerBalance },
            }),
          );
        }

        const paymentNo = await this.counterService.getNext(
          'client-payment',
          session,
        );

        const payment = new this.clientPaymentModel({
          paymentNo,
          clientId: project.clientId,
          projectId: project._id,
          amount: dto.totalAmount,
          contractPayment: dto.contractPayment,
          additionalPayment: dto.additionalPayment,
          method: dto.method,
          transferRef: dto.transferRef,
          chequeNo: dto.chequeNo,
          paymentDate: new Date(dto.paymentDate),
          notes: dto.notes,
          createdBy: user._id,
        });

        await payment.save({ session });

        project.totalPaid += dto.contractPayment;
        await project.save({ session });

        await this.clientLedgerService.createTransaction(
          {
            clientId: project.clientId,
            projectId: project._id,
            debit: 0,
            credit: dto.totalAmount,
            type: 'payment',
            referenceType: 'ClientPayment',
            referenceId: payment._id,
            createdBy: user._id as Types.ObjectId,
          },
          session,
        );

        createdPayment = payment;
      });

      if (!createdPayment) {
        throw new BadRequestException('Failed to create client payment');
      }

      return createdPayment;
    } finally {
      await session.endSession();
    }
  }

  async findAll() {
    return this.clientPaymentModel
      .find()
      .sort({ paymentDate: -1 })
      .populate('clientId', 'nameAr nameEn code phone email isActive')
      .populate(
        'projectId',
        'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy',
      )
      .populate('createdBy', 'name email')
      .exec();
  }

  async findById(id: string) {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(
        this.i18n.translate('payments.errors.invalidId', { lang }),
      );
    }

    const payment = await this.clientPaymentModel
      .findById(id)
      .populate('clientId', 'nameAr nameEn code phone email isActive')
      .populate(
        'projectId',
        'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy',
      )
      .populate('createdBy', 'name email')
      .exec();

    if (!payment) {
      throw new NotFoundException(
        this.i18n.translate('payments.errors.notFound', { lang }),
      );
    }

    return payment;
  }

  async findByProject(projectId: string) {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException(
        this.i18n.translate('projects.errors.invalidId', { lang }),
      );
    }

    return this.clientPaymentModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ paymentDate: -1 })
      .populate('clientId', 'nameAr nameEn code phone email isActive')
      .populate(
        'projectId',
        'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy',
      )
      .populate('createdBy', 'name email')
      .exec();
  }

  async findByClient(clientId: string) {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException(
        this.i18n.translate('clients.errors.invalidId', { lang }),
      );
    }

    return this.clientPaymentModel
      .find({ clientId: new Types.ObjectId(clientId) })
      .sort({ paymentDate: -1 })
      .populate('clientId', 'nameAr nameEn code phone email isActive')
      .populate(
        'projectId',
        'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy',
      )
      .populate('createdBy', 'name email')
      .exec();
  }

  async getProjectPaymentSummary(projectId: string) {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException(
        this.i18n.translate('projects.errors.invalidId', { lang }),
      );
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) {
      throw new NotFoundException(
        this.i18n.translate('projects.errors.notFound', { lang }),
      );
    }

    const ledgerBalance = await this.clientLedgerService.getCurrentBalance(
      new Types.ObjectId(project.clientId),
      new Types.ObjectId(projectId),
    );

    return {
      contractAmount: project.contractAmount,
      totalPaid: project.totalPaid,
      contractRemaining: project.contractAmount - project.totalPaid,
      ledgerBalance,
      totalRemaining:
        project.contractAmount - project.totalPaid + ledgerBalance,
      totalCosts: project.totalCosts,
      expectedProfit: project.contractAmount - project.totalCosts,
      realizedProfit: project.totalPaid - project.totalCosts,
    };
  }
}
