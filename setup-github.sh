#!/bin/bash

echo "🚀 Setting up GitHub repository for Voice Content Platform"
echo "========================================================"
echo ""

# Check if git remote already exists
if git remote get-url origin >/dev/null 2>&1; then
    echo "✅ Git remote 'origin' already exists:"
    git remote get-url origin
    echo ""
    echo "To change it, run: git remote set-url origin <new-url>"
else
    echo "📝 Please provide your GitHub repository URL:"
    echo "   Format: https://github.com/username/repository-name.git"
    echo "   or: git@github.com:username/repository-name.git"
    echo ""
    read -p "GitHub URL: " github_url
    
    if [ -n "$github_url" ]; then
        echo ""
        echo "🔗 Adding remote origin..."
        git remote add origin "$github_url"
        
        echo "✅ Remote added successfully!"
        echo "🌐 Remote URL: $github_url"
        echo ""
        
        echo "📤 Ready to push to GitHub!"
        echo "   Run: git push -u origin main"
    else
        echo "❌ No URL provided. You can add it later with:"
        echo "   git remote add origin <your-github-url>"
    fi
fi

echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub (if not already done)"
echo "2. Copy the repository URL"
echo "3. Run: git remote add origin <your-github-url>"
echo "4. Run: git push -u origin main"
echo ""
echo "🔗 GitHub repository creation: https://github.com/new"
echo ""
echo "✨ Your Voice Content Platform is ready for GitHub!"
