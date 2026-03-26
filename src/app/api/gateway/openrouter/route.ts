import { NextResponse } from "next/server";

import { saveOpenRouterApiKey } from "@/lib/openclaw-config";
import {
  OPENROUTER_KEY_SAVED_MESSAGE,
  sanitizeOpenRouterMessage,
  validateOpenRouterApiKey,
} from "@/lib/openrouter";

type SaveOpenRouterRequest = {
  apiKey?: unknown;
};

export async function POST(request: Request) {
  let body: SaveOpenRouterRequest;

  try {
    body = (await request.json()) as SaveOpenRouterRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey : "";
  const validationError = validateOpenRouterApiKey(apiKey);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    await saveOpenRouterApiKey(apiKey);

    return NextResponse.json(
      {
        ok: true,
        message: OPENROUTER_KEY_SAVED_MESSAGE,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? sanitizeOpenRouterMessage(error.message, apiKey)
        : "Unable to save OpenRouter key.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}