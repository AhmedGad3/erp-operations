import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
    StockMovement,
    StockMovementSchema,
} from 'src/DB/Models/Transaction/stock-movement.schema';
import { StockMovementService } from './stock-movement.service';
import { CommonModule } from '../common/common.module';
import { Material, MaterialRepository, MaterialSchema } from 'src/DB';
import { StockMovementController } from './stock-movement.controller';

@Module({
    imports: [
        CommonModule,
        // CounterService
        MongooseModule.forFeature([
            { name: StockMovement.name, schema: StockMovementSchema },
            { name: Material.name, schema: MaterialSchema },
        ]),
    ],
    controllers: [
        StockMovementController
    ],
    providers: [StockMovementService, MaterialRepository],
    exports: [StockMovementService], // 👈 مهم
})
export class StockModule { }
