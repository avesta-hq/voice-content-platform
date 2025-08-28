# 🎤 Voice Content Platform

Transform your voice into professional content across multiple platforms while preserving your original message exactly as spoken.

## ✨ Features

- **🎤 Multi-Language Voice Input**: Support for 12+ languages including Gujarati, English, Spanish, French, German, and more
- **🌍 Language Translation**: Speak in one language, get content in another
- **⏸️ Pause & Resume**: Take breaks while recording without losing your input
- **🤖 AI-Powered Generation**: Creates content for LinkedIn, Twitter, blog posts, and podcast scripts
- **📱 Responsive Design**: Works perfectly on all devices
- **🔒 Content Preservation**: Your original speech input is never altered or enhanced

## 🚀 Tech Stack

- **Frontend & Backend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **AI**: OpenAI GPT-4
- **Speech Recognition**: Web Speech API
- **Deployment**: Ready for Vercel, Netlify, or any hosting platform

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd voice-content-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_actual_openai_api_key_here
   NEXT_PUBLIC_APP_NAME=Voice Content Platform
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌍 Supported Languages

### Input Languages (Speech Recognition)
- **Gujarati** (ગુજરાતી) - Default
- **English** (English)
- **Hindi** (हिन्दी)
- **Spanish** (Español)
- **French** (Français)
- **German** (Deutsch)
- **Italian** (Italiano)
- **Portuguese** (Português)
- **Russian** (Русский)
- **Japanese** (日本語)
- **Korean** (한국어)
- **Chinese** (中文)

### Output Languages (Content Generation)
All input languages can be selected as output languages, allowing for complete language flexibility.

## 📖 How to Use

1. **Select Languages**: Choose your input (speech) and output (content) languages
2. **Start Recording**: Click "Start Recording" and speak naturally
3. **Pause if Needed**: Use pause/resume to take breaks while thinking
4. **Complete Input**: Click "Done" when finished with your speech
5. **Generate Content**: AI processes your input and creates platform-specific content
6. **Copy & Use**: Copy, download, or share your generated content

## 🎯 Content Types Generated

- **LinkedIn Posts**: Professional, engaging content for business networking
- **Twitter Threads**: Concise, shareable content optimized for Twitter
- **Blog Articles**: Detailed, SEO-friendly blog post content
- **Podcast Scripts**: Structured scripts perfect for audio content creation

## 🔧 Configuration

### OpenAI API Setup
1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to `.env.local`
3. The system will automatically use it for content generation

### Custom Language Support
Add new languages by editing `src/lib/languages.ts`:
```typescript
{
  code: 'xx',
  name: 'Language Name',
  nativeName: 'Native Name',
  speechRecognitionCode: 'xx-XX'
}
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── page.tsx           # Main page
├── components/             # React components
│   ├── VoiceRecorder.tsx  # Voice input component
│   ├── ContentProcessor.tsx # AI processing component
│   └── ContentDisplay.tsx # Results display component
├── lib/                    # Utility libraries
│   ├── languages.ts       # Language definitions
│   ├── openai.ts          # OpenAI API integration
│   └── speechRecognition.ts # Speech recognition wrapper
└── types/                  # TypeScript type definitions
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Use `npm run build` and deploy `out/` folder
- **Railway**: Connect GitHub repo and add environment variables
- **Self-hosted**: Use `npm run build` and serve the `out/` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Next.js team for the amazing framework
- Web Speech API for browser-native speech recognition
- Tailwind CSS for the beautiful styling system

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/voice-content-platform/issues) page
2. Create a new issue with detailed information
3. Include your browser, OS, and any error messages

---

**Made with ❤️ using Next.js, TypeScript, and Tailwind CSS**
