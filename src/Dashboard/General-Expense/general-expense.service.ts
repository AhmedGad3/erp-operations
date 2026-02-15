import { 
    BadRequestException, 
    Injectable, 
    NotFoundException 
} from '@nestjs/common';
import { Types } from 'mongoose';
import { TUser } from 'src/DB';
import { GeneralExpenseRepository } from 'src/DB/Models/General-Expense/general-expense.repository';
import { CounterService } from '../transaction/common/counter.service';
import { CreateGeneralExpenseDto, UpdateGeneralExpenseDto } from './dto';

@Injectable()
export class GeneralExpenseService {
    constructor(
        private readonly expenseRepo: GeneralExpenseRepository,
        private readonly counterService: CounterService,
    ) {}

    // Create
    async create(dto: CreateGeneralExpenseDto, user: TUser) {
        const expenseNo = await this.counterService.getNext('general-expense');

        const expense = await this.expenseRepo.create({
            ...dto,
            expenseNo,
            expenseDate: new Date(dto.expenseDate),
            createdBy: user._id,
        });

        return expense;
    }

    // Find All
    async findAll() {
        return this.expenseRepo.find({ isActive: true });
    }

    // Find One
    async findOne(id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID');
        }

        const expense = await this.expenseRepo.findActiveById(id);
        
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        return expense;
    }

    // Update
    async update(id: string, dto: UpdateGeneralExpenseDto, user: TUser) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID');
        }

        const expense = await this.expenseRepo.findActiveById(id);
        
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        const updateData: any = {
            ...dto,
            updatedBy: user._id,
        };

        if (dto.expenseDate) {
            updateData.expenseDate = new Date(dto.expenseDate);
        }

        return this.expenseRepo.findByIdAndUpdate(id, updateData, { new: true });
    }

    // Delete (Soft)
    async remove(id: string, user: TUser) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid ID');
        }

        const expense = await this.expenseRepo.findActiveById(id);
        
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        return this.expenseRepo.deactivate(id, user._id as Types.ObjectId);
    }
}