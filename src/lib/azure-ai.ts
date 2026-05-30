/**
 * Azure AI wrapper — formalización de texto con gpt-5.5.
 *
 * Usa la API v1 de Azure AI Foundry:
 * POST {AZURE_OPENAI_ENDPOINT}/chat/completions
 * Header: api-key
 * Body: { model, messages, max_completion_tokens }
 * ⚠️ gpt-5.5 (o-series): NO admite temperature, top_p, etc.
 */

const ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!; // incluye /openai/v1
const API_KEY = process.env.AZURE_OPENAI_API_KEY!;
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-5.5";

export async function formalizarTexto(borrador: string): Promise<string> {
  if (!ENDPOINT || !API_KEY) {
    throw new Error("Variables de entorno de Azure OpenAI no configuradas.");
  }

  const url = `${ENDPOINT}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify({
      model: DEPLOYMENT,
      messages: [
        {
          role: "system",
          content:
            "Eres un redactor formal de informes de seguridad. " +
            "Reescribe el siguiente texto en tono formal institucional, " +
            "manteniendo todos los hechos, fechas y nombres tal como aparecen. " +
            "Usa lenguaje claro, conciso y profesional. " +
            "No agregues información que no esté en el original.",
        },
        {
          role: "user",
          content: borrador,
        },
      ],
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Azure OpenAI error ${response.status}: ${err}`);
  }

  const json = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const texto = json.choices?.[0]?.message?.content?.trim();
  if (!texto) throw new Error("Respuesta vacía de Azure OpenAI.");
  return texto;
}
