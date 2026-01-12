import { Module } from '@nestjs/common';
import {  ClientController } from './client.controller';
import { ClientModel } from '../../DB/Models/Client/client.model';
import { ClientRepository } from '../../DB/Models/Client/client.repository';
import { ClientService } from './client.service';
import { ProjectModel } from '../../DB/Models/Project/project.model';
import { ProjectRepository } from '../../DB/Models/Project/project.repository';

@Module({
  imports: [ClientModel],
  controllers: [ClientController],
  providers: [ClientRepository, ClientService ],
  
})
export class ClientModule {}
