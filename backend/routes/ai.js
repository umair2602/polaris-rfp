const express = require("express");
const OpenAI = require("openai");
const router = express.Router();

// Initialize OpenAI
// Requires OPENAI_API_KEY environment variable to be set
// Example: OPENAI_API_KEY=sk-your-api-key-here
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// AI text editing endpoint
router.post("/edit-text", async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: "OpenAI API key not configured",
      });
    }

    const { text, prompt, selectedText } = req.body;

    if (!text && !selectedText) {
      return res.status(400).json({
        error: "Either text or selectedText must be provided",
      });
    }

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // Determine what text to process
    const textToProcess = selectedText || text;

    // Create a comprehensive prompt for the AI
    const systemPrompt = `You are a professional text editor assistant. Your task is to edit the provided text according to the user's instructions. 

Guidelines:
- Maintain the original meaning and context
- Preserve any markdown formatting (**, *, bullet points, etc.)
- Keep the tone professional and appropriate for business documents
- If the text appears to be part of a larger document, maintain consistency
- Only make the requested changes, don't add unnecessary content
- Return only the edited text, no explanations or meta-commentary

User's request: ${prompt}

Text to edit:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: textToProcess },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const editedText = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      editedText,
      originalText: textToProcess,
      prompt,
    });
  } catch (error) {
    console.error("AI text editing error:", error);
    res.status(500).json({
      error: "Failed to process text with AI",
      details: error.message,
    });
  }
});

// AI content generation endpoint
router.post("/generate-content", async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error: "OpenAI API key not configured",
      });
    }

    const { prompt, context, contentType = "general" } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // Create context-aware system prompt
    let systemPrompt = `You are a professional content writer specializing in business proposals and technical documents. Generate high-quality content based on the user's request.

Guidelines:
- Use professional, clear, and engaging language
- Structure content with appropriate headings and formatting
- Include relevant details and examples when appropriate
- Maintain consistency with business document standards
- Use markdown formatting for structure (**, *, bullet points, etc.)
- Keep content focused and relevant to the request

Content type: ${contentType}`;

    if (context) {
      systemPrompt += `\n\nContext: ${context}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.4,
    });

    const generatedContent = completion.choices[0].message.content.trim();

    res.json({
      success: true,
      content: generatedContent,
      prompt,
      contentType,
    });
  } catch (error) {
    console.error("AI content generation error:", error);
    res.status(500).json({
      error: "Failed to generate content with AI",
      details: error.message,
    });
  }
});

module.exports = router;
