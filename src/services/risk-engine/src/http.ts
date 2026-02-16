// Moved to utils folder
export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

export function jsonResponse(body: Json, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  return jsonResponse(
    {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    status
  );
}