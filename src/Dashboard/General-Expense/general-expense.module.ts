import { Module } from '@nestjs/common';
import { GeneralExpenseService } from './general-expense.service';
import { GeneralExpenseController } from './general-expense.controller';
import { GeneralExpenseModel } from 'src/DB/Models/General-Expense/general-expense.model';
import { GeneralExpenseRepository } from 'src/DB/Models/General-Expense/general-expense.repository';
import { CommonModule } from '../transaction/common/common.module';

@Module({
    imports: [
        GeneralExpenseModel,
        CommonModule,
    ],
    controllers: [GeneralExpenseController],
    providers: [GeneralExpenseService, GeneralExpenseRepository],
    exports: [GeneralExpenseService, GeneralExpenseRepository],
})
export class GeneralExpenseModule {}