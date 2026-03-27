/**
 * OpenAI Moderation API wrapper.
 * Falls back to "clean" if API key is not configured.
 */
export async function moderateContent(text: string): Promise<{
  flagged: boolean;
  categories: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { flagged: false, categories: [] };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    });

    if (!res.ok) return { flagged: false, categories: [] };

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { flagged: false, categories: [] };

    const flaggedCategories = Object.entries(result.categories as Record<string, boolean>)
      .filter(([, v]) => v)
      .map(([k]) => k);

    return { flagged: result.flagged, categories: flaggedCategories };
  } catch {
    return { flagged: false, categories: [] };
  }
}
