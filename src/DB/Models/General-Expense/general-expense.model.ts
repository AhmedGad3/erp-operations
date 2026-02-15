import { MongooseModule } from '@nestjs/mongoose';
import { GeneralExpense, GeneralExpenseSchema } from './general-expense.schema';

export const GeneralExpenseModel = MongooseModule.forFeature([
    {
        name: GeneralExpense.name,
        schema: GeneralExpenseSchema,
    },
]);