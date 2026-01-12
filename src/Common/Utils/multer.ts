import { diskStorage } from 'multer';

export const multerOptions = () => ({
  storage: diskStorage({}),
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});
