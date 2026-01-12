import { MongooseModule } from '@nestjs/mongoose';
import { MaterialIssue, MaterialIssueSchema } from './material-issue.schema';

export const MaterialIssueModel = MongooseModule.forFeature([
    { name: MaterialIssue.name, schema: MaterialIssueSchema },
]);