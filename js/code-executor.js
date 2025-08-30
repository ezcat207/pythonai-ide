// Code Execution module for Python IDE
class CodeExecutor {
    constructor() {
        this.isRunning = false;
        this.executionHistory = [];
        this.outputContainer = null;
        this.consoleContainer = null;
        this.runButton = null;
        this.stopButton = null;
        this.currentExecution = null;
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.initializePanels();
    }

    setupElements() {
        this.outputContainer = document.getElementById('outputContent');
        this.consoleContainer = document.getElementById('consoleContent');
        this.runButton = document.getElementById('runButton');
        this.stopButton = document.getElementById('stopButton');
    }

    setupEventListeners() {
        // Run button
        if (this.runButton) {
            this.runButton.addEventListener('click', () => this.runCode());
        }

        // Stop button
        if (this.stopButton) {
            this.stopButton.addEventListener('click', () => this.stopExecution());
        }

        // Clear output button
        const clearOutputBtn = document.getElementById('clearOutputBtn');
        if (clearOutputBtn) {
            clearOutputBtn.addEventListener('click', () => this.clearOutput());
        }

        // Console input handling
        const consoleInput = this.consoleContainer?.querySelector('.console-input');
        if (consoleInput) {
            consoleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleConsoleInput(consoleInput.value);
                    consoleInput.value = '';
                }
            });
        }

        // Panel tab switching
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('panel-tab')) {
                this.switchPanel(e.target.dataset.tab);
            }
        });
    }

    initializePanels() {
        this.updateStatus('Ready to run');
        this.showWelcomeOutput();
    }

    async runCode() {
        if (this.isRunning) {
            this.showError('Code is already running!');
            return;
        }

        const code = window.editor ? window.editor.getCurrentCode().trim() : '';
        
        if (!code) {
            this.showError('No code to run! Write some Python code first.');
            return;
        }

        try {
            this.startExecution();
            const result = await this.executeCode(code);
            this.handleExecutionResult(result);
            
            // Save execution to history
            if (authManager.isLoggedIn()) {
                this.saveExecutionToDatabase(code, result);
            }
            
        } catch (error) {
            this.handleExecutionError(error);
        } finally {
            this.stopExecution();
        }
    }

    async executeCode(code) {
        // Simulate code execution since we can't run Python in browser
        // In a real implementation, this would call a backend Python executor
        return await this.simulateCodeExecution(code);
    }

    async simulateCodeExecution(code) {
        const startTime = Date.now();
        
        // Simulate execution time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const executionTime = Date.now() - startTime;
        
        // Parse and simulate Python code execution
        const result = this.parsePythonCode(code);
        
        return {
            output: result.output,
            error: result.error,
            executionTime: executionTime,
            status: result.error ? 'error' : 'success'
        };
    }

    parsePythonCode(code) {
        const lines = code.split('\n');
        const output = [];
        const errors = [];
        let variables = {};
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNum = i + 1;
            
            if (!line || line.startsWith('#')) continue;
            
            try {
                // Handle different Python constructs
                if (line.startsWith('print(')) {
                    const printOutput = this.handlePrint(line, variables);
                    if (printOutput) {
                        output.push(printOutput);
                    }
                } else if (line.includes('=') && !line.includes('==') && !line.includes('!=')) {
                    this.handleAssignment(line, variables);
                } else if (line.startsWith('input(')) {
                    const inputResult = this.handleInput(line);
                    output.push(inputResult);
                } else if (line.startsWith('import ') || line.startsWith('from ')) {
                    this.handleImport(line, output);
                } else if (line.startsWith('if ') || line.startsWith('for ') || line.startsWith('while ') || line.startsWith('def ')) {
                    this.handleControlFlow(line, output);
                } else if (line.includes('len(') || line.includes('range(') || line.includes('str(') || line.includes('int(') || line.includes('float(')) {
                    this.handleBuiltinFunction(line, variables, output);
                }
                
            } catch (error) {
                errors.push(`Line ${lineNum}: ${error.message}`);
            }
        }
        
        return {
            output: output.length > 0 ? output.join('\n') : 'Program executed successfully (no output)',
            error: errors.length > 0 ? errors.join('\n') : null
        };
    }

    handlePrint(line, variables) {
        // Extract content from print()
        const match = line.match(/print\s*\(\s*(.+)\s*\)/);
        if (!match) return null;
        
        let content = match[1];
        
        // Handle f-strings
        if (content.startsWith('f"') || content.startsWith("f'")) {
            content = this.evaluateFString(content, variables);
        }
        // Handle regular strings
        else if (content.startsWith('"') && content.endsWith('"')) {
            content = content.slice(1, -1);
        } else if (content.startsWith("'") && content.endsWith("'")) {
            content = content.slice(1, -1);
        }
        // Handle variables
        else if (variables.hasOwnProperty(content)) {
            content = variables[content];
        }
        // Handle expressions
        else {
            content = this.evaluateExpression(content, variables);
        }
        
        return content;
    }

    handleAssignment(line, variables) {
        const parts = line.split('=');
        if (parts.length !== 2) return;
        
        const varName = parts[0].trim();
        let value = parts[1].trim();
        
        // Handle different value types
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        } else if (value === 'True') {
            value = true;
        } else if (value === 'False') {
            value = false;
        } else if (value === 'None') {
            value = null;
        } else if (!isNaN(value)) {
            value = value.includes('.') ? parseFloat(value) : parseInt(value);
        } else if (value.startsWith('input(')) {
            value = `User_Input_${Math.random().toString(36).substr(2, 5)}`;
        }
        
        variables[varName] = value;
    }

    handleInput(line) {
        const match = line.match(/input\s*\(\s*(.+)?\s*\)/);
        const prompt = match && match[1] ? match[1].replace(/['"]/g, '') : 'Input: ';
        return `${prompt}[Simulated input: User_Input_${Math.random().toString(36).substr(2, 5)}]`;
    }

    handleImport(line, output) {
        const importMatch = line.match(/import\s+(\w+)/) || line.match(/from\s+(\w+)/);
        if (importMatch) {
            const module = importMatch[1];
            if (CONFIG.EXECUTION.allowedModules.includes(module)) {
                output.push(`✓ Imported ${module} successfully`);
            } else {
                throw new Error(`Module '${module}' is not available in this environment`);
            }
        }
    }

    handleControlFlow(line, output) {
        if (line.startsWith('if ')) {
            output.push('📋 Conditional statement executed');
        } else if (line.startsWith('for ')) {
            output.push('🔄 Loop started');
        } else if (line.startsWith('while ')) {
            output.push('🔁 While loop started');
        } else if (line.startsWith('def ')) {
            const funcMatch = line.match(/def\s+(\w+)/);
            if (funcMatch) {
                output.push(`📝 Function '${funcMatch[1]}' defined`);
            }
        }
    }

    handleBuiltinFunction(line, variables, output) {
        if (line.includes('len(')) {
            output.push('📏 Length calculated');
        } else if (line.includes('range(')) {
            output.push('📊 Range created');
        } else if (line.includes('str(') || line.includes('int(') || line.includes('float(')) {
            output.push('🔄 Type conversion performed');
        }
    }

    evaluateFString(fstring, variables) {
        // Simple f-string evaluation
        let result = fstring.slice(2, -1); // Remove f" and "
        
        Object.keys(variables).forEach(varName => {
            const regex = new RegExp(`\\{${varName}\\}`, 'g');
            result = result.replace(regex, variables[varName]);
        });
        
        return result;
    }

    evaluateExpression(expr, variables) {
        // Simple expression evaluation
        try {
            // Replace variables with their values
            let evalExpr = expr;
            Object.keys(variables).forEach(varName => {
                const value = typeof variables[varName] === 'string' ? `"${variables[varName]}"` : variables[varName];
                evalExpr = evalExpr.replace(new RegExp(`\\b${varName}\\b`, 'g'), value);
            });
            
            // For safety, only allow simple math operations
            if (/^[\d\s+\-*/.()]+$/.test(evalExpr)) {
                return eval(evalExpr);
            }
            
            return expr; // Return as string if can't evaluate
        } catch (error) {
            return expr;
        }
    }

    startExecution() {
        this.isRunning = true;
        this.updateRunButtons();
        this.updateStatus('Running...');
        this.clearOutput();
        this.switchPanel('output');
        
        // Show running indicator
        this.addOutput('🚀 Starting execution...\n', 'system');
    }

    stopExecution() {
        this.isRunning = false;
        this.currentExecution = null;
        this.updateRunButtons();
        this.updateStatus('Ready');
    }

    handleExecutionResult(result) {
        const { output, error, executionTime, status } = result;
        
        if (error) {
            this.addOutput(`❌ Error:\n${error}`, 'error');
            this.updateStatus(`Error (${executionTime}ms)`);
        } else {
            this.addOutput(output, 'output');
            this.addOutput(`\n✅ Execution completed in ${executionTime}ms`, 'system');
            this.updateStatus(`Success (${executionTime}ms)`);
            
            // Update user stats
            this.updateUserStats();
        }
    }

    handleExecutionError(error) {
        this.addOutput(`❌ Execution Error:\n${error.message}`, 'error');
        this.updateStatus('Error');
        console.error('Execution error:', error);
    }

    addOutput(text, type = 'output') {
        if (!this.outputContainer) return;
        
        const outputLine = document.createElement('div');
        outputLine.className = `output-line ${type}`;
        
        if (type === 'system') {
            outputLine.style.color = 'var(--info-color)';
            outputLine.style.fontStyle = 'italic';
        } else if (type === 'error') {
            outputLine.style.color = 'var(--danger-color)';
            outputLine.style.fontWeight = 'bold';
        } else {
            outputLine.style.color = 'var(--text-primary)';
        }
        
        outputLine.textContent = text;
        this.outputContainer.appendChild(outputLine);
        
        // Auto-scroll to bottom
        this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
    }

    clearOutput() {
        if (this.outputContainer) {
            this.outputContainer.innerHTML = '';
        }
    }

    showWelcomeOutput() {
        if (this.outputContainer && this.outputContainer.children.length === 0) {
            this.outputContainer.innerHTML = `
                <div class="welcome-message">
                    <p>👋 Welcome to PythonAI! Click the Run button to execute your code.</p>
                    <p>💡 Tip: Ask the AI assistant for help with your code anytime!</p>
                </div>
            `;
        }
    }

    showError(message) {
        this.addOutput(`❌ ${message}`, 'error');
        this.switchPanel('output');
    }

    updateStatus(status) {
        const statusElement = document.getElementById('outputStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    updateRunButtons() {
        if (this.runButton) {
            this.runButton.disabled = this.isRunning;
            const icon = this.runButton.querySelector('i');
            if (icon) {
                icon.className = this.isRunning ? 'fas fa-spinner fa-spin' : 'fas fa-play';
            }
        }
        
        if (this.stopButton) {
            this.stopButton.disabled = !this.isRunning;
        }
    }

    switchPanel(panelName) {
        // Update tab states
        const tabs = document.querySelectorAll('.panel-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === panelName);
        });
        
        // Update panel content
        const panes = document.querySelectorAll('.tab-pane');
        panes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `${panelName}-pane`);
        });
    }

    handleConsoleInput(input) {
        if (!input.trim()) return;
        
        // Add user input to console
        const consoleLine = document.createElement('div');
        consoleLine.className = 'console-line';
        consoleLine.innerHTML = `<span class="prompt">>>> </span>${input}`;
        
        const consoleContent = document.getElementById('consoleContent');
        if (consoleContent) {
            // Remove the input line and add the completed one
            const inputLine = consoleContent.querySelector('.console-line:last-child');
            if (inputLine) {
                inputLine.remove();
            }
            
            consoleContent.appendChild(consoleLine);
            
            // Simulate console response
            setTimeout(() => {
                const response = this.evaluateConsoleInput(input);
                const responseLine = document.createElement('div');
                responseLine.className = 'console-response';
                responseLine.textContent = response;
                consoleContent.appendChild(responseLine);
                
                // Add new input line
                const newInputLine = document.createElement('div');
                newInputLine.className = 'console-line';
                newInputLine.innerHTML = `
                    <span class="prompt">>>> </span>
                    <input type="text" class="console-input" placeholder="Interactive Python console">
                `;
                consoleContent.appendChild(newInputLine);
                
                const newInput = newInputLine.querySelector('.console-input');
                newInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleConsoleInput(newInput.value);
                        newInput.value = '';
                    }
                });
                
                newInput.focus();
            }, 200);
        }
    }

    evaluateConsoleInput(input) {
        // Simple console evaluation
        if (input.trim() === 'help()') {
            return 'Welcome to Python! Try: print("Hello"), 2+2, or ask the AI assistant!';
        }
        
        if (input.includes('print(')) {
            const match = input.match(/print\s*\(\s*(.+)\s*\)/);
            if (match) {
                let content = match[1];
                if (content.startsWith('"') && content.endsWith('"')) {
                    return content.slice(1, -1);
                }
                if (content.startsWith("'") && content.endsWith("'")) {
                    return content.slice(1, -1);
                }
                return content;
            }
        }
        
        // Simple math evaluation
        if (/^[\d\s+\-*/.()]+$/.test(input)) {
            try {
                return eval(input);
            } catch (error) {
                return `Error: ${error.message}`;
            }
        }
        
        return `'${input}' - Try: print("Hello"), 2+2, or ask the AI assistant!`;
    }

    async updateUserStats() {
        if (!authManager.isLoggedIn()) return;
        
        try {
            const userId = authManager.getCurrentUser().id;
            const profile = await api.getUserProfile(userId);
            
            if (profile && profile.length > 0) {
                const currentProfile = profile[0];
                const updates = {
                    total_runs: currentProfile.total_runs + 1,
                    last_active: new Date().toISOString()
                };
                
                await api.updateUserProfile(userId, updates);
            }
        } catch (error) {
            console.error('Failed to update user stats:', error);
        }
    }

    async saveExecutionToDatabase(code, result) {
        try {
            const userId = authManager.getCurrentUser().id;
            const currentProject = window.projectManager ? window.projectManager.getCurrentProject() : null;
            
            if (!currentProject) return;
            
            const executionData = {
                user_id: userId,
                project_id: currentProject.id,
                code: code,
                output: result.output,
                error: result.error,
                execution_time: result.executionTime / 1000, // Convert to seconds
                status: result.status
            };
            
            await api.executeCode(executionData);
        } catch (error) {
            console.error('Failed to save execution to database:', error);
        }
    }

    getExecutionHistory() {
        return this.executionHistory;
    }
}

// Add CSS for output styling
const executorStyles = `
.output-line {
    margin-bottom: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.4;
    white-space: pre-wrap;
}

.console-line {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
}

.console-response {
    color: var(--text-secondary);
    margin-bottom: 8px;
    margin-left: 24px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
}

.prompt {
    color: var(--primary-color);
    font-weight: 600;
    margin-right: 4px;
}

.console-input {
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-family: inherit;
    font-size: inherit;
    outline: none;
    flex: 1;
}

.welcome-message p {
    margin-bottom: 8px;
    color: var(--text-secondary);
}

.spinner {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Add styles to document
const executorStyleSheet = document.createElement('style');
executorStyleSheet.textContent = executorStyles;
document.head.appendChild(executorStyleSheet);

// Initialize code executor
const codeExecutor = new CodeExecutor();

// Make codeExecutor available globally
window.codeExecutor = codeExecutor;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeExecutor;
}