import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      files?: {
        images?: Express.Multer.File[];
        videos?: Express.Multer.File[];
      } | Express.Multer.File[];
    }
  }
}

