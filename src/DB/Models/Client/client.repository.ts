import { DBService } from 'src/DB/db.service';
import { TClient, Client } from './client.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientRepository extends DBService<TClient> {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<TClient>,
  ) {
    super(clientModel);
  }


 

async findById(id: string | Types.ObjectId): Promise<TClient | null> {
    return await this.clientModel
        .findById(id)
        .populate('projects', 'nameAr nameEn -_id')
        .exec();
}


  async findByName(nameAr?: string, nameEn?: string): Promise<TClient | null> {
    if (!nameAr && !nameEn) return null;

    const orConditions: FilterQuery<TClient>[] = [];
    if (nameAr) orConditions.push({ nameAr });
    if (nameEn) orConditions.push({ nameEn });

    return this.findOne({ $or: orConditions });
  }

 

  async findByCode(code: string): Promise<TClient | null> {
    return this.findOne({ code: code.toUpperCase() });
  }
 async findActive(): Promise<TClient[] | null> {
        return this.find({ isActive: true });
    }

 async searchClients(
        searchTerm: string,
    ): Promise<TClient[] | null> {
        if (!searchTerm || !searchTerm.trim()) {
            return this.find({ isActive: true });
        }

        const regex = new RegExp(searchTerm.trim(), 'i');

        return await this.clientModel
            .find({
                isActive: true,
                $or: [
                    { nameAr: regex },
  { nameEn: regex },
                    { phone: regex },
                    { email: regex },
                ],
            })
            .sort({ nameAr: 1 })
    }



  findByEmail(email: string): Promise<TClient | null> {
    const userData = this.findOne({ email });
    return userData;
  }

   async deactivate(
          id: string | Types.ObjectId,
          userId: Types.ObjectId,
      ): Promise<TClient | null> {
          return this.clientModel
              .findByIdAndUpdate(
                  id,
                  { isActive: false, updatedBy: userId },
                  { new: true },
              )
              .exec();
      }
  
      async activate(
          id: string | Types.ObjectId,
          userId: Types.ObjectId,
      ): Promise<TClient | null> {
          return this.clientModel
              .findByIdAndUpdate(
                  id,
                  { isActive: true, updatedBy: userId },
                  { new: true },
              )
              .exec();
      }
}
