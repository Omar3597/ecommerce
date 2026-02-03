import { Request, Response, NextFunction } from "express";

export const catchAsync =
  <Req extends Request = Request>(
    fn: (req: Req, res: Response, next: NextFunction) => Promise<any>,
  ) =>
  (req: Req, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
