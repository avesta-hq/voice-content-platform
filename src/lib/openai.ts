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

export async function generateTwitterThread(originalText: string, inputLanguage: string, outputLanguage: string, fallbackSource?: string): Promise<string[]> {
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

// -------------------- Outline Generation --------------------
import type { GeneratedOutline } from '@/types';

export async function generateOutlineFromTranscript(params: {
  originalText: string;
  inputLanguage: string;
  outputLanguage: string;
  platform: 'blog' | 'linkedin' | 'twitter' | 'podcast' | 'twitter_thread';
  maxItems?: number;
}): Promise<GeneratedOutline> {
  const { originalText, inputLanguage, outputLanguage, platform } = params;
  const maxItemsEnv = Number(process.env.OPENAI_OUTLINE_MAX_ITEMS || '0');
  const defaultMax = maxItemsEnv > 0 ? maxItemsEnv : 12;
  const maxItems = typeof params.maxItems === 'number' && params.maxItems > 0 ? params.maxItems : defaultMax;

  const inputLangName = getLanguageName(inputLanguage);
  const outputLangName = getLanguageName(outputLanguage);

  const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4';
  const isGpt5Model = modelName.toLowerCase().includes('gpt-5');

  const platformHint = (() => {
    switch (platform) {
      case 'blog':
        return 'Produce up to {maxItems} sections for a blog: each item with a clear section title and a concise description/bullets.';
      case 'linkedin':
        return 'Produce up to {maxItems} key points for a LinkedIn post: include a hook, main points, and a CTA as items.';
      case 'twitter':
      case 'twitter_thread':
        return 'Produce up to {maxItems} tweet plans for a Twitter thread: each item includes a short title and a 1-2 sentence plan.';
      case 'podcast':
        return 'Produce up to {maxItems} podcast segments: each item has a segment title, a brief description, and optional talking points.';
    }
  })().replace('{maxItems}', String(maxItems));

  const outlineTemplate = process.env.OPENAI_OUTLINE_SYSTEM_INSTRUCTION || '';
  const templateHasVoicePlaceholder = outlineTemplate.includes('<insert transcribed voice notes here>') || outlineTemplate.includes('{voice_input}');
  const systemPrompt = (
    templateHasVoicePlaceholder
      ? [
          'You are an outline planner. Always preserve ALL user ideas.',
          'NEVER drop content. If there are too many items, COMBINE less important points into the closest relevant item.',
          `Write the outline in ${outputLangName}.`
        ].join(' ')
      : (outlineTemplate || [
          'You are an outline planner. Always preserve ALL user ideas.',
          'NEVER drop content. If there are too many items, COMBINE less important points into the closest relevant item.',
          `Write the outline in ${outputLangName}.`
        ].join(' '))
  );

  const userPrompt = (() => {
    if (templateHasVoicePlaceholder) {
      const filled = outlineTemplate
        .replace('<insert transcribed voice notes here>', originalText)
        .replace('{voice_input}', originalText)
        .replace('{inputLang}', inputLangName)
        .replace('{outputLang}', outputLangName);
      return [
        filled,
        platformHint,
        'Return ONLY valid JSON using this schema: {"items":[{"id":"string","title":"string","description":"string","bullets":["string"],"estimatedDurationSec":number}]}',
        'Do NOT fabricate to reach the max. Use fewer than the cap if the input is short. Only create as many items as are genuinely supported by the transcript.',
        'Keep titles short and descriptive. Put all remaining content inside description/bullets so that no idea is lost.'
      ].join('\n\n');
    }
    return [
      `Input language: ${inputLangName}. Output language: ${outputLangName}.`,
      platformHint,
      'Return ONLY valid JSON using this schema: {"items":[{"id":"string","title":"string","description":"string","bullets":["string"],"estimatedDurationSec":number}]}',
      'Do NOT fabricate to reach the max. Use fewer than the cap if the input is short. Only create as many items as are genuinely supported by the transcript.',
      'Keep titles short and descriptive. Put all remaining content inside description/bullets so that no idea is lost.',
      'Transcript follows:\n\n' + originalText
    ].join('\n\n');
  })();

  const payload: {
    model: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    response_format?: { type: 'json_object' };
    max_tokens?: number;
  } = {
    model: modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3
  };
  if (!isGpt5Model) {
    payload.max_tokens = 4000;
  }
  // Set JSON mode if available on this SDK version
  (payload as unknown as { response_format?: { type: 'json_object' } }).response_format = { type: 'json_object' };

  const completion = await openai.chat.completions.create(payload as {
    model: string;
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    response_format?: { type: 'json_object' };
    max_tokens?: number;
  });
  const text = completion.choices[0]?.message?.content || '{}';
  let parsed: { items?: unknown };
  try {
    parsed = JSON.parse(text) as { items?: unknown };
  } catch {
    const match = text.match(/\{[\s\S]*\}$/);
    parsed = match ? (JSON.parse(match[0]) as { items?: unknown }) : { items: [] };
  }

  const items = Array.isArray(parsed.items) ? (parsed.items as unknown[]) : [];
  const outlineId = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID ?
    (globalThis as { crypto?: { randomUUID?: () => string } }).crypto!.randomUUID!() :
    `out_${Date.now()}`;
  const normalized = items.map((unknownItem, idx: number) => {
    const obj = (unknownItem ?? {}) as Record<string, unknown>;
    const bulletsVal = obj.bullets as unknown;
    const est = obj.estimatedDurationSec as unknown;
    return ({
    id: typeof obj.id === 'string' && obj.id ? (obj.id as string) : `item_${idx + 1}`,
    title: typeof obj.title === 'string' ? obj.title : `Item ${idx + 1}`,
    description: typeof obj.description === 'string' ? obj.description : '',
    bullets: Array.isArray(bulletsVal) ? (bulletsVal as unknown[]).map((b) => String(b)) : undefined,
    estimatedDurationSec: typeof est === 'number' ? est : undefined,
  });
  });

  return { outlineId, items: normalized, displayText: undefined };
}

export interface RefineContentRequest extends ContentGenerationRequest {
  comment: string;
  currentPlatformOutput?: string;
}

export async function generateRefinedContent(request: RefineContentRequest): Promise<string> {
  const { originalText, inputLanguage, outputLanguage, platform, comment, currentPlatformOutput } = request;

  const inputLangName = getLanguageName(inputLanguage);
  const outputLangName = getLanguageName(outputLanguage);

  // Base prompts (reuse) — when currentPlatformOutput is available, seed the assistant with that exact content
  const base = currentPlatformOutput && currentPlatformOutput.trim()
    ? currentPlatformOutput
    : await generateContent({ originalText, inputLanguage, outputLanguage, platform });

  // For simple replacements, try direct string replacement first
  if (currentPlatformOutput && isSimpleReplacement(comment)) {
    const directReplacement = attemptDirectReplacement(currentPlatformOutput, comment);
    if (directReplacement) {
      return directReplacement;
    }
  }

  // Determine if this is a language change request
  const isLanguageChange = isLanguageChangeRequest(comment.toLowerCase());
  
  // Debug logging
  console.log('Refinement Debug:', {
    comment,
    isLanguageChange,
    inputLanguage,
    outputLanguage,
    platform,
    currentOutputLength: currentPlatformOutput?.length || 0
  });
  
  // Build refinement instruction based on request type
  const refinementInstruction = isLanguageChange ? [
    `CURRENT CONTENT:\n${base}\n`,
    `USER INSTRUCTION: ${comment}\n`,
    'TRANSLATION RULES:',
    '1. Translate the ENTIRE content to the requested language',
    '2. Maintain the EXACT same meaning, structure, and formatting',
    '3. Keep all emojis, numbers, and special characters unchanged',
    '4. For Twitter threads, maintain the same number of tweets and similar length per tweet',
    '5. Preserve the tone and style of the original content',
    '6. Output the COMPLETE translated content',
    `7. The content should be in ${outputLangName} but translate to the language mentioned in the user instruction if different`
  ].join('\n') : [
    `CURRENT CONTENT:\n${base}\n`,
    `USER INSTRUCTION: ${comment}\n`,
    'CRITICAL RULES:',
    '1. Keep ALL existing content EXACTLY as written',
    '2. Apply ALL changes mentioned in the user instruction (there may be multiple changes separated by commas, semicolons, or "and")',
    '3. Only make the SPECIFIC changes requested - do NOT rephrase, rewrite, or modify any other words, sentences, or structure',
    '4. Do NOT change formatting, emojis, numbers, or style unless specifically requested',
    '5. Process each change instruction separately and apply them all to the content',
    '6. Output the COMPLETE content with ALL requested changes applied',
    '7. If you cannot make any specific change requested, skip that change but apply the others'
  ].join('\n');

  try {
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4';
    const isGpt5Model = modelName.toLowerCase().includes('gpt-5');
    const systemPrompt = isLanguageChange 
      ? 'You are an expert translator. Translate content accurately while preserving structure, formatting, and meaning. Maintain the same style and tone.'
      : 'You are a precise text editor. Make ONLY the specific change requested. Keep everything else identical. Do not rewrite or rephrase anything.';
    
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
          content: systemPrompt
        },
        { role: 'user', content: refinementInstruction }
      ],
      temperature: isLanguageChange ? 0.3 : 0.1 // Higher temperature for translations, lower for edits
    };
    if (!isGpt5Model) {
      basePayload.max_tokens = 4000;
    }
    const completion = await openai.chat.completions.create(basePayload);

    return completion.choices[0]?.message?.content?.trim() || base;
  } catch (error) {
    console.error('OpenAI API refine error:', error);
    return base;
  }
}

// Helper function to detect simple replacement requests
function isSimpleReplacement(comment: string): boolean {
  const lowerComment = comment.toLowerCase();
  
  // Skip simple replacement for language change requests
  if (isLanguageChangeRequest(lowerComment)) {
    return false;
  }
  
  // Split by common separators to check each instruction
  const instructions = comment.split(/[;,]|and\s+/).map(s => s.trim()).filter(Boolean);
  
  // Check if ALL instructions are simple replacements
  return instructions.every(instruction => {
    const lowerInstruction = instruction.toLowerCase();
    return (
      lowerInstruction.includes('replace') && lowerInstruction.includes('with') ||
      lowerInstruction.includes('change') && lowerInstruction.includes('to') ||
      /\d+.*to.*\d+/.test(lowerInstruction) // Pattern like "280 to 300" or "280M to 300M"
    );
  });
}

// Helper function to detect language change requests
function isLanguageChangeRequest(lowerComment: string): boolean {
  const languageNames = [
    'tamil', 'telugu', 'hindi', 'gujarati', 'english', 'spanish', 'french', 
    'german', 'italian', 'portuguese', 'russian', 'japanese', 'korean', 'chinese'
  ];
  
  // Debug what we're checking
  console.log('Language detection check:', { lowerComment, languageNames });
  
  const isLanguageRequest = (
    lowerComment.includes('translate') ||
    lowerComment.includes('convert') && lowerComment.includes('language') ||
    lowerComment.includes('change') && lowerComment.includes('language') ||
    lowerComment.includes('change language') ||
    languageNames.some(lang => {
      const patterns = [
        `to ${lang}`, 
        `in ${lang}`,
        `change to ${lang}`,
        `translate to ${lang}`,
        `convert to ${lang}`,
        `make it ${lang}`,
        `${lang} language`
      ];
      return patterns.some(pattern => lowerComment.includes(pattern));
    })
  );
  
  console.log('Language detection result:', isLanguageRequest);
  return isLanguageRequest;
}

// Helper function to attempt direct string replacement
function attemptDirectReplacement(content: string, comment: string): string | null {
  try {
    let result = content;
    let hasChanges = false;
    
    // Split comment by common separators to handle multiple instructions
    const instructions = comment.split(/[;,]|and\s+/).map(s => s.trim()).filter(Boolean);
    
    for (const instruction of instructions) {
      const lowerInstruction = instruction.toLowerCase();
      
      // Pattern: "replace X with Y"
      const replaceMatch = lowerInstruction.match(/replace\s+(.+?)\s+with\s+(.+?)(?:\s|$)/);
      if (replaceMatch) {
        const [, oldValue, newValue] = replaceMatch;
        const regex = new RegExp(escapeRegex(oldValue.trim()), 'gi');
        if (regex.test(result)) {
          result = result.replace(regex, newValue.trim());
          hasChanges = true;
        }
        continue;
      }

      // Pattern: "change X to Y"
      const changeMatch = lowerInstruction.match(/change\s+(.+?)\s+to\s+(.+?)(?:\s|$)/);
      if (changeMatch) {
        const [, oldValue, newValue] = changeMatch;
        const regex = new RegExp(escapeRegex(oldValue.trim()), 'gi');
        if (regex.test(result)) {
          result = result.replace(regex, newValue.trim());
          hasChanges = true;
        }
        continue;
      }

      // Pattern: "280M to 300M" or similar number changes
      const numberMatch = lowerInstruction.match(/(\d+[a-z]*)\s+to\s+(\d+[a-z]*)/);
      if (numberMatch) {
        const [, oldNum, newNum] = numberMatch;
        const regex = new RegExp(escapeRegex(oldNum), 'gi');
        if (regex.test(result)) {
          result = result.replace(regex, newNum);
          hasChanges = true;
        }
        continue;
      }
    }

    return hasChanges ? result : null;
  } catch (error) {
    return null;
  }
}

// Helper to escape special regex characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to get language names
function getLanguageName(languageCode: string): string {
  const languageMap: { [key: string]: string } = {
    'gu': 'Gujarati',
    'hi': 'Hindi',
    'en': 'English',
    'te': 'Telugu',
    'ta': 'Tamil',
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
