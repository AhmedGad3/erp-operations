import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { UnitModule } from './unit/unit.module';
import { MaterialModule } from './material/material.module';
import { SupplierModule } from './supplier/supplier.module';
import { TransactionModule } from './transaction/transaction.module';
import { ClientModule } from './client/client.module';
import { ProjectModule } from './project/project.module';
import { ReportsModule } from './reports/reports.module';
import { AssetModule } from './Asset/asset.module';
import { ProjectEquipmentModule } from './project-equipment/project-equipment.module';
import { ProjectMiscellaneousModule } from './project-miscellaneous/project-miscellaneous.module';
import { ProjectLaborModule } from './project-labor/project-labor.module';
import { GeneralExpenseModule } from './General-Expense/general-expense.module';
import { SubcontractorWorkModule } from './subcontractor-work/subcontractor-work.module';
import { ProjectSummaryModule } from './Project-Summary/Project-summary.module';
import { AssetInvoiceModule } from './Asset-Invoice/asset-invoice.module';

@Module({
  imports: [UserModule, UnitModule, MaterialModule, TransactionModule,
  SupplierModule, ClientModule, ProjectModule, ReportsModule, AssetModule,ProjectEquipmentModule, ProjectLaborModule, ProjectMiscellaneousModule,
GeneralExpenseModule, SubcontractorWorkModule ,ProjectSummaryModule, AssetInvoiceModule],
  controllers: [],
  providers: [],
})
export class DashboardModule { }
