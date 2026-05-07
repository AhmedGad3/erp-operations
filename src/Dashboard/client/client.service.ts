import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ClientRepository } from '../../DB/Models/Client/client.repository';
import { CreateClientDto, UpdateClientDto } from './dto';
import { TUser } from '../../DB';
import { Types } from 'mongoose';
import { TClient } from '../../DB/Models/Client/client.schema';
import { CounterService } from '../transaction/common/counter.service';


@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
     private readonly i18n: I18nService,
     private readonly counterService: CounterService,
  ) {}
 private getLang(): string {
        return I18nContext.current()?.lang || 'ar';
    }

    private async generateUniqueClientCode(): Promise<string> {
        for (let attempt = 0; attempt < 10; attempt += 1) {
            const code = await this.counterService.getNextCode('client-code', 'CLT');
            const codeExists = await this.clientRepository.findByCode(code);
            if (!codeExists) return code;
        }

        throw new ConflictException('Unable to generate a unique client code');
    }

    async createClient (createClientDto: CreateClientDto , user: TUser): Promise<TClient> {
       const lang = this.getLang();
       const code = createClientDto.code?.trim()
           ? createClientDto.code.trim().toUpperCase()
           : await this.generateUniqueClientCode();
      
              const exists = await this.clientRepository.findByName(
                  createClientDto.nameAr,
                  createClientDto.nameEn
              );
              if (exists) {
                  throw new ConflictException(
                      this.i18n.translate('clients.errors.alreadyExists', { lang })
                  );
              }
  const codeExists = await this.clientRepository.findByCode(code)
        if (codeExists) {
            throw new ConflictException(
                this.i18n.translate('clients.errors.codeExists', {
                    lang,
                    args: { code },
                })
            );
        }

         const clientData = {
                    ...createClientDto,
                    code,
                    createdBy: user._id as Types.ObjectId,
                }
       const client = await this.clientRepository.create(clientData);

        return client

    } 

    async findAllClients(): Promise<TClient[]> {
            return await this.clientRepository.find() as TClient[];;
        }


async findById(id: string): Promise<TClient> {
    const lang = this.getLang();

    if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
            this.i18n.translate('clients.errors.invalidId', { lang }),
        );
    }

    const client = await this.clientRepository.findById(id);  // ✅ مع populate

    if (!client) {
        throw new NotFoundException(
            this.i18n.translate('clients.errors.notFound', { lang }),
        );
    }

    return client;  // ✅ المشاريع جاية مع الـ virtual
}

    async updateClient(id: string, updateClientDto: UpdateClientDto , user: TUser): Promise<TClient> {
        const lang = this.getLang();
      const client = await this.clientRepository.findByIdAndUpdate(id, updateClientDto, { new: true });
        if (!client || !client.isActive) {
            throw new NotFoundException(this.i18n.translate('clients.errors.notFound', { lang }));
        }
      
        return client
    }

    async deleteClient(id: string, user: TUser): Promise<TClient> {
        const lang = this.getLang();
        const client = await this.clientRepository.findById( id );
        if (!client || !client.isActive) {
            throw new NotFoundException(this.i18n.translate('clients.errors.notFound', { lang }));
        }

        client.isActive = false;
        client.updatedBy = user._id as Types.ObjectId;
        await client.save();

        return client;
    }

    async activateClient(id: string , user: TUser): Promise<TClient> {
        const lang = this.getLang();
        const client = await this.clientRepository.findById( id );
        if (!client) {
            throw new NotFoundException(this.i18n.translate('clients.errors.notFound', { lang }));
        }

        if (client.isActive) {
            throw new BadRequestException(this.i18n.translate('clients.errors.alreadyActive', { lang }));
        }

        client.isActive = true;
        client.updatedBy = user._id as Types.ObjectId;
        await client.save();

        return client as TClient;
    }

    async searchClients(searchTerm: string): Promise<TClient[] | null> {
        return await this.clientRepository.searchClients(searchTerm);
    }
}
