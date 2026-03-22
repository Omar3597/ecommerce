import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { getConfig } from "../../config/env.js";
import AppError from "../utils/appError.js";

const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message || "Something went wrong",
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err: AppError, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

const handleZodError = (err: ZodError, res: Response) => {
  return res.status(400).json({
    status: "fail",
    message: "Validation failed",
    errors: err.flatten(),
  });
};

const handlePrismaKnownError = (
  err: Prisma.PrismaClientKnownRequestError,
): AppError => {
  switch (err.code) {
    case "P2002": {
      const fields = Array.isArray(err.meta?.target)
        ? err.meta.target.join(", ")
        : "field";
      return new AppError(409, `Duplicate value for: ${fields}`);
    }
    case "P2025":
      return new AppError(404, "Record not found");
    case "P2003":
      return new AppError(400, "Invalid relation reference");
    case "P2011":
      return new AppError(400, "Missing required field");
    case "P2000":
      return new AppError(400, "Input value is too long");
    default:
      return new AppError(400, "Database request failed");
  }
};

const handlePrismaError = (err: unknown): AppError | null => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaKnownError(err);
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return new AppError(400, "Invalid database query input");
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return new AppError(500, "Database connection failed");
  }
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError(500, "Database engine failed");
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return new AppError(500, "Unknown database request error");
  }
  return null;
};

export const errHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { env } = getConfig();

  if (err instanceof ZodError) {
    return void handleZodError(err, res);
  }

  const prismaError = handlePrismaError(err);

  let error: AppError;
  if (prismaError) {
    error = prismaError;
  } else if (err instanceof AppError) {
    error = err;
  } else if (err instanceof Error) {
    error = new AppError(500, err.message || "Something went wrong");
    error.isOperational = false;
  } else {
    error = new AppError(500, "Something went wrong");
    error.isOperational = false;
  }

  if (env === "production") {
    return void sendErrorProd(error, res);
  }

  return void sendErrorDev(error, res);
};
