import { DBService } from '../../db.service';
import { TUser, User } from './user.schema';
import { FilterQuery, Model, ProjectionType, QueryOptions, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository extends DBService<TUser> {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<TUser>,
  ) {
    super(userModel);
  }

  findByEmail(email: string): Promise<TUser | null> {
    const userData = this.findOne({ email });
    return userData;
  }


  findById(id: string | Types.ObjectId): Promise<TUser | null> {
    return this.userModel.findById(id).select('-_password').exec();
  }

  findOne(filter?: FilterQuery<TUser> | undefined, projection?: ProjectionType<TUser> | undefined, options?: QueryOptions): Promise<TUser | null> {
    return this.userModel.findOne(filter, projection, options).select('name email role').exec();
  }
}
