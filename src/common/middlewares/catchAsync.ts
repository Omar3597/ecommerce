import { Request, Response, NextFunction } from "express";

export const catchAsync =
  <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
    fn: (
      req: Request<P, ResBody, ReqBody, ReqQuery>,
      res: Response,
      next: NextFunction,
    ) => Promise<any>,
  ) =>
  (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    fn(req, res, next).catch(next);
  };
