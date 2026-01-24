import { DBService } from '../../db.service';
import { TUser, User } from './user.schema';
import { Model, Types } from 'mongoose';
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
    return this.userModel.findById(id).select('-password').exec();
  }
  
  findAll() {
  return this.userModel.find().exec();
}

updateById(id: string, data: Partial<TUser>) {
  return this.userModel.findByIdAndUpdate(
    id,
    data,
    { new: true }
  ).exec();
}


softDelete(id: string,  user: TUser) {
  return this.userModel.findByIdAndUpdate(
    id,
    { 
      isActive: false,
      updatedBy: user._id as Types.ObjectId
    },
    { new: true }
  ).exec();
}


  
}
