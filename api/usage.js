export default async function handler(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      .toISOString()
      .split("T")[0];
    const end = start;

    const response = await fetch(
      `https://api.openai.com/v1/usage?start_date=${start}&end_date=${end}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const data = await response.json();

    // Budget = 40k tokens
    const budget = 40000;
    const used = data?.total_usage?.total_tokens || 0;
    const left = Math.max(budget - used, 0);

    res.status(200).json({ tokens_used: used, tokens_left: left });
  } catch (error) {
    res.status(500).json({ error: "Usage check failed" });
  }
}
