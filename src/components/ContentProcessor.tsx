'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlatformContent, LanguageSettings } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Loader2,
  Brain,
  FileText,
  MessageSquare,
  Twitter,
  Linkedin,
  Rss
} from 'lucide-react';

interface ContentProcessorProps {
  originalText: string;
  languageSettings: LanguageSettings;
  onProcessingComplete: (content: PlatformContent[]) => void;
}

export default function ContentProcessor({ originalText, languageSettings, onProcessingComplete }: ContentProcessorProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Remove auto-processing - only process when explicitly called
  const processContent = useCallback(async () => {
    if (!originalText.trim()) return;
    
    setProgress(0);
    setCurrentStep('Initializing AI processing...');

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Update steps
      setTimeout(() => setCurrentStep('Analyzing your content...'), 500);
      setTimeout(() => setCurrentStep('Generating platform-specific content...'), 1500);
      setTimeout(() => setCurrentStep('Optimizing for each platform...'), 2500);
      setTimeout(() => setCurrentStep('Finalizing content...'), 3500);

      // Make API call
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          inputLanguage: languageSettings.inputLanguage,
          outputLanguage: languageSettings.outputLanguage,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('Content generation complete!');

      if (response.ok) {
        const content = await response.json();
        // Transform the API response to match our expected format
        const transformedContent = [
          { platform: 'LinkedIn', content: content.linkedinPost, formatted: true },
          { platform: 'Twitter', content: content.twitterPost, formatted: true },
          { platform: 'Twitter with Thread', content: content.twitterThread && Array.isArray(content.twitterThread) ? content.twitterThread.join('\n\n') : content.twitterPost, formatted: true },
          { platform: 'Podcast Script', content: content.podcastScript, formatted: true },
          { platform: 'Blog Post', content: content.blogPost, formatted: true }
        ];
        setTimeout(() => {
          onProcessingComplete(transformedContent);
        }, 500);
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to demo content
      const demoContent = generateDemoContent(originalText);
      setTimeout(() => {
        onProcessingComplete(demoContent);
      }, 500);
    }
  }, [originalText, languageSettings, onProcessingComplete]);

  // Remove useEffect that auto-triggers processing
  // useEffect(() => {
  //   if (originalText.trim()) {
  //     processContent();
  //   }
  // }, [originalText, processContent]);

  // Start processing immediately when component mounts
  useEffect(() => {
    if (originalText.trim()) {
      processContent();
    }
  }, []); // Empty dependency array - only run once on mount

  const generateDemoContent = (text: string): PlatformContent[] => {
    const truncatedText = text.length > 100 ? text.substring(0, 100) + '...' : text;
    
    return [
      {
        platform: 'LinkedIn',
        content: `LinkedIn Post:\n\n"${truncatedText}"\n\n💡 Key insights from today's thoughts:\n• Professional perspective\n• Industry relevance\n• Engaging discussion starter\n\nWhat are your thoughts on this? Share your experience below! 👇\n\n#ProfessionalDevelopment #IndustryInsights #Networking`,
        formatted: true
      },
      {
        platform: 'Twitter',
        content: `"${truncatedText}"\n\nThis is how your voice content transforms into engaging social media posts! ✨\n\n#ContentCreation #VoiceToText #SocialMedia`,
        formatted: true
      },
      {
        platform: 'Twitter with Thread',
        content: `Thread 🧵\n\n1/ "${truncatedText}"\n\n2/ This is how your voice content transforms into engaging Twitter threads\n\n3/ Each tweet optimized for maximum engagement and readability\n\n4/ Ready to share your insights with the world! 🚀\n\n#TwitterThread #ContentCreation #VoiceToText`,
        formatted: true
      },
      {
        platform: 'Podcast Script',
        content: `🎙️ Podcast Script\n\nIntroduction:\n"Welcome to today's episode where we explore: ${truncatedText}"\n\nMain Content:\nYour voice content has been transformed into a structured podcast script with natural flow, engaging hooks, and clear transitions.\n\nConclusion:\n"Thanks for listening! Don't forget to subscribe and share this episode."`,
        formatted: true
      },
      {
        platform: 'Blog Post',
        content: `Here's a professional blog post based on your content: "${truncatedText}"\n\nThis is a demo blog post that showcases how your voice content would be transformed into a well-structured article. The AI would analyze your speech patterns, extract key themes, and create engaging content optimized for blog readers.`,
        formatted: true
      }
    ];
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadContent = (content: string, platform: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${platform}-content.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">
              AI Content Generation
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Transforming your voice into professional content for all platforms
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Processing Progress</span>
                <Badge variant="secondary" className="text-xs">
                  {progress}% Complete
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Current Step with Animation */}
            <div className="text-center space-y-4">
              <Badge 
                variant="default" 
                className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {currentStep}
              </Badge>

              {/* Platform Icons Animation */}
              <div className="flex justify-center items-center space-x-3">
                <div className="flex items-center space-x-2 opacity-60">
                  <div className="w-8 h-8 bg-[#0A66C2]/10 rounded-full flex items-center justify-center">
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  </div>
                  <span className="text-xs text-muted-foreground">LinkedIn</span>
                </div>
                
                <div className="flex items-center space-x-2 opacity-60">
                  <div className="w-8 h-8 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center">
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Twitter</span>
                </div>
                
                <div className="flex items-center space-x-2 opacity-60">
                  <div className="w-8 h-8 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#1DA1F2]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Thread</span>
                </div>
                
                <div className="flex items-center space-x-2 opacity-60">
                  <div className="w-8 h-8 bg-[#9146FF]/10 rounded-full flex items-center justify-center">
                    <Rss className="w-4 h-4 text-[#9146FF]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Podcast</span>
                </div>
                
                <div className="flex items-center space-x-2 opacity-60">
                  <div className="w-8 h-8 bg-[#FF6B35]/10 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <span className="text-xs text-muted-foreground">Blog</span>
                </div>
              </div>
            </div>

            {/* Processing Steps Visualization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">Content Analysis</div>
                  <div className="text-xs text-muted-foreground">Understanding your voice</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium">AI Processing</div>
                  <div className="text-xs text-muted-foreground">Platform optimization</div>
                </div>
              </div>
            </div>

            {/* Status Message */}
            {progress < 100 ? (
              <Alert className="border-primary/20 bg-primary/5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <AlertDescription className="text-primary">
                  Please wait while AI processes your content. This may take a few moments...
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 font-medium">
                  Content generation completed successfully! Redirecting to results...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
