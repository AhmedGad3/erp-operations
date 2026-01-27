
// src/routes/transaction/ledger/Client/client-ledger.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ClientTransaction,
  ClientTransactionDocument,
} from '../../../../DB/Models/Transaction/client/client-transaction.schema';
import { CounterService } from '../../common/counter.service';

 export interface BreakdownItem {
  projectId: Types.ObjectId;
  balance: number;
}

@Injectable()
export class ClientLedgerService {
  constructor(
    @InjectModel(ClientTransaction.name)
    private readonly ledgerModel: Model<ClientTransactionDocument>,
    
    private readonly counterService: CounterService,
  ) {}

  /**
   * Create transaction for a project
   */
  async createTransaction(data: {
    clientId: Types.ObjectId;
    projectId: Types.ObjectId;
    debit: number;
    credit: number;
    type: string;
    referenceType: string;
    referenceId: Types.ObjectId;
    createdBy: Types.ObjectId;
  }) {
    const last = await this.ledgerModel
      .findOne({ 
        clientId:  new Types.ObjectId(data.clientId),
        projectId: new Types.ObjectId(data.projectId),
      })
      .sort({ transactionDate: -1, _id: -1 });

    const lastBalance = last?.balanceAfter ?? 0;

    const transactionNo = await this.counterService.getNext('client-transaction');

    const balanceAfter = lastBalance + data.debit - data.credit;

    const transaction = await this.ledgerModel.create({
      ...data,
      transactionNo,
      balanceAfter,
      transactionDate: new Date(),
    });

    
    return transaction;
  }

  

  /**
   * Get current balance for a specific project
   */
  async getCurrentBalance(
    clientId: Types.ObjectId,
    projectId: Types.ObjectId,
  ): Promise<number> {
    const last = await this.ledgerModel
      .findOne({ 
        clientId: new Types.ObjectId(clientId), 
            projectId: new Types.ObjectId(projectId),
      })
      .sort({ transactionDate: -1, _id: -1 })
      .select('balanceAfter');

    return last?.balanceAfter ?? 0;
  }

  

  /**
   * Get all transactions
   */
  async findAll() {
    return this.ledgerModel
      .find()
      .sort({ transactionDate: -1 })
          .populate('clientId', 'nameAr nameEn code phone email isActive')
            .populate('projectId', 'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy')
            .populate('createdBy', 'name email')
      .exec();
  }

  /**
   * Get all transactions for a client (all projects)
   */
  async findByClient(clientId: string | Types.ObjectId) {
    return this.ledgerModel
      .find({ clientId: new Types.ObjectId(clientId) })
      .sort({ transactionDate: -1 })
 .populate('clientId', 'nameAr nameEn code phone email isActive')
            .populate('projectId', 'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy')
            .populate('createdBy', 'name email')      .exec();
  }

  /**
   * Get transactions for a specific project
   */
  async findByProject(projectId: string | Types.ObjectId) {
    return this.ledgerModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .sort({ transactionDate: -1 })
 .populate('clientId', 'nameAr nameEn code phone email isActive')
            .populate('projectId', 'nameAr nameEn code location startDate endDate contractAmount totalPaid totalInvoiced materialCosts laborCosts otherCosts totalCosts laborDetails status, isActive createdBy updatedBy')
            .populate('createdBy', 'name email')      .exec();
  }

  /**
   * Get total balance across all projects for a client
   */
  async getTotalClientBalance(clientId: Types.ObjectId): Promise<number> {
    const projects = await this.ledgerModel.distinct('projectId', { clientId: new Types.ObjectId(clientId) });

    let totalBalance = 0;

    for (const projectId of projects) {
      const balance = await this.getCurrentBalance(clientId, projectId);
      totalBalance += balance;
    }

    return totalBalance;
  }

  /**
   * Get balance breakdown by project for a client
   */

 
  async getClientBalanceBreakdown(clientId: string | Types.ObjectId) {
    const projects = await this.ledgerModel.distinct('projectId', { 
      clientId: new Types.ObjectId(clientId),
    });

    const breakdown: BreakdownItem[] = [];

    for (const projectId of projects) {
      const balance = await this.getCurrentBalance(
        new Types.ObjectId(clientId),
        projectId,
      );
      
      if (balance !== 0) {
        breakdown.push({
          projectId,
          balance,
        });
      }
    }

    return breakdown;
  }
}
// import { Injectable } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import {
//   ClientTransaction,
//   ClientTransactionDocument,
// } from 'src/DB/Models/Transaction/client/client-transaction.schema';
// import { CounterService } from '../../common/counter.service';

// @Injectable()
// export class ClientLedgerService {
//   constructor(
//     @InjectModel(ClientTransaction.name)
//     private readonly ledgerModel: Model<ClientTransactionDocument>,

//     private readonly counterService: CounterService,
//   ) {}


//   async createTransaction(data: {
//     clientId: Types.ObjectId;
//     projectId: Types.ObjectId
//     debit: number;
//     credit: number;
//     type: string;
//     referenceType: string;
//     referenceId: Types.ObjectId;
//     createdBy: Types.ObjectId;
//   }) {
//     const last = await this.ledgerModel
//       .findOne({ clientId: data.clientId, projectId: data.projectId })
//       .sort({ transactionDate: -1, _id: -1 });

//     const lastBalance = last?.balanceAfter ?? 0;

//     const transactionNo =
//       await this.counterService.getNext('client-transaction');

//     const balanceAfter = lastBalance + data.debit - data.credit;

//     const transaction = await this.ledgerModel.create({
//       ...data,
//       transactionNo,
//       balanceAfter,
//       transactionDate: new Date(),
//     });

//     return transaction;
//   }

//   async getCurrentBalance(clientId: Types.ObjectId, projectId: Types.ObjectId): Promise<number> {
//     const last = await this.ledgerModel
//       .findOne({ clientId: new Types.ObjectId(clientId), projectId: new Types.ObjectId(projectId) })
//       .sort({ transactionDate: -1, _id: -1 })
//       .select('balanceAfter');

//     return last?.balanceAfter ?? 0;
//   }


   
 

//   async findAll() {
//     return this.ledgerModel.find().sort({ transactionDate: -1 });
//   }

//   async findByClient(clientId: string | Types.ObjectId) {
//     return this.ledgerModel
//       .find({ clientId: new Types.ObjectId(clientId) })
//       .sort({ transactionDate: -1 })
//       .populate('projectId', 'nameAr nameEn code')
//       .exec();
//   }
// }
