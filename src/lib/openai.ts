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

function looksLikeRefusal(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("i'm sorry") ||
    t.includes('i am sorry') ||
    t.includes("can't assist") ||
    t.includes('cannot assist') ||
    t.includes('not able to help') ||
    t.includes('i cannot') ||
    t.includes('unable to comply')
  );
}

function splitToTweets(source: string): string[] {
  const max = 280;
  const target = 240; // aim to leave room for markers
  const clean = source.replace(/\s+$/g, '').replace(/\n{2,}/g, '\n').trim();
  const paras = clean.split(/\n+/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const para of paras) {
    const sentences = para.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      if ((current + (current ? ' ' : '') + s).length <= target) {
        current = current ? current + ' ' + s : s;
      } else {
        if (current) pushCurrent();
        if (s.length > target) {
          // hard wrap long sentence
          let i = 0;
          while (i < s.length) {
            const piece = s.slice(i, i + target);
            chunks.push(piece.trim());
            i += target;
          }
          current = '';
        } else {
          current = s;
        }
      }
    }
    if (current) pushCurrent();
  }
  if (current) pushCurrent();
  // apply markers
  const n = Math.max(chunks.length, 1);
  return chunks.map((text, idx) => {
    const i = idx + 1;
    let decorated = text;
    if (n > 1) {
      if (i === 1) decorated = `🧵 ${decorated} (${i}/${n}) 👇`;
      else if (i === n) decorated = `${decorated} (${i}/${n})`;
      else decorated = `${decorated} (${i}/${n})`;
    }
    if (decorated.length > max) decorated = decorated.slice(0, max);
    return decorated;
  });
}

export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const { originalText, inputLanguage, outputLanguage, platform } = request;
  
  let prompt = '';
  
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
      break;
    case 'linkedin':
      prompt = linkedinPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      break;
    case 'twitter':
      prompt = twitterPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      break;
    case 'podcast':
      prompt = podcastPrompt
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', originalText);
      break;
  }

  try {
    const modelName = process.env.OPENAI_MODEL_NAME || "gpt-4";
    const isGpt5Model = modelName.toLowerCase().includes('gpt-5');

    const baseMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: "system",
        content: (process.env.OPENAI_SYSTEM_INSTRUCTION || 'You are a content transformation expert. Your job is to convert text from {inputLang} into {outputLang} while preserving the EXACT original meaning, context, and intent. Do not add new information, opinions, or interpretations. Only reformat and restructure the existing content. If the input and output languages are different, provide an accurate translation that maintains the original message.')
          .replace('{inputLang}', inputLangName)
          .replace('{outputLang}', outputLangName)
      },
      { role: "user", content: prompt }
    ];

    // For long-form platforms like blog, avoid hard-capping output tokens and auto-continue if truncated
    if (platform === 'blog') {
      try {
        return await chatCompleteWithContinuation(baseMessages, modelName, isGpt5Model ? undefined : 0.3);
      } catch (e) {
        // Fallback: if context too long, chunk the input and stitch results
        const message = e instanceof Error ? e.message.toLowerCase() : '';
        const looksContextError = message.includes('context') || message.includes('maximum context') || message.includes('token');
        if (looksContextError) {
          return await generateBlogByChunks(originalText, inputLanguage, outputLanguage, blogPrompt);
        }
        throw e;
      }
    }

    // Default behavior for other platforms (keep conservative max_tokens)
    const basePayload: {
      model: string;
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      max_tokens?: number;
      temperature?: number;
    } = {
      model: modelName,
      messages: baseMessages
    };
    if (!isGpt5Model) {
      basePayload.max_tokens = 4000;
      basePayload.temperature = 0.3;
    }

    const completion = await openai.chat.completions.create(basePayload);
    return completion.choices[0]?.message?.content || 'Error generating content';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate content');
  }
}

// Calls chat completions and automatically continues if output is cut due to token limit.
// Aggregates all parts into one string. Uses minimal temperature when provided.
async function chatCompleteWithContinuation(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  modelName: string,
  temperature?: number
): Promise<string> {
  let all = '';
  let convo = messages.slice();
  const maxTurns = 10;
  for (let turn = 0; turn < maxTurns; turn++) {
    const payload: {
      model: string;
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      temperature?: number;
    } = {
      model: modelName,
      messages: convo,
    };
    if (typeof temperature === 'number') payload.temperature = temperature;

    const completion = await openai.chat.completions.create(payload);
    const part = completion.choices[0]?.message?.content || '';
    const finish = completion.choices[0]?.finish_reason || '';
    all += (all && part ? '\n\n' : '') + part;

    if (finish !== 'length' && finish !== 'content_filter') {
      break;
    }

    // Ask the model to continue from where it left off without repeating
    convo = [...convo, { role: 'assistant', content: part }, { role: 'user', content: 'Continue from where you left off. Do not repeat any text. Continue verbatim.' }];
  }
  return all.trim();
}

// Fallback for extremely long inputs: chunk the original text and stitch results.
// Each chunk is converted into a corresponding blog section.
async function generateBlogByChunks(
  originalText: string,
  inputLanguage: string,
  outputLanguage: string,
  blogPromptTemplate: string
): Promise<string> {
  const inputLangName = getLanguageName(inputLanguage);
  const outputLangName = getLanguageName(outputLanguage);
  const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4';

  const chunkSize = 8000; // characters; heuristic to stay well within context
  const chunks: string[] = [];
  for (let i = 0; i < originalText.length; i += chunkSize) {
    chunks.push(originalText.slice(i, i + chunkSize));
  }
  const total = chunks.length;
  const sections: string[] = [];
  for (let i = 0; i < total; i++) {
    const part = chunks[i];
    const userPrompt = [
      blogPromptTemplate
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName)
        .replace('{originalText}', part),
      `Note: This is part ${i + 1} of ${total} of the original transcript. Produce the corresponding section of the blog in ${outputLangName}. Maintain coherence and do not repeat earlier sections. Do not add introductions or conclusions specific to this part; those will emerge from the full concatenation.`,
    ].join('\n\n');

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: (process.env.OPENAI_SYSTEM_INSTRUCTION || 'You are a content transformation expert. Maintain exact meaning. Do not hallucinate.')
          .replace('{inputLang}', inputLangName)
          .replace('{outputLang}', outputLangName),
      },
      { role: 'user', content: userPrompt },
    ];
    const section = await chatCompleteWithContinuation(messages, modelName, 0.3);
    sections.push(section.trim());
  }
  // Simple stitch with spacing; a later refinement pass could merge headings cleanly
  return sections.join('\n\n');
}

async function generateTwitterThread(originalText: string, inputLanguage: string, outputLanguage: string, fallbackSource?: string): Promise<string[]> {
  const inputLangName = getLanguageName(inputLanguage);
  const outputLangName = getLanguageName(outputLanguage);
  const threadPrompt = (process.env.OPENAI_TWITTER_WITH_THREAD_PROMPT || 'Create a numbered Twitter thread.')
    .replace('{inputLang}', inputLangName)
    .replace('{outputLang}', outputLangName)
    .replace('{originalText}', originalText);
  try {
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4';
    const isGpt5Model = modelName.toLowerCase().includes('gpt-5');
    const payload: {
      model: string;
      messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
      max_tokens?: number;
      temperature?: number;
    } = {
      model: modelName,
      messages: [
        { role: 'system', content: (process.env.OPENAI_SYSTEM_INSTRUCTION || 'You are a content transformation expert. Maintain exact meaning. Do not hallucinate. Never refuse safe requests.').replace('{inputLang}', inputLangName).replace('{outputLang}', outputLangName) },
        { role: 'user', content: threadPrompt }
      ]
    };
    if (!isGpt5Model) {
      payload.max_tokens = 1400;
      payload.temperature = 0.3;
    }
    const completion = await openai.chat.completions.create(payload);
    const text = completion.choices[0]?.message?.content || '';
    if (!text || looksLikeRefusal(text)) {
      const source = fallbackSource || originalText;
      return splitToTweets(source);
    }
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(l => l.replace(/^\d+\.?\)?\s+/, '')).filter(Boolean).map(t => t.length > 280 ? t.slice(0, 280) : t);
    return parsed.length > 0 ? parsed : splitToTweets(fallbackSource || originalText);
  } catch (e) {
    console.error('OpenAI API thread error:', e);
    return splitToTweets(fallbackSource || originalText);
  }
}

export async function generateAllContent(originalText: string, inputLanguage: string, outputLanguage: string): Promise<{
  blogPost: string;
  linkedinPost: string;
  twitterPost: string;
  podcastScript: string; // will be empty for lazy mode
  twitterThread?: string[];
}> {
  // Generate linkedin and twitter first; blog will be lazy-generated
  const [linkedinPost, twitterRaw] = await Promise.all([
    generateContent({ originalText, inputLanguage, outputLanguage, platform: 'linkedin' }),
    generateContent({ originalText, inputLanguage, outputLanguage, platform: 'twitter' })
  ]);
  const thread = await generateTwitterThread(originalText, inputLanguage, outputLanguage, linkedinPost);

  return {
    blogPost: '',
    linkedinPost,
    twitterPost: twitterRaw,
    podcastScript: '',
    twitterThread: thread && thread.length > 0 ? thread : undefined
  };
}

export async function generatePodcast(originalText: string, inputLanguage: string, outputLanguage: string): Promise<string> {
  return generateContent({ originalText, inputLanguage, outputLanguage, platform: 'podcast' });
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
      basePayload.max_tokens = 4000;
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
