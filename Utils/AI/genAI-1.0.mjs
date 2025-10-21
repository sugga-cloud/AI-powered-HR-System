// genAI-1.0.js
import fetch from 'node-fetch';

class AI {
  constructor({ apiKey }) {
    if (!apiKey) throw new Error('API key is required');
    this.apiKey = apiKey;
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async ask({ role='user',question, answer_format }) {
    const prompt = JSON.stringify({ question, answer_format });
    
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role, content: prompt }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
}

export default AI;
