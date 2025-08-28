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
  
  switch (platform) {
    case 'blog':
      prompt = `Convert the following ${inputLangName} text into a well-structured blog post in ${outputLangName}. Maintain the original meaning and context exactly. Format it with proper paragraphs, headings, and structure. Original text: "${originalText}"`;
      maxTokens = 2000;
      break;
    case 'linkedin':
      prompt = `Convert the following ${inputLangName} text into a professional LinkedIn post in ${outputLangName}. Keep it engaging and business-focused while preserving the original meaning exactly. Original text: "${originalText}"`;
      maxTokens = 1000;
      break;
    case 'twitter':
      prompt = `Convert the following ${inputLangName} text into a Twitter post in ${outputLangName} (280 characters max). Make it engaging while preserving the original meaning exactly. Original text: "${originalText}"`;
      maxTokens = 500;
      break;
    case 'podcast':
      prompt = `Convert the following ${inputLangName} text into a podcast script in ${outputLangName}. Maintain natural speech flow while preserving the original meaning exactly. Add appropriate pauses and emphasis markers. Original text: "${originalText}"`;
      maxTokens = 1500;
      break;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a content transformation expert. Your job is to convert text from ${inputLangName} into ${outputLangName} while preserving the EXACT original meaning, context, and intent. Do not add new information, opinions, or interpretations. Only reformat and restructure the existing content. If the input and output languages are different, provide an accurate translation that maintains the original message.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    });

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
