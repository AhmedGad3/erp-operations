import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, Observable, throwError } from 'rxjs';
import { CloudService } from '../Services/cloud.service';

type ImagePayload = {
  secure_url: string;
  public_id: string;
  folderId: string;
};

type CloudRequest = Omit<Request, 'body'> & {
  file?: Express.Multer.File;
  body: {
    image?: ImagePayload;
    [key: string]: unknown;
  };
};

@Injectable()
export class CloudInterceptor implements NestInterceptor {
  constructor(private readonly cloudService: CloudService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<CloudRequest>();
    const file = request.file;

    if (file) {
      const folderId = Math.ceil(Math.random() * 10000 + 9999).toString();

      const uploadResult = (await this.cloudService.uploadFile({
        path: file.path,
        folder: folderId,
      })) as { secure_url: string; public_id: string };

      request.body.image = {
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        folderId,
      };
    }

    return next.handle().pipe(
      catchError((err: unknown) => {
        const folderId = request.body.image?.folderId;
        if (folderId) {
          void this.cloudService.deleteFolder(folderId);
        }
        return throwError(() => err);
      }),
    );
  }
}
