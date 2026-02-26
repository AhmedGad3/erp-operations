import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import { AssetInvoiceService } from './asset-invoice.service';
import { Auth } from '../../Common';
import { CreateAssetInvoiceDto } from './dto';

@Auth('admin')
@Controller('/admin/asset-invoices')
export class AssetInvoiceController {
    constructor(private readonly assetInvoiceService: AssetInvoiceService) {}

    // ✅ Create Invoice
    @Post()
    async create(
        @Body() dto: CreateAssetInvoiceDto,
        @Req() req: Request,
    ) {
        const result = await this.assetInvoiceService.create(dto, req['user']);
        return {
            result,
            message: 'Invoice created successfully',
        };
    }

    // ✅ Get All Invoices
    @Get()
    async findAll() {
        const result = await this.assetInvoiceService.findAll();
        return {
            result,
            message: 'Invoices fetched successfully',
        };
    }

    // ✅ Get Invoices Paginated
    @Get('paginated')
    async findWithPagination(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        const result = await this.assetInvoiceService.findWithPagination(+page, +limit);
        return {
            result,
            message: 'Invoices fetched successfully',
        };
    }

    // ✅ Get Total Amount
    @Get('total')
    async getTotalAmount(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const result = await this.assetInvoiceService.getTotalAmount(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
        return {
            result,
            message: 'Total amount fetched successfully',
        };
    }

    @Get('by-asset/:assetId')
async findByAssetId(@Param('assetId') assetId: string) {
    const result = await this.assetInvoiceService.findByAssetId(assetId);
    return {
        result,
        message: 'Invoice fetched successfully',
    };
}

    // ✅ Get Invoice by ID
    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.assetInvoiceService.findOne(id);
        return {
            result,
            message: 'Invoice fetched successfully',
        };
    }

    // ✅ Delete Invoice (Soft Delete)
    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @Req() req: Request,
    ) {
        const result = await this.assetInvoiceService.remove(id, req['user']);
        return {
            result,
            message: 'Invoice deleted successfully',
        };
    }
}