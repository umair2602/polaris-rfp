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
console.log("Received edit-text request:", { text, prompt, selectedText });
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
console.log("Text to process:", textToProcess);
console.log("Editing prompt:", prompt);
    // Create a comprehensive prompt for the AI with more aggressive editing instructions
    const systemPrompt = `You are an expert proposal writer and editor. Your PRIMARY GOAL is to FOLLOW THE USER'S INSTRUCTION EXACTLY and make changes that directly address their specific request.

CRITICAL INSTRUCTIONS:
- READ THE USER'S PROMPT CAREFULLY and understand what they want
- FOCUS ENTIRELY on applying the user's specific instruction
- If they ask to "make professional" - enhance professionalism
- If they ask to "add details" - expand with specific information
- If they ask to "make technical" - add technical terminology and depth
- If they ask to "shorten" - condense while keeping key points
- If they ask to "improve" - make substantial quality enhancements
- ALWAYS make VISIBLE, SIGNIFICANT changes that match the user's intent
- Preserve markdown formatting (**, *, bullet points, tables with |, etc.)
- Return ONLY the edited text with NO explanations or meta-commentary

IMPORTANT: The user's instruction is the HIGHEST PRIORITY. Whatever they ask for, deliver it with clear, substantial changes. Don't be subtle - make bold transformations that match their request.`;

    const userPrompt = `USER'S SPECIFIC INSTRUCTION: "${prompt}"

Original text:
${textToProcess}

Apply the above instruction and make clear, substantial changes that directly address what the user asked for. Be bold and make the changes obvious.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
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
    console.log("Received generate-content request:",{prompt, context, contentType} );
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    // Create context-aware system prompt with enhanced instructions
    let systemPrompt = `You are an expert proposal writer and business content specialist. Your PRIMARY GOAL is to generate content that EXACTLY matches what the user is asking for.

CRITICAL GUIDELINES:
- UNDERSTAND THE USER'S REQUEST thoroughly before generating content
- DELIVER EXACTLY what they asked for - no more, no less (unless they ask for comprehensive content)
- If they ask for "a paragraph" - provide a well-written paragraph
- If they ask for "bullet points" - provide formatted bullet points
- If they ask for "detailed explanation" - provide 300-600 words with specific details
- If they ask for "brief overview" - provide concise, focused content (100-200 words)
- Use professional, appropriate language for business/technical documents
- Include SPECIFIC details, examples, and concrete information when relevant
- Use markdown formatting effectively (**, *, bullet points, numbered lists, tables)
- Match the tone and style to the content type and user's request
- Be thorough when asked, concise when requested

Content Type: ${contentType}

IMPORTANT: The user's request is your top priority. Deliver exactly what they're asking for with high quality and relevant detail.`;

    if (context) {
      systemPrompt += `\n\nADDITIONAL CONTEXT TO INCORPORATE:\n${context}`;
    }

    const userPrompt = `USER'S REQUEST: ${prompt}

Generate content that directly addresses the above request. Match the scope, detail level, and format to what the user is asking for.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.6,
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
