import AI from './genAI-1.0.mjs'

let ai = new AI({ apiKey: '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' })
ai.ask({ question: "Explain quantum computing in simple terms", answer_format: "text" })
  .then(response => {
    console.log("AI Response:", response)
  })