export type HttpError = Error & { status?: number };

export const createHttpError = (message: string, status?: number): HttpError => {
  const error = new Error(message) as HttpError;
  if (typeof status === 'number') {
    error.status = status;
  }
  return error;
};
