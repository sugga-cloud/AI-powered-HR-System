//code sample

import AI from './genAI-1.0.mjs'

let ai = new AI({ apiKey: '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' })
ai.ask({ question: "Explain quantum computing in simple terms", answer_format: "text" })
  .then(response => {
    console.log("AI Response:", response)
  })