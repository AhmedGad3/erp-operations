import { DbOptions } from 'mongodb';
import {
  ClientSession,
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  SaveOptions,
  Types,
  UpdateQuery,
} from 'mongoose';

interface DBOptions {
  session?: ClientSession;
  new?: boolean;
  upsert?: boolean;
  runValidators?: boolean;
}

export abstract class DBService<T> {
  constructor(private readonly model: Model<T>) { }

  async create(data: any, options?: SaveOptions): Promise<T> {
    const [result] = await this.model.create([data], options);
    return result;
  }

  find(
    filter?: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<T[] | null> {
    return this.model.find(filter || {}, projection, options);
  }
  async findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return this.model.findById(id, projection, options);
  }
  async findOne(
    filter?: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions,
  ): Promise<T | null> {
    return this.model.findOne(filter, projection, options);
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions,
  ) {
    // Use findOneAndUpdate so that arbitrary filter queries work correctly
    return this.model.findOneAndUpdate(filter, update, options);
  }

  async updateMany(filter: FilterQuery<T>, update: UpdateQuery<T>) {
    await this.model.updateMany(filter, update);
  }
  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: DBOptions,
  ): Promise<any> {
    return await this.model.updateOne(filter, update, options).exec();
  }

  async deleteOne(
    filter: FilterQuery<T>,
    options?: DBOptions,
  ): Promise<any> {
    return await this.model.deleteOne(filter, options).exec();
  }

  deleteMany(filter: FilterQuery<T>) {
    return this.model.deleteMany(filter);
  }

  async findByIdAndUpdate(
    id: string | any,
    update: UpdateQuery<T>,
    options?: QueryOptions & { session?: ClientSession },
  ): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, update, { new: true, ...options })
  }

  // updateOne():Promise<T>{}
}
