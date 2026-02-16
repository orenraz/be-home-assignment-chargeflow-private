// Define a custom Json type
export type Json = { [key: string]: Json } | string | number | boolean | null | undefined;