export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class HttpError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export function extractErrorMessage(
  body: unknown,
  fallback = "Une erreur est survenue",
): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message;
  }

  return fallback;
}
