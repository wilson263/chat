import Groq from "groq-sdk";

function createClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No Groq API key found. Set GROQ_API_KEY environment variable.",
    );
  }

  return new Groq({ apiKey });
}

let _client: Groq | null = null;

export const groq: Groq = new Proxy({} as Groq, {
  get(_target, prop) {
    if (!_client) _client = createClient();
    return (_client as any)[prop];
  },
});
