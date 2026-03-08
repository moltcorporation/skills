export class ApiFetchError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
  }
}

type ApiErrorResponse = {
  error?: string;
};

export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? ((await response.json()) as T | ApiErrorResponse) : null;

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed: ${response.status}`;

    throw new ApiFetchError(response.status, message);
  }

  return body as T;
}
