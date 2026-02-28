import { Controller, Get, Query } from '@nestjs/common';
import { Auth } from 'src/Common';
import { ProjectSummaryService } from './Project-summary.service';
import { ProjectSummaryQueryDto } from './dto/Project-summary-query.dto';

@Auth('admin')
@Controller('admin/reports/projects/summary')
export class ProjectSummaryController {
    constructor(private readonly projectSummaryService: ProjectSummaryService) {}

    @Auth('admin', 'accountant', 'manager')
    @Get()
    async getProjectSummary(@Query() query: ProjectSummaryQueryDto) {
        return this.projectSummaryService.getProjectSummary(query);
    }
}
