import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { CloudService } from '../Services/cloud.service';

@Injectable()
export class CloudInterceptor implements NestInterceptor {
  constructor(private readonly cloudService: CloudService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const file = request.file as Express.Multer.File;

    if (file) {
      const folderId = Math.ceil(Math.random() * 10000 + 9999).toString();

      const { secure_url, public_id } = await this.cloudService.uploadFile({
        path: file.path,
        folder: folderId,
      });

      request.body.image = {
        secure_url,
        public_id,
        folderId,
      };
    }

    return next.handle().pipe(
      catchError((err) => {
        this.cloudService.deleteFolder(request.body.image.folderId);
        return throwError(() => err);
      }),
    );
  }
}
