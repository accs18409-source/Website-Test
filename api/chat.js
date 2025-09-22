import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let totalTokens = 40000; // shared pool

// rough token estimator (similar to frontend)
function estimateTokens(text) {
  return Math.ceil(text.split(" ").length * 1.3);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages } = req.body;
  if (!messages) return res.status(400).json({ error: "No messages provided" });

  try {
    // estimate cost of user’s latest message
    const userMessage = messages[messages.length - 1]?.content || "";
    const inputCost = estimateTokens(userMessage);
    if (totalTokens - inputCost <= 0) {
      return res.status(403).json({ error: "Out of tokens" });
    }
    totalTokens -= inputCost;

    // ask OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 100, // cap assistant’s response
    });

    const reply = completion.choices?.[0]?.message?.content ?? "";

    // estimate reply cost
    const outputCost = estimateTokens(reply);
    if (totalTokens - outputCost <= 0) {
      return res.status(403).json({ error: "Out of tokens" });
    }
    totalTokens -= outputCost;

    // send reply + updated tokens
    res.status(200).json({
      choices: completion.choices,
      tokens_left: totalTokens,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
}
