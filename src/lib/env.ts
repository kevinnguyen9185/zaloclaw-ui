const DEFAULT_GATEWAY_URL = "ws://localhost:18789";

export const GATEWAY_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ?? DEFAULT_GATEWAY_URL;
