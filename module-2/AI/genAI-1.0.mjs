import fetch from "node-fetch";

class AI {
  constructor({ apiKey }) {
    if (!apiKey) throw new Error("Groq API key is required");
    this.apiKey = apiKey;
    // Groq uses the standard OpenAI chat completion endpoint
    this.endpoint = "https://api.groq.com/openai/v1/chat/completions";
    this.modelName = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  /**
   * Ask AI with messages array
   * Supports standard { role, content } format
   */
  async ask(messages, answer_format = "text") {
    console.log("Starting with Groq model: " + this.modelName);

    // SANITIZE: Strip out _id, __v, or any other DB-specific fields
    const cleanMessages = messages.map(m => ({
      role: m.role,
      content: String(m.content) // Ensure content is a string
    }));

    const body = {
      model: this.modelName,
      messages: cleanMessages, // Use the clean version
      response_format: answer_format === "json" ? { type: "json_object" } : { type: "text" },
      temperature: 0.1,
    };
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.code === "rate_limit_exceeded") {
        console.error("Groq Rate Limit Hit. Check your dashboard.");
      }
      throw new Error(`Groq API Error: ${data.error.message}`);
    }

    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("AI did not return a valid response");
    }

    // Return as object if JSON was requested, otherwise return string
    return answer_format === "json" ? JSON.parse(content) : content;
  }
}

export default AI;