import { Injectable } from '@nestjs/common';
import cloudinary from '../Config/cloud.config';

interface IUploadFile {
  path: string;
  folder?: string;
  public_id?: string;
}
@Injectable()
export class CloudService {
  async uploadFile({ path, folder, public_id }: IUploadFile) {
    return await cloudinary.uploader.upload(path, { folder, public_id });
  }

  // async uploadFiles(files: Express.Multer.File[], folder: string) {
  //   const images: IImage[] = [];
  //   for (const file of files) {
  //     const { secure_url, public_id } = await this.uploadFile({
  //       path: file.path,
  //       folder,
  //     });
  //     images.push({ secure_url, public_id });
  //   }
  //   return images;
  // }

  async deleteFile(public_id: string) {
    await cloudinary.uploader.destroy(public_id);
  }

  private async deleteFolderResources(path: string) {
    await cloudinary.api.delete_resources_by_prefix(path);
  }

  async deleteFolder(path: string) {
    await this.deleteFolderResources(path);
    await cloudinary.api.delete_folder(path);
  }
}
