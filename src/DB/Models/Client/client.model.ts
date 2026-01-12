import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema} from './client.schema';

// model
export const ClientModel = MongooseModule.forFeature([
  { name: Client.name, schema: ClientSchema},
]);
