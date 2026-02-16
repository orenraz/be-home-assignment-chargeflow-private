// Define a custom Json type
export type Json = { [key: string]: Json } | string | number | boolean | null | undefined;

export function errorResponse(status: number, code: string, message: string, details?: Json): Response {
  return new Response(JSON.stringify({
    error: {
      code,
      message,
      details,
    },
  }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function jsonResponse(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}