import mongoose from "mongoose";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

const errorHandler: ErrorRequestHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? 400 : 500;
    const message = error.message || "Something went wrong";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  if (error.message === "jwt expired" && error.statusCode === 500) {
    error.statusCode = 401;
    error.message = "Session Expired!! Please login again";
  }

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode).json(response);
  return;
};

export { errorHandler };
