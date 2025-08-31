// AI Assistant module for Gemini integration
class AIAssistant {
    constructor() {
        this.chatContainer = null;
        this.inputField = null;
        this.sendButton = null;
        this.isTyping = false;
        this.conversationHistory = [];
        this.isMinimized = false;
        
        // Gemini API configuration
        this.geminiApiKey = 'AIzaSyDMA5MaWlgh0C_6zLs6dAI7X-LB6YptIjs';
        this.geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.loadConversationHistory();
        this.showWelcomeMessage();
    }

    setupElements() {
        this.chatContainer = document.getElementById('aiChat');
        this.inputField = document.getElementById('aiInput');
        this.sendButton = document.getElementById('sendBtn');
    }

    setupEventListeners() {
        // Send button
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.handleSendMessage());
        }

        // Input field
        if (this.inputField) {
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSendMessage();
                }
            });

            this.inputField.addEventListener('input', () => {
                this.updateSendButtonState();
            });
        }

        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn')) {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            }
        });

        // AI feature buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ai-feature-btn')) {
                const feature = e.target.dataset.feature;
                this.handleAIFeature(feature);
            }
        });

        // AI panel controls
        const clearChatBtn = document.getElementById('clearChatBtn');
        const minimizeBtn = document.getElementById('minimizeAIBtn');

        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => this.clearChat());
        }

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }

        // Listen for project changes
        document.addEventListener('projectChanged', (e) => {
            this.onProjectChanged(e.detail);
        });
    }

    async handleSendMessage() {
        const message = this.inputField.value.trim();
        if (!message || this.isTyping) return;

        // Clear input
        this.inputField.value = '';
        this.updateSendButtonState();

        // Add user message to chat
        this.addMessage(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Get current code context
            const codeContext = this.getCodeContext();
            
            // Send message to AI
            const response = await this.sendToAI(message, codeContext);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI response
            this.addMessage(response, 'ai');
            
            // Save conversation
            this.saveConversation(message, response, 'chat');
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again!', 'ai', true);
            console.error('AI Assistant error:', error);
        }
    }

    async handleQuickAction(action) {
        if (this.isTyping) return;

        const codeContext = this.getCodeContext();
        let prompt = '';
        let messageType = action;

        switch (action) {
            case 'explain-code':
                if (!codeContext.code) {
                    this.addMessage('Please write some code first, and I\'ll explain it!', 'ai');
                    return;
                }
                prompt = `Please explain this Python code in simple, kid-friendly terms:\n\n${codeContext.code}`;
                break;
                
            case 'find-bugs':
                if (!codeContext.code) {
                    this.addMessage('Write some code first, and I\'ll help you find any bugs!', 'ai');
                    return;
                }
                prompt = `Please help me find and fix any bugs in this Python code. Explain in simple terms what's wrong and how to fix it:\n\n${codeContext.code}`;
                break;
                
            case 'improve-code':
                if (!codeContext.code) {
                    this.addMessage('Share your code with me, and I\'ll suggest ways to make it better!', 'ai');
                    return;
                }
                prompt = `Please suggest improvements for this Python code. Keep explanations simple and educational:\n\n${codeContext.code}`;
                break;
                
            default:
                return;
        }

        // Show user's action
        this.addMessage(this.getQuickActionLabel(action), 'user');
        
        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.sendToAI(prompt, codeContext);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
            this.saveConversation(prompt, response, messageType);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I had trouble with that request. Please try again!', 'ai', true);
            console.error('Quick action error:', error);
        }
    }

    async handleAIFeature(feature) {
        if (this.isTyping) return;

        const codeContext = this.getCodeContext();
        
        if (!codeContext.code.trim()) {
            this.addMessage('Please write some code first to use AI features! 📝', 'ai');
            return;
        }

        // Show user's action
        this.addMessage(this.getAIFeatureLabel(feature), 'user');
        
        // Show typing indicator
        this.showTypingIndicator();

        try {
            let response;
            switch (feature) {
                case 'auto-comment':
                    await this.autoCommentCodeDirect(codeContext.code);
                    return; // Exit early as we don't need chat response
                case 'auto-syntax-fix':
                    await this.autoSyntaxFixDirect(codeContext.code);
                    return; // Exit early as we don't need chat response
                case 'assist-diagnosis':
                    response = await this.assistDiagnosis(codeContext.code);
                    break;
                case 'health-check':
                    response = await this.codeHealthCheck(codeContext.code);
                    break;
                default:
                    response = 'Unknown feature requested.';
            }
            
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
            this.saveConversation(this.getAIFeatureLabel(feature), response, feature);
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I had trouble with that AI feature. Please try again!', 'ai', true);
            console.error('AI Feature error:', error);
        }
    }

    getQuickActionLabel(action) {
        const labels = {
            'explain-code': '🤔 Explain my code',
            'find-bugs': '🐛 Find bugs in my code',
            'improve-code': '✨ How can I improve my code?'
        };
        return labels[action] || action;
    }

    getAIFeatureLabel(feature) {
        const labels = {
            'auto-comment': '📝 Auto Comment - Add smart comments',
            'auto-syntax-fix': '🔧 Auto Syntax Fix - Fix code errors',
            'assist-diagnosis': '🔍 Assist Diagnosis - Analyze code issues',
            'health-check': '🎩 Code Health Check - Overall code quality'
        };
        return labels[feature] || feature;
    }

    async sendToAI(message, context = null) {
        try {
            const response = await fetch(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: this.buildPrompt(message, context) }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates[0]?.content?.parts[0]?.text || 'Sorry, I couldn\'t process that request.';
        } catch (error) {
            console.error('Gemini API error:', error);
            // Fallback to simulation on error
            return await this.simulateAIResponse(message, context);
        }
    }

    async simulateAIResponse(message, context) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        
        const lowerMessage = message.toLowerCase();
        
        // Code explanation responses
        if (lowerMessage.includes('explain') && context?.code) {
            return this.generateCodeExplanation(context.code);
        }
        
        // Bug finding responses
        if (lowerMessage.includes('bug') || lowerMessage.includes('error')) {
            if (context?.code) {
                return this.generateBugAnalysis(context.code);
            }
            return "I'd love to help you find bugs! Share your code with me and I'll take a look. 🔍";
        }
        
        // Code improvement responses  
        if (lowerMessage.includes('improve') && context?.code) {
            return this.generateImprovementSuggestions(context.code);
        }
        
        // Learning-related responses
        if (lowerMessage.includes('learn') || lowerMessage.includes('tutorial')) {
            return "Great question! 🎓 I can help you learn Python step by step. What would you like to learn about?\n\n• Python basics (variables, loops, functions)\n• Data science with pandas and numpy\n• Machine learning fundamentals\n• Fun projects like games and chatbots\n\nJust ask me about any of these topics!";
        }
        
        // AI-related responses
        if (lowerMessage.includes('ai') || lowerMessage.includes('machine learning')) {
            return "AI and Machine Learning are super exciting! 🤖✨\n\nHere's what makes AI cool:\n• **Machine Learning**: Teaching computers to learn from data\n• **Neural Networks**: Inspired by how our brains work\n• **Pattern Recognition**: Finding hidden patterns in information\n\nWant to build your first AI model? I can guide you through creating a simple neural network or chatbot!";
        }
        
        // Python help responses
        if (lowerMessage.includes('python') || lowerMessage.includes('help')) {
            return "I'm here to help you master Python! 🐍\n\nPython is awesome because:\n• It's beginner-friendly and reads like English\n• Used by companies like Google, Netflix, and Instagram\n• Great for web development, data science, and AI\n\nWhat would you like to work on today? I can help with:\n✅ Writing your first program\n✅ Understanding errors\n✅ Building cool projects\n✅ Learning best practices";
        }
        
        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            const greetings = [
                "Hello there! 👋 Ready to code something amazing?",
                "Hi! I'm excited to help you learn Python and AI! 🚀",
                "Hey! Let's build something cool together! What are you working on?"
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // Encouragement responses
        if (lowerMessage.includes('difficult') || lowerMessage.includes('hard') || lowerMessage.includes('confused')) {
            return "Don't worry! 💪 Programming can seem challenging at first, but you're doing great!\n\nRemember:\n• Every expert was once a beginner\n• Mistakes are how we learn\n• Each error teaches us something new\n\nLet's break down whatever you're working on into smaller steps. What specifically would you like help with?";
        }
        
        // Default helpful response
        return "That's a great question! I'm here to help you learn Python and AI programming. 😊\n\nI can help you with:\n🔍 **Understanding code** - I'll explain any Python concept\n🐛 **Finding bugs** - I'll help debug your programs\n💡 **Improving code** - I'll suggest better ways to write it\n🎓 **Learning new topics** - Ask me about anything Python or AI related\n\nWhat would you like to explore today?";
    }

    generateCodeExplanation(code) {
        // Simple code analysis for explanation
        const lines = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        
        if (lines.length === 0) {
            return "I don't see any code to explain yet! Write some Python code and I'll break it down for you step by step. 😊";
        }
        
        let explanation = "Great code! Let me explain what's happening here: 📝\n\n";
        
        // Analyze common Python patterns
        if (code.includes('print(')) {
            explanation += "🖨️ **Print statements**: These display text or values on the screen\n";
        }
        
        if (code.includes('input(')) {
            explanation += "⌨️ **Input**: This asks the user to type something\n";
        }
        
        if (code.includes('if ') || code.includes('elif ') || code.includes('else:')) {
            explanation += "🔄 **Conditionals**: These make decisions in your code - \"if this, then do that\"\n";
        }
        
        if (code.includes('for ') || code.includes('while ')) {
            explanation += "🔁 **Loops**: These repeat actions multiple times\n";
        }
        
        if (code.includes('def ')) {
            explanation += "🏗️ **Functions**: These are reusable blocks of code that do specific tasks\n";
        }
        
        if (code.includes('import ')) {
            explanation += "📦 **Imports**: These bring in extra tools and libraries to use\n";
        }
        
        explanation += "\nWant me to explain any specific part in more detail? Just ask! 🤓";
        
        return explanation;
    }

    buildPrompt(message, context) {
        let prompt = '';
        
        if (context && context.code) {
            prompt += `You are an AI programming tutor helping kids learn Python. Here's the current code context:\n\n`;
            prompt += `Project: ${context.projectName}\n`;
            prompt += `Code:\n\`\`\`python\n${context.code}\n\`\`\`\n\n`;
        }
        
        prompt += `User message: ${message}\n\n`;
        prompt += `Please respond in a friendly, educational way that's appropriate for kids learning programming. Use emojis and simple explanations.`;
        
        return prompt;
    }

    async autoCommentCode(code) {
        const prompt = `As an AI tutor for kids, please add helpful comments to this Python code. The comments should:
1. Explain what each section does in simple terms
2. Use kid-friendly language
3. Include emojis to make it fun
4. Help kids understand programming concepts

Return the code with added comments:

\`\`\`python\n${code}\n\`\`\`

Make sure to maintain proper Python syntax and indentation.`;
        
        const response = await this.sendToAI(prompt);
        return `📝 **Auto Comment Complete!**\n\nHere's your code with helpful comments added:\n\n${response}\n\n💡 **Tip**: Good comments help you and others understand your code later!`;
    }

    async assistDiagnosis(code) {
        const prompt = `As an AI programming tutor, please perform a detailed diagnosis of this Python code. Analyze for:

1. **Syntax Errors**: Any Python syntax mistakes
2. **Logic Issues**: Problems with the program flow
3. **Best Practices**: Ways to improve code quality
4. **Potential Bugs**: Things that might cause errors
5. **Performance**: Simple optimization suggestions

Code to analyze:
\`\`\`python\n${code}\n\`\`\`

Please provide:
- Clear explanations suitable for kids
- Specific line numbers where issues exist
- Simple solutions for each problem
- Encouragement and positive feedback`;
        
        const response = await this.sendToAI(prompt);
        return `🔍 **Code Diagnosis Complete!**\n\n${response}\n\n💪 Remember: Finding and fixing issues is part of becoming a better programmer!`;
    }

    async codeHealthCheck(code) {
        const prompt = `As an AI programming tutor, please perform a comprehensive health check on this Python code. Evaluate:

**Code Quality Metrics:**
1. **Readability** (0-10): How easy is it to read and understand?
2. **Structure** (0-10): Is the code well-organized?
3. **Comments** (0-10): Are there helpful comments?
4. **Variable Names** (0-10): Are variable names descriptive?
5. **Error Handling** (0-10): Does it handle potential errors?
6. **Efficiency** (0-10): How well does it perform?

Code to check:
\`\`\`python\n${code}\n\`\`\`

Please provide:
- Overall health score (0-100)
- Individual scores for each metric
- Specific recommendations for improvement
- Positive encouragement for good practices found
- Kid-friendly explanations with examples`;
        
        const response = await this.sendToAI(prompt);
        return `🎩 **Code Health Check Results!**\n\n${response}\n\n🌟 Keep coding and improving - every line of code is a step toward mastery!`;
    }

    async autoCommentCodeDirect(code) {
        try {
            const prompt = `As an AI tutor for kids, please add helpful comments to this Python code. The comments should:
1. Explain what each section does in simple terms
2. Use kid-friendly language
3. Include emojis to make it fun
4. Help kids understand programming concepts

Return ONLY the Python code with added comments, no extra text or markdown formatting:

${code}`;
            
            const commentedCode = await this.sendToAI(prompt);
            
            // Clean up the response - remove markdown code blocks if present
            const cleanCode = this.cleanCodeResponse(commentedCode);
            
            // Update the editor directly
            if (window.editor && window.editor.setCode) {
                window.editor.setCode(cleanCode);
                this.hideTypingIndicator();
                this.addMessage('📝 **Auto Comment Applied!** Your code has been updated with helpful comments directly in the editor! 🎉', 'ai');
            } else {
                throw new Error('Editor not available');
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I had trouble adding comments to your code. Please try again!', 'ai', true);
            console.error('Auto Comment Direct error:', error);
        }
    }

    async autoSyntaxFixDirect(code) {
        try {
            const prompt = `As an AI programming tutor, please fix any syntax errors in this Python code. Rules:
1. Fix ONLY syntax errors (missing colons, incorrect indentation, typos, etc.)
2. Keep the original logic and functionality intact
3. Use kid-friendly variable names if needed
4. Add helpful comments explaining the fixes
5. Make sure the code follows proper Python syntax

Return ONLY the corrected Python code, no extra text or markdown formatting:

${code}`;
            
            const fixedCode = await this.sendToAI(prompt);
            
            // Clean up the response
            const cleanCode = this.cleanCodeResponse(fixedCode);
            
            // Check if there were actual changes
            if (cleanCode.trim() !== code.trim()) {
                // Update the editor directly
                if (window.editor && window.editor.setCode) {
                    window.editor.setCode(cleanCode);
                    this.hideTypingIndicator();
                    this.addMessage('🔧 **Syntax Fixed!** I found and fixed syntax errors in your code! Check your editor to see the improvements. ✨', 'ai');
                } else {
                    throw new Error('Editor not available');
                }
            } else {
                this.hideTypingIndicator();
                this.addMessage('🎉 **Great News!** Your code has no syntax errors! It\'s already properly formatted. Keep up the excellent work! 💪', 'ai');
            }
            
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I had trouble fixing your code syntax. Please try again!', 'ai', true);
            console.error('Auto Syntax Fix error:', error);
        }
    }

    cleanCodeResponse(response) {
        // Remove markdown code blocks and extra formatting
        let cleaned = response.trim();
        
        // Remove ```python and ``` markers
        cleaned = cleaned.replace(/^```python\s*\n?/gm, '');
        cleaned = cleaned.replace(/^```\s*$/gm, '');
        
        // Remove any leading/trailing whitespace from lines but preserve indentation
        const lines = cleaned.split('\n');
        const cleanedLines = lines.map(line => line.trimRight()); // Only trim right to preserve indentation
        
        return cleanedLines.join('\n').trim();
    }

    generateBugAnalysis(code) {
        const issues = [];
        
        // Simple bug detection
        const lines = code.split('\n');
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            
            if (trimmed && !trimmed.startsWith('#')) {
                // Missing colons
                if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\s/.test(trimmed) && !trimmed.endsWith(':')) {
                    issues.push(`Line ${lineNum}: Missing colon (:) at the end`);
                }
                
                // Print without parentheses
                if (/print\s+[^(]/.test(trimmed)) {
                    issues.push(`Line ${lineNum}: Use print() with parentheses in Python 3`);
                }
                
                // Common indentation issues (basic check)
                if (trimmed.includes('  ') && !line.startsWith('    ') && !line.startsWith('\t')) {
                    issues.push(`Line ${lineNum}: Check indentation - Python is picky about spaces!`);
                }
            }
        });
        
        if (issues.length === 0) {
            return "Good news! 🎉 I don't see any obvious bugs in your code!\n\nYour code looks clean and follows Python syntax rules. If you're getting errors when running it, try:\n\n1. **Check the error message** - it usually tells you exactly what's wrong\n2. **Test small parts** - run small sections to isolate problems\n3. **Add print statements** - see what values your variables have\n\nKeep coding - you're doing great! 💪";
        } else {
            let response = "I found some things to fix! 🔧 Don't worry, these are easy to solve:\n\n";
            
            issues.forEach((issue, index) => {
                response += `${index + 1}. ${issue}\n`;
            });
            
            response += "\n💡 **Tip**: Most Python errors are about syntax (colons, parentheses, indentation). Take your time and double-check these details!";
            
            return response;
        }
    }

    generateImprovementSuggestions(code) {
        const suggestions = [];
        
        // Analyze code for improvements
        if (code.includes('print(') && !code.includes('f"') && !code.includes('.format(')) {
            suggestions.push("📝 **Use f-strings**: They make string formatting cleaner! Example: `f'Hello {name}'`");
        }
        
        if (code.split('\n').some(line => line.length > 80)) {
            suggestions.push("📏 **Line length**: Keep lines under 80 characters for better readability");
        }
        
        if (!code.includes('#')) {
            suggestions.push("💬 **Add comments**: Explain what your code does with # comments");
        }
        
        if (code.includes('def ') && !code.includes('"""')) {
            suggestions.push("📚 **Documentation**: Add docstrings to your functions with \"\"\"description\"\"\"");
        }
        
        if (suggestions.length === 0) {
            return "Your code is looking good! 🌟\n\nHere are some general tips to make any Python code even better:\n\n• **Use descriptive variable names** - `student_name` is better than `n`\n• **Keep functions small** - each function should do one thing well\n• **Add comments** - explain the 'why', not just the 'what'\n• **Handle errors** - use try/except for things that might fail\n• **Follow PEP 8** - Python's style guide for beautiful code\n\nKeep practicing and experimenting! 🚀";
        }
        
        let response = "Here are some ways to make your code even better! ✨\n\n";
        
        suggestions.forEach((suggestion, index) => {
            response += `${index + 1}. ${suggestion}\n\n`;
        });
        
        response += "Remember: Good code is not just working code, but code that's easy to read and understand! 📖";
        
        return response;
    }

    addMessage(content, sender, isError = false) {
        if (!this.chatContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = `message-avatar ${sender}`;
        avatarDiv.innerHTML = sender === 'ai' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (isError) {
            contentDiv.classList.add('error-message');
        }
        
        const messageP = document.createElement('p');
        messageP.innerHTML = this.formatMessage(content);
        
        contentDiv.appendChild(messageP);
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add conversation to history
        this.conversationHistory.push({
            content,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    formatMessage(content) {
        // Convert basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.isTyping = true;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar ai">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = this.chatContainer.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }

    updateSendButtonState() {
        if (this.sendButton && this.inputField) {
            const hasText = this.inputField.value.trim().length > 0;
            this.sendButton.disabled = !hasText || this.isTyping;
        }
    }

    clearChat() {
        if (confirm('Clear all chat history?')) {
            if (this.chatContainer) {
                this.chatContainer.innerHTML = '';
            }
            this.conversationHistory = [];
            this.showWelcomeMessage();
        }
    }

    toggleMinimize() {
        const aiPanel = document.querySelector('.ai-panel');
        if (aiPanel) {
            this.isMinimized = !this.isMinimized;
            aiPanel.classList.toggle('minimized', this.isMinimized);
            
            const minimizeBtn = document.getElementById('minimizeAIBtn');
            if (minimizeBtn) {
                const icon = minimizeBtn.querySelector('i');
                icon.className = this.isMinimized ? 'fas fa-plus' : 'fas fa-minus';
            }
        }
    }

    showWelcomeMessage() {
        const welcomeMessage = "Hello! I'm your AI programming assistant! 🤖✨\n\nI'm here to help you learn Python and AI programming. I can:\n\n• **Explain code** - Help you understand what your code does\n• **Find bugs** - Spot and fix errors in your programs  \n• **Suggest improvements** - Make your code cleaner and better\n• **Teach concepts** - Answer questions about Python and AI\n\n**🎆 AI Features (Direct Code Editing):**\n• **Auto Comment** - Adds smart comments directly to your code\n• **Auto Syntax Fix** - Automatically fixes code errors in the editor\n• **Assist Diagnosis** - Deep analysis of code issues\n• **Health Check** - Comprehensive code quality assessment\n\nWhat would you like to work on today? 😊";
        
        setTimeout(() => {
            this.addMessage(welcomeMessage, 'ai');
        }, 500);
    }

    getCodeContext() {
        const currentCode = window.editor ? window.editor.getCurrentCode() : '';
        const currentProject = window.projectManager ? window.projectManager.getCurrentProject() : null;
        
        return {
            code: currentCode,
            projectName: currentProject?.title || 'untitled.py',
            language: 'python'
        };
    }

    // Public methods for external calls
    askAboutCode(selectedCode) {
        if (!selectedCode) return;
        
        const prompt = `Can you explain this Python code?\n\n${selectedCode}`;
        this.inputField.value = prompt;
        this.handleSendMessage();
    }

    explainCode(code) {
        const prompt = `What does this line of code do?\n\n${code}`;
        this.inputField.value = prompt;
        this.handleSendMessage();
    }

    async saveConversation(message, response, messageType) {
        if (!authManager.isLoggedIn()) return;
        
        try {
            const userId = authManager.getCurrentUser().id;
            const currentProject = window.projectManager ? window.projectManager.getCurrentProject() : null;
            
            const conversationData = {
                user_id: userId,
                project_id: currentProject?.id || null,
                message: message,
                response: response,
                message_type: messageType,
                context: this.getCodeContext()
            };
            
            await api.saveConversation(conversationData);
        } catch (error) {
            console.error('Failed to save conversation:', error);
        }
    }

    async loadConversationHistory() {
        if (!authManager.isLoggedIn()) return;
        
        try {
            const conversations = await api.getConversations(null, 20);
            // Could restore recent conversations if needed
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }

    onProjectChanged(project) {
        // Could add context about project change
        // this.addMessage(`Switched to project: ${project.title}`, 'system');
    }

    // Public methods for AI features
    async runAutoComment() {
        return this.handleAIFeature('auto-comment');
    }

    async runAutoSyntaxFix() {
        return this.handleAIFeature('auto-syntax-fix');
    }

    async runAssistDiagnosis() {
        return this.handleAIFeature('assist-diagnosis');
    }

    async runHealthCheck() {
        return this.handleAIFeature('health-check');
    }
}

// Add CSS for typing indicator and error messages
const aiAssistantStyles = `
.typing-indicator .message-content {
    padding: 8px 16px;
}

.typing-animation {
    display: flex;
    gap: 4px;
    align-items: center;
}

.typing-animation span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
    animation: typing 1.4s infinite ease-in-out;
}

.typing-animation span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
    }
    30% {
        transform: translateY(-10px);
        opacity: 1;
    }
}

.error-message {
    background: rgba(239, 68, 68, 0.1);
    border-left: 3px solid var(--danger-color);
    border-radius: 4px;
    padding: 8px 12px;
}

.ai-panel.minimized {
    height: 50px;
    overflow: hidden;
}

.ai-panel.minimized .ai-content {
    display: none;
}

code {
    background: var(--bg-quaternary);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
}

.message-content strong {
    color: var(--primary-color);
    font-weight: 600;
}

.message-content em {
    color: var(--warning-color);
    font-style: italic;
}
`;

// Add styles to document
const aiStyleSheet = document.createElement('style');
aiStyleSheet.textContent = aiAssistantStyles;
document.head.appendChild(aiStyleSheet);

// Initialize AI Assistant
const aiAssistant = new AIAssistant();

// Make aiAssistant available globally
window.aiAssistant = aiAssistant;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIAssistant;
}