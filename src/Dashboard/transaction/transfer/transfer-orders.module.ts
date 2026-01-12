
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CommonModule } from "../common/common.module";
import { StockModule } from "../stock/stock.module";
import { ClientLedgerModule } from "../ledger/Client/client-ledger.module";
import { MaterialIssue, MaterialIssueSchema } from "../../../DB/Models/Transaction/project/material-issue.schema";
import { ProjectInvoice, ProjectInvoiceSchema } from "../../../DB/Models/Transaction/project/project-invoice.schema";
import { Material, MaterialRepository, MaterialSchema } from "../../../DB";
import { Project, ProjectSchema } from "../../../DB/Models/Project/project.schema";
import { MaterialIssueController } from "./transfer-orders.controller";
import { MaterialIssueService } from "./transfer-orders.service";

@Module({
    imports: [
        CommonModule,       
        StockModule,       
        ClientLedgerModule, 
        MongooseModule.forFeature([
            { name: MaterialIssue.name, schema: MaterialIssueSchema },
            { name: ProjectInvoice.name, schema: ProjectInvoiceSchema },
            { name: Material.name, schema: MaterialSchema },
            { name: Project.name, schema: ProjectSchema },
        ])
    ],
    controllers: [MaterialIssueController],
    providers: [MaterialIssueService, MaterialRepository],
    exports: [MaterialIssueService],  
})
export class TransferOrdersModule {}