import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Req,
} from '@nestjs/common';
import { GeneralExpenseService } from './general-expense.service';
import { Auth } from 'src/Common';
import { CreateGeneralExpenseDto, UpdateGeneralExpenseDto } from './dto';


@Auth('admin, accountant')
@Controller('/admin/general-expenses')
export class GeneralExpenseController {
    constructor(
        private readonly generalExpenseService: GeneralExpenseService
    ) {}

    @Post()
    create(
        @Body() createDto: CreateGeneralExpenseDto,
        @Req() req: Request
    ) {
        return this.generalExpenseService.create(createDto, req['user']);
    }

    @Get()
    findAll() {
        return this.generalExpenseService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.generalExpenseService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateDto: UpdateGeneralExpenseDto,
        @Req() req: Request
    ) {
        return this.generalExpenseService.update(id, updateDto, req['user']);
    }

    @Delete(':id')
    remove(@Param('id') id: string,  @Req() req: Request) {
        return this.generalExpenseService.remove(id, req['user']);
    }
}