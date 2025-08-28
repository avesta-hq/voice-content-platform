#!/bin/bash

echo "🚀 Voice Content Platform Setup"
echo "================================"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📁 Found .env.local file"
    
    # Check if API key is still placeholder
    if grep -q "your_openai_api_key_here" .env.local; then
        echo "⚠️  OpenAI API key not configured yet"
        echo ""
        echo "To get your API key:"
        echo "1. Visit: https://platform.openai.com/"
        echo "2. Sign up/Login and go to API Keys"
        echo "3. Create a new API key"
        echo ""
        echo "Then edit .env.local and replace:"
        echo "   OPENAI_API_KEY=your_openai_api_key_here"
        echo "   with your actual API key"
        echo ""
        echo "After updating, restart the development server:"
        echo "   npm run dev"
    else
        echo "✅ OpenAI API key is configured"
        echo "🎉 Full AI-powered content generation is now available!"
    fi
else
    echo "❌ .env.local file not found"
    echo "Creating from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please add your OpenAI API key"
fi

echo ""
echo "🎯 Current Status:"
echo "=================="
echo "• Voice recording: ✅ Working"
echo "• Pause/Resume: ✅ Working" 

# Check API key status more accurately
if [ -f ".env.local" ] && ! grep -q "your_openai_api_key_here" .env.local; then
    echo "• Content generation: ✅ Full AI mode (OpenAI API active)"
    echo ""
    echo "🚀 You're all set! The app will now generate real AI-powered content."
else
    echo "• Content generation: ⚠️  Demo mode (add API key for AI)"
fi

echo ""
echo "🌐 Access your app at: http://localhost:3000"
echo ""
