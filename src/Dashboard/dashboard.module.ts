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

@Module({
  imports: [UserModule, UnitModule, MaterialModule, TransactionModule,
    SupplierModule, ClientModule, ProjectModule, ReportsModule, AssetModule],
  controllers: [],
  providers: [],
})
export class DashboardModule { }
