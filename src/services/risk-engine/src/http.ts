// Define a custom Json type
export type Json = { [key: string]: Json } | string | number | boolean | null | undefined;

// Moved to utils folder
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
  details?: Json // Updated to conform to Json type
): Response {
  return jsonResponse(
    {
      error: {
        details: details as Json | undefined,
        code: "ERROR_CODE",
        message: "Error message",
      },
    },
    status
  );
}