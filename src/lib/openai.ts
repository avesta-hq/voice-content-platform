import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentGenerationRequest {
  originalText: string;
  inputLanguage: string;
  outputLanguage: string;
  platform: 'blog' | 'linkedin' | 'twitter' | 'podcast';
}

export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const { originalText, inputLanguage, outputLanguage, platform } = request;
  
  let prompt = '';
  let maxTokens = 1000;
  
  const inputLangName = getLanguageName(inputLanguage);
  const outputLangName = getLanguageName(outputLanguage);
  
  // Read prompts from environment variables
  const blogPrompt = process.env.OPENAI_BLOG_PROMPT || 'Convert the following {inputLang} text into a well-structured blog post in {outputLang}. Maintain the original meaning and context exactly. Format it with proper paragraphs, headings, and structure. Original text: "{originalText}"';
  const linkedinPrompt = process.env.OPENAI_LINKEDIN_PROMPT || 'Convert the following {inputLang} text into a professional LinkedIn post in {outputLang}. Keep it engaging and business-focused while preserving the original meaning exactly. Original text: "{originalText}"';
  const twitterPrompt = process.env.OPENAI_TWITTER_PROMPT || 'Convert the following {inputLang} text into a Twitter post in {outputLang} (280 characters max). Make it engaging while preserving the original meaning exactly. Original text: "{originalText}"';
  const podcastPrompt = process.env.OPENAI_PODCAST_PROMPT || 'Convert the following {inputLang} text into a podcast script in {outputLang}. Maintain natural speech flow while preserving the original meaning exactly. Add appropriate pauses and emphasis markers. Original text: "{originalText}"';
  
  switch (platform) {
    case 'blog':
      prompt = blogPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      maxTokens = 2000;
      break;
    case 'linkedin':
      prompt = linkedinPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      maxTokens = 1000;
      break;
    case 'twitter':
      prompt = twitterPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      maxTokens = 500;
      break;
    case 'podcast':
      prompt = podcastPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      maxTokens = 1500;
      break;
  }

  try {
    const modelName = process.env.OPENAI_MODEL_NAME || "gpt-4";
    const isGpt5Model = modelName.toLowerCase().includes('gpt-5');

    const basePayload: {
      model: string;
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      max_tokens?: number;
      temperature?: number;
    } = {
      model: modelName,
      messages: [
        {
          role: "system",
          content: (process.env.OPENAI_SYSTEM_INSTRUCTION || 'You are a content transformation expert. Your job is to convert text from {inputLang} into {outputLang} while preserving the EXACT original meaning, context, and intent. Do not add new information, opinions, or interpretations. Only reformat and restructure the existing content. If the input and output languages are different, provide an accurate translation that maintains the original message.')
            .replace('{inputLang}', inputLangName)
            .replace('{outputLang}', outputLangName)
        },
        {
          role: "user",
          content: prompt
        }
      ]
    };
    if (!isGpt5Model) {
      basePayload.max_tokens = maxTokens;
      basePayload.temperature = 0.3;
    }

    const completion = await openai.chat.completions.create(basePayload);

    return completion.choices[0]?.message?.content || 'Error generating content';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate content');
  }
}

export async function generateAllContent(originalText: string, inputLanguage: string, outputLanguage: string): Promise<{
  blogPost: string;
  linkedinPost: string;
  twitterPost: string;
  podcastScript: string;
}> {
  const [blogPost, linkedinPost, twitterPost, podcastScript] = await Promise.all([
    generateContent({ originalText, inputLanguage, outputLanguage, platform: 'blog' }),
    generateContent({ originalText, inputLanguage, outputLanguage, platform: 'linkedin' }),
    generateContent({ originalText, inputLanguage, outputLanguage, platform: 'twitter' }),
    generateContent({ originalText, inputLanguage, outputLanguage, platform: 'podcast' })
  ]);

  return {
    blogPost,
    linkedinPost,
    twitterPost,
    podcastScript
  };
}

export interface RefineContentRequest extends ContentGenerationRequest {
  comment: string;
  currentPlatformOutput?: string;
}

export async function generateRefinedContent(request: RefineContentRequest): Promise<string> {
  const { originalText, inputLanguage, outputLanguage, platform, comment, currentPlatformOutput } = request;

  const inputLangName = getLanguageName(inputLanguage);
  const outputLangName = getLanguageName(outputLanguage);

  // Base prompts (reuse)
  const base = await generateContent({ originalText, inputLanguage, outputLanguage, platform });

  // Build refinement guidance; include current output when available to steer edits
  const refinementInstruction = [
    `User instruction: ${comment}`,
    'Apply the instruction exactly while preserving the original meaning and facts.',
    'Do not introduce new information. Respect the platform conventions.',
    currentPlatformOutput ? `Here is the current platform output to refine:\n\n${currentPlatformOutput}` : undefined
  ].filter(Boolean).join('\n\n');

  try {
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4';
    const isGpt5Model = modelName.toLowerCase().includes('gpt-5');
    const basePayload: {
      model: string;
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      max_tokens?: number;
      temperature?: number;
    } = {
      model: modelName,
      messages: [
        {
          role: 'system',
          content: (process.env.OPENAI_SYSTEM_INSTRUCTION || 'You are a content transformation expert. Maintain exact meaning. Do not hallucinate.')
            .replace('{inputLang}', inputLangName)
            .replace('{outputLang}', outputLangName)
        },
        { role: 'user', content: `Original transcript in {${inputLangName}} (to be expressed in {${outputLangName}}):\n\n${originalText}` },
        { role: 'assistant', content: base },
        { role: 'user', content: refinementInstruction }
      ]
    };
    if (!isGpt5Model) {
      basePayload.max_tokens = 1000;
      basePayload.temperature = 0.2;
    }
    const completion = await openai.chat.completions.create(basePayload);

    return completion.choices[0]?.message?.content || 'Error refining content';
  } catch (error) {
    console.error('OpenAI API refine error:', error);
    throw new Error('Failed to refine content');
  }
}

// Helper function to get language names
function getLanguageName(languageCode: string): string {
  const languageMap: { [key: string]: string } = {
    'gu': 'Gujarati',
    'hi': 'Hindi',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese'
  };
  return languageMap[languageCode] || languageCode;
}
