"use client";

import React, { useEffect, useRef, useState } from "react";
import { SpeechRecognitionManager } from "@/lib/speechRecognition";
import { SUPPORTED_LANGUAGES, getLanguageByCode } from "@/lib/languages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { 
  MessageSquare, 
  Mic, 
  Square, 
  Copy, 
  CheckCircle2, 
  Linkedin, 
  Twitter, 
  Sparkles, 
  Volume2, 
  Languages, 
  Settings,
  Zap,
  AlertTriangle,
  Clock,
  RefreshCw
} from "lucide-react";

export default function SocialReplyStudioPage() {
  const [platform, setPlatform] = useState<'linkedin'|'twitter'>('linkedin');
  const [postText, setPostText] = useState<string>("");
  const [intent, setIntent] = useState<string>("");
  const [inputLang, setInputLang] = useState<string>('gu');
  const [outputLang, setOutputLang] = useState<string>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [results, setResults] = useState<{comments: {text:string;rationale?:string}[];reposts:{text:string;rationale?:string}[]} | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<{type:'comment'|'repost'; idx:number} | null>(null);

  const mgrRef = useRef<SpeechRecognitionManager | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cumulativeRef = useRef<string>('');

  useEffect(() => {
    mgrRef.current = new SpeechRecognitionManager();
    const lang = getLanguageByCode(inputLang);
    if (lang) mgrRef.current.setLanguage(lang.speechRecognitionCode);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (mgrRef.current) {
      const lang = getLanguageByCode(inputLang);
      if (lang) mgrRef.current.setLanguage(lang.speechRecognitionCode);
    }
  }, [inputLang]);

  const start = () => {
    if (!mgrRef.current) return;
    cumulativeRef.current = '';
    setIntent("");
    setDuration(0);
    setIsRecording(true);
    timerRef.current = setInterval(() => setDuration((s)=>s+1), 1000);
    mgrRef.current.startRecording(
      (t, isFinal) => {
        if (isFinal) {
          cumulativeRef.current += t;
          setIntent(cumulativeRef.current);
        } else {
          setIntent(cumulativeRef.current + t);
        }
      },
      (err) => { setError(err); setIsRecording(false); },
      () => { setIsRecording(false); }
    );
  };

  const stop = () => {
    mgrRef.current?.stopRecording();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const canGenerate = postText.trim().length > 0 && intent.trim().length > 0 && !loading;

  const generate = async () => {
    try {
      setLoading(true);
      setError("");
      setResults(null);
      const res = await fetch('/api/engage/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, postText, intentText: intent, languageOut: outputLang })
      });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const data = await res.json();
      setResults(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlatformIcon = (platformType: 'linkedin' | 'twitter') => {
    return platformType === 'linkedin' ? Linkedin : Twitter;
  };

  const getPlatformBranding = (platformType: 'linkedin' | 'twitter') => {
    return platformType === 'linkedin' 
      ? { primary: '#0077B5', secondary: '#004182', name: 'LinkedIn' }
      : { primary: '#1DA1F2', secondary: '#0d8bd9', name: 'Twitter' };
  };

  const copyToClipboard = async (text: string, type: 'comment' | 'repost', index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx({ type, idx: index });
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const branding = getPlatformBranding(platform);
  const PlatformIcon = getPlatformIcon(platform);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-background dark:via-muted/10 dark:to-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-amber-300/20 to-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-200/10 to-amber-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Enhanced Header */}
          <div className="text-center space-y-8 py-12">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-primary via-orange-500 to-amber-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-primary/25 transform hover:scale-105 transition-all duration-300">
                <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <MessageSquare className="w-14 h-14 text-white drop-shadow-lg" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-900 via-primary to-orange-600 bg-clip-text text-transparent dark:from-white dark:via-primary dark:to-orange-400">
                Social Reply Studio
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your thoughts into engaging social media responses with 
                <span className="text-primary font-semibold"> AI-powered voice technology</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                  <Mic className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Voice Input</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">AI Generated</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                  <Languages className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Multi-Language</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="max-w-4xl mx-auto backdrop-blur-sm bg-red-50/80 border-red-200/50 shadow-lg">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Enhanced Main Configuration */}
          <Card className="max-w-5xl mx-auto backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-2xl shadow-black/10">
            <CardHeader className="pb-6 bg-gradient-to-r from-primary/5 via-orange-50/50 to-amber-50/50 dark:from-primary/10 dark:via-orange-900/20 dark:to-amber-900/20 rounded-t-lg border-b border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Configuration</CardTitle>
                    <CardDescription className="text-base">
                      Set up your platform, languages, and input preferences
                    </CardDescription>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-primary">Ready</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Enhanced Platform and Language Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Platform Selection */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-3 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-orange-200/50 flex items-center justify-center">
                      <PlatformIcon className="h-4 w-4" style={{ color: branding.primary }} />
                    </div>
                    Target Platform
                  </Label>
                  <Select value={platform} onValueChange={(value: 'linkedin' | 'twitter') => setPlatform(value)}>
                    <SelectTrigger className="h-14 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
                      <SelectItem value="linkedin" className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-6 h-6 bg-[#0077B5] rounded-lg flex items-center justify-center">
                            <Linkedin className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">LinkedIn</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="twitter" className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-6 h-6 bg-[#1DA1F2] rounded-lg flex items-center justify-center">
                            <Twitter className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">Twitter</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Input Language */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-3 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/50 dark:to-emerald-900/50 flex items-center justify-center">
                      <Mic className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    Voice Input Language
                  </Label>
                  <Select value={inputLang} onValueChange={setInputLang}>
                    <SelectTrigger className="h-14 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl max-h-60 overflow-y-auto">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code} className="hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang.nativeName}</span>
                            <span className="text-xs text-muted-foreground">({lang.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Output Language */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-3 text-base font-semibold">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/50 dark:to-violet-900/50 flex items-center justify-center">
                      <Languages className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Output Language
                  </Label>
                  <Select value={outputLang} onValueChange={setOutputLang}>
                    <SelectTrigger className="h-14 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl max-h-60 overflow-y-auto">
                      {SUPPORTED_LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code} className="hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang.nativeName}</span>
                            <span className="text-xs text-muted-foreground">({lang.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Enhanced Original Post Input */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-3 text-lg font-semibold">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${branding.primary}20, ${branding.primary}40)` }}>
                      <PlatformIcon className="h-5 w-5" style={{ color: branding.primary }} />
                    </div>
                    Original {branding.name} Post
                    <Badge variant="destructive" className="text-xs animate-pulse">Required</Badge>
                  </Label>
                  {postText.trim().length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        {postText.trim().length} characters
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <Textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={`Paste the original ${branding.name} post content here...\n\nExample: "Just launched our new product! Excited to share this journey with everyone. What do you think about the future of AI in business?"`}
                    className="min-h-[140px] text-base bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 shadow-lg resize-none focus:shadow-xl transition-all duration-300"
                    rows={6}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {postText.trim().length === 0 ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                        Empty
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Ready
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Enhanced Voice Intent Recording */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-3 text-lg font-semibold">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-pink-200 dark:from-red-900/50 dark:to-pink-900/50 flex items-center justify-center shadow-lg">
                      <Volume2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    Your Response Intent
                    <Badge variant="destructive" className="text-xs animate-pulse">Required</Badge>
                  </Label>
                  <div className="flex items-center gap-3">
                    {isRecording && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        <span className="text-sm font-bold text-red-700 dark:text-red-400">
                          REC • {formatDuration(duration)}
                        </span>
                      </div>
                    )}
                    {!isRecording && duration > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                          {formatDuration(duration)} recorded
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Voice Input Display */}
                <div className="relative">
                  <Card className={`border-2 transition-all duration-300 ${
                    isRecording 
                      ? 'border-red-400 shadow-2xl shadow-red-500/25 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/20' 
                      : intent.trim().length > 0
                        ? 'border-green-400 shadow-lg shadow-green-500/25 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20'
                        : 'border-muted bg-white/50 dark:bg-gray-800/50'
                  } backdrop-blur-sm`}>
                    <CardContent className="p-6">
                      <div className="min-h-[120px] text-foreground whitespace-pre-wrap text-base leading-relaxed">
                        {intent || (
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              isRecording 
                                ? 'bg-red-500 animate-pulse' 
                                : 'bg-muted'
                            }`}>
                              <Mic className={`h-8 w-8 ${
                                isRecording ? 'text-white' : 'text-muted-foreground'
                              }`} />
                            </div>
                            <span className="text-muted-foreground italic text-lg">
                              {isRecording 
                                ? "🎤 Listening... Speak your response intent now." 
                                : "Click 'Start Recording' to add your voice intent for the response."
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    {/* Recording Animation Overlay */}
                    {isRecording && (
                      <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-pulse"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-red-500 animate-pulse"></div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Enhanced Recording Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {!isRecording ? (
                    <Button
                      onClick={start}
                      disabled={postText.trim().length === 0}
                      className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-xl shadow-red-500/25 transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stop}
                      className="w-full sm:w-auto px-8 py-4 text-lg font-semibold bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 shadow-xl shadow-gray-500/25 transform hover:scale-105 transition-all duration-200"
                      size="lg"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => {
                      setIntent('');
                      setDuration(0);
                    }}
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-4 text-base font-medium bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Enhanced Generate Button */}
              <div className="flex flex-col items-center space-y-6 pt-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Ready to Generate?</h3>
                  <p className="text-muted-foreground">AI will analyze your post and intent to create engaging responses</p>
                </div>
                
                <Button
                  onClick={generate}
                  disabled={!canGenerate}
                  className={`px-12 py-6 text-xl font-bold shadow-2xl transform transition-all duration-300 ${
                    canGenerate 
                      ? 'bg-gradient-to-r from-primary via-orange-500 to-amber-500 hover:from-primary/90 hover:via-orange-600 hover:to-amber-600 hover:scale-105 shadow-primary/25' 
                      : 'bg-muted cursor-not-allowed'
                  }`}
                  size="lg"
                >
                  <Sparkles className="h-6 w-6 mr-3" />
                  Generate AI Responses
                  <Zap className="h-6 w-6 ml-3" />
                </Button>
                
                {!canGenerate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Please complete both the original post and voice intent to continue
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Results Section */}
          {results && (
            <div className="space-y-8">
              {/* Results Header */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-green-500/25">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">AI Responses Generated!</h2>
                  <p className="text-lg text-muted-foreground">Choose from the suggestions below and customize as needed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-7xl mx-auto">
                {/* Enhanced Comments Section */}
                <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-2xl shadow-black/10 overflow-hidden">
                  <CardHeader className="pb-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${branding.primary}15, ${branding.primary}05)` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10" style={{ background: `radial-gradient(circle, ${branding.primary}, transparent)` }}></div>
                    <div className="relative z-10">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold" style={{ color: branding.primary }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${branding.primary}, ${branding.secondary})` }}>
                          <MessageSquare className="h-6 w-6 text-white" />
                        </div>
                        Comment Suggestions
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        AI-generated comments for engaging with the {branding.name} post
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50">
                          {results.comments.length} suggestions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {results.comments.map((comment, index) => (
                      <Card key={index} className="border-2 border-white/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-5">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap flex-1">
                                {comment.text}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                                #{index + 1}
                              </div>
                            </div>
                            
                            {comment.rationale && (
                              <div className="p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${branding.primary}08, ${branding.primary}03)` }}>
                                <div className="flex items-start gap-2">
                                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: branding.primary }} />
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strategy</p>
                                    <p className="text-sm text-foreground">{comment.rationale}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <Button
                                onClick={() => copyToClipboard(comment.text, 'comment', index)}
                                variant="outline"
                                size="sm"
                                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                              >
                                {copiedIdx?.type === 'comment' && copiedIdx.idx === index ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Comment
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Enhanced Reposts Section */}
                <Card className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-2xl shadow-black/10 overflow-hidden">
                  <CardHeader className="pb-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${branding.secondary}15, ${branding.secondary}05)` }}>
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10" style={{ background: `radial-gradient(circle, ${branding.secondary}, transparent)` }}></div>
                    <div className="relative z-10">
                      <CardTitle className="flex items-center gap-3 text-2xl font-bold" style={{ color: branding.secondary }}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${branding.secondary}, ${branding.primary})` }}>
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        Repost Suggestions
                      </CardTitle>
                      <CardDescription className="text-base mt-2">
                        AI-generated reposts with your unique perspective for {branding.name}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary" className="bg-white/50 dark:bg-gray-800/50">
                          {results.reposts.length} suggestions
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {results.reposts.map((repost, index) => (
                      <Card key={index} className="border-2 border-white/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-5">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap flex-1">
                                {repost.text}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
                                #{index + 1}
                              </div>
                            </div>
                            
                            {repost.rationale && (
                              <div className="p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${branding.secondary}08, ${branding.secondary}03)` }}>
                                <div className="flex items-start gap-2">
                                  <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: branding.secondary }} />
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strategy</p>
                                    <p className="text-sm text-foreground">{repost.rationale}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <Button
                                onClick={() => copyToClipboard(repost.text, 'repost', index)}
                                variant="outline"
                                size="sm"
                                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 hover:shadow-lg transition-all duration-200 group-hover:scale-105"
                              >
                                {copiedIdx?.type === 'repost' && copiedIdx.idx === index ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Repost
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
      </div>

        {/* Enhanced Loading Overlay */}
        <LoadingOverlay 
          isVisible={loading} 
          message="🤖 AI is analyzing your content and generating intelligent responses..." 
        />
      </div>
    </div>
  );
}


