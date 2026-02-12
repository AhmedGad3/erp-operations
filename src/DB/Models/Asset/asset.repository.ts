import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DBService } from 'src/DB/db.service';
import { Asset, TAsset } from './asset.schema';

@Injectable()
export class AssetRepository extends DBService<TAsset> {
  constructor(
    @InjectModel(Asset.name)
    private readonly assetModel: Model<TAsset>,
  ) {
    super(assetModel);
  }

  // ✅ Find by ID
  async findById(id: string | Types.ObjectId): Promise<TAsset | null> {
    return this.assetModel
      .findById(id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .exec();
  }

  // ✅ Find by Code
  async findByCode(code: string): Promise<TAsset | null> {
    return this.findOne({ code: code.toUpperCase() });
  }

  // ✅ Find Active Assets
  async findActive(): Promise<TAsset[]> {
    const result = await this.find({ isActive: true });
    return result ?? [];
  }

  // ✅ Search Assets
  async searchAssets(searchTerm: string): Promise<TAsset[]> {
    if (!searchTerm || !searchTerm.trim()) {
      const result = await this.find({ isActive: true });
      return result ?? [];
    }

    const regex = new RegExp(searchTerm.trim(), 'i');

    const result = await this.assetModel
      .find({
        isActive: true,
        $or: [
          { nameAr: regex },
          { nameEn: regex },
          { code: regex },
          { assetTypeAr: regex },
          { assetTypeEn: regex },
        ],
      })
      .sort({ nameAr: 1 })
      .exec();

    return result ?? [];
  }

  // ✅ Find Available Assets
  async findAvailableAssets(): Promise<TAsset[]> {
    const result = await this.find({
      status: 'AVAILABLE',
      
    });

    return result ?? [];
  }

  // ✅ Find by Status
  async findByStatus(status: string): Promise<TAsset[]> {
    const result = await this.find({ status });
    return result ?? [];
  }

  // ✅ Update Status
  async updateStatus(
    id: string | Types.ObjectId,
    status: string,
    userId: Types.ObjectId,
  ): Promise<TAsset | null> {
    return this.assetModel
      .findByIdAndUpdate(
        id,
        { status, updatedBy: userId },
        { new: true },
      )
      .exec();
  }

  // ✅ Deactivate
  async deactivate(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<TAsset | null> {
    return this.assetModel
      .findByIdAndUpdate(
        id,
        { isActive: false, updatedBy: userId },
        { new: true },
      )
      .exec();
  }

  // ✅ Activate
  async activate(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<TAsset | null> {
    return this.assetModel
      .findByIdAndUpdate(
        id,
        { isActive: true, updatedBy: userId },
        { new: true },
      )
      .exec();
  }
}
