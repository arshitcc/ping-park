import { NextFunction, Request, Response } from "express";
import { z, ZodError, ZodType } from "zod/v4";
import { ApiError } from "../utils/api-error";

export const validate =
  (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req);
      Object.assign(req, data);
      next();
    } catch (error: ZodError | any) {
      const msg =
        error.issues?.map((err: z.core.$ZodIssue) => err.message)?.[0] ||
        "Validation failed";
      throw new ApiError(400, "Validation Failed", msg);
    }
  };
