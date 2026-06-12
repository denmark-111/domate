import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const apiErrorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
    return res.status(404).json({ message: "Resource not found" });
  }

  const status = err.status || 500;
  const response = {
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};
