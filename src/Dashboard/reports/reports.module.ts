import { Module } from '@nestjs/common';
import { SupplierStatementModule } from './supplier-statement/supplier-statement.module';

@Module({
    imports: [SupplierStatementModule],
})
export class ReportsModule {}
