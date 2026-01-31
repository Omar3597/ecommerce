import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { getConfig } from "../../config/config.js";
import AppError from "../utils/appError.js";
import { ZodError } from "zod";

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

export const errHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { env } = getConfig();

  let error = Object.create(err);

  if (error instanceof ZodError) {
    return void res.status(400).json({
      status: "fail",
      errors: error.flatten(),
    });
  }

  if (env === "production") {
    sendErrorProd(error, res);
  } else {
    sendErrorDev(error, res);
  }
};
