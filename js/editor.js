// Code Editor module using Monaco Editor
class CodeEditor {
    constructor() {
        this.editor = null;
        this.currentFile = null;
        this.openFiles = new Map();
        this.isInitialized = false;
        this.unsavedChanges = false;
        this.autoSaveTimer = null;
        
        this.init();
    }

    async init() {
        await this.initializeMonaco();
        this.setupEventListeners();
        this.loadDefaultProject();
    }

    async initializeMonaco() {
        return new Promise((resolve) => {
            require.config({ 
                paths: { 
                    'vs': 'https://unpkg.com/monaco-editor@0.45.0/min/vs' 
                } 
            });

            require(['vs/editor/editor.main'], () => {
                this.setupMonaco();
                resolve();
            });
        });
    }

    setupMonaco() {
        // Configure Monaco Editor - Remove invalid typescript.pythonDefaults call
        // Python doesn't have typescript defaults in Monaco
        
        // Custom Python configuration
        monaco.languages.setMonarchTokensProvider('python', {
            keywords: [
                'and', 'as', 'assert', 'break', 'class', 'continue', 'def',
                'del', 'elif', 'else', 'except', 'exec', 'finally',
                'for', 'from', 'global', 'if', 'import', 'in',
                'is', 'lambda', 'not', 'or', 'pass', 'print',
                'raise', 'return', 'try', 'while', 'with', 'yield',
                'None', 'True', 'False'
            ],
            
            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=',
                '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '&',
                '|', '^', '%', '<<', '>>', '>>>', '+=', '-=', '*=',
                '/=', '&=', '|=', '^=', '%=', '<<=', '>>=', '>>>='
            ],

            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            digits: /\d+(_+\d+)*/,
            
            tokenizer: {
                root: [
                    [/[a-zA-Z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    [/[{}()\[\]]/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],
                    [/@digits/, 'number'],
                    [/[;,.]/, 'delimiter'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string_double'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/'/, 'string', '@string_single'],
                    [/#.*$/, 'comment'],
                ],

                string_double: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, 'string', '@pop']
                ],

                string_single: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string.escape.invalid'],
                    [/'/, 'string', '@pop']
                ]
            }
        });

        // Create the editor
        this.createEditor();
        this.isInitialized = true;
    }

    createEditor() {
        const editorContainer = document.getElementById('codeEditor');
        
        this.editor = monaco.editor.create(editorContainer, {
            value: CONFIG.DEFAULT_PROJECT.code,
            language: 'python',
            theme: CONFIG.EDITOR.theme,
            fontSize: CONFIG.EDITOR.fontSize,
            tabSize: CONFIG.EDITOR.tabSize,
            insertSpaces: CONFIG.EDITOR.insertSpaces,
            wordWrap: CONFIG.EDITOR.wordWrap,
            minimap: CONFIG.EDITOR.minimap,
            scrollBeyondLastLine: CONFIG.EDITOR.scrollBeyondLastLine,
            automaticLayout: CONFIG.EDITOR.automaticLayout,
            suggestOnTriggerCharacters: CONFIG.EDITOR.suggestOnTriggerCharacters,
            acceptSuggestionOnEnter: CONFIG.EDITOR.acceptSuggestionOnEnter,
            tabCompletion: CONFIG.EDITOR.tabCompletion,
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            bracketMatching: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true
        });

        // Setup editor event listeners
        this.setupEditorEvents();
        
        // Load default file
        this.openFile({
            name: CONFIG.DEFAULT_PROJECT.title,
            content: CONFIG.DEFAULT_PROJECT.code,
            language: 'python'
        });
    }

    setupEditorEvents() {
        // Content change event
        this.editor.onDidChangeModelContent(() => {
            this.markAsUnsaved();
            this.scheduleAutoSave();
        });

        // Cursor position change
        this.editor.onDidChangeCursorPosition((e) => {
            this.updateCursorPosition(e.position);
        });

        // Key bindings
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            this.saveCurrentFile();
        });

        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
            if (window.codeExecutor) {
                window.codeExecutor.runCode();
            }
        });

        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
            this.formatCode();
        });

        // Context menu
        this.editor.addAction({
            id: 'ask-ai',
            label: 'Ask AI about this code',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            run: () => {
                const selection = this.editor.getSelection();
                const selectedText = this.editor.getModel().getValueInRange(selection);
                if (selectedText && window.aiAssistant) {
                    window.aiAssistant.askAboutCode(selectedText);
                }
            }
        });

        this.editor.addAction({
            id: 'explain-line',
            label: 'Explain this line',
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.6,
            run: () => {
                const position = this.editor.getPosition();
                const lineContent = this.editor.getModel().getLineContent(position.lineNumber);
                if (lineContent.trim() && window.aiAssistant) {
                    window.aiAssistant.explainCode(lineContent);
                }
            }
        });
    }

    setupEventListeners() {
        // Format button
        const formatBtn = document.getElementById('formatBtn');
        if (formatBtn) {
            formatBtn.addEventListener('click', () => this.formatCode());
        }

        // Health check button
        const healthCheckBtn = document.getElementById('healthCheckBtn');
        if (healthCheckBtn) {
            healthCheckBtn.addEventListener('click', () => this.runHealthCheck());
        }

        // File tab events will be handled by project manager
    }

    openFile(file) {
        if (!this.isInitialized) {
            setTimeout(() => this.openFile(file), 100);
            return;
        }

        // Create or get model for the file
        let model = this.openFiles.get(file.name);
        
        if (!model) {
            model = monaco.editor.createModel(
                file.content || '',
                file.language || 'python',
                monaco.Uri.file(file.name)
            );
            this.openFiles.set(file.name, model);
            
            // Add file tab
            this.addFileTab(file.name);
        }

        // Set the model in the editor
        this.editor.setModel(model);
        this.currentFile = file.name;
        this.updateFileTabState();
        this.updateProjectName(file.name);
        
        // Focus the editor
        this.editor.focus();
    }

    closeFile(fileName) {
        const model = this.openFiles.get(fileName);
        if (model) {
            model.dispose();
            this.openFiles.delete(fileName);
        }
        
        this.removeFileTab(fileName);
        
        // Switch to another open file or create new one
        if (this.openFiles.size > 0) {
            const firstFile = this.openFiles.keys().next().value;
            this.switchToFile(firstFile);
        } else {
            this.loadDefaultProject();
        }
    }

    switchToFile(fileName) {
        if (this.openFiles.has(fileName)) {
            const model = this.openFiles.get(fileName);
            this.editor.setModel(model);
            this.currentFile = fileName;
            this.updateFileTabState();
            this.updateProjectName(fileName);
        }
    }

    addFileTab(fileName) {
        const fileTabs = document.querySelector('.file-tabs');
        
        // Remove existing tab if it exists
        const existingTab = fileTabs.querySelector(`[data-file="${fileName}"]`);
        if (existingTab) {
            existingTab.remove();
        }
        
        const tab = document.createElement('div');
        tab.className = 'file-tab';
        tab.dataset.file = fileName;
        tab.innerHTML = `
            <span>${fileName}</span>
            <button class="tab-close" onclick="editor.closeFile('${fileName}')">&times;</button>
        `;
        
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToFile(fileName);
            }
        });
        
        fileTabs.appendChild(tab);
    }

    removeFileTab(fileName) {
        const tab = document.querySelector(`[data-file="${fileName}"]`);
        if (tab) {
            tab.remove();
        }
    }

    updateFileTabState() {
        const tabs = document.querySelectorAll('.file-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.file === this.currentFile);
        });
    }

    getCurrentCode() {
        return this.editor ? this.editor.getValue() : '';
    }

    setCode(code) {
        if (this.editor) {
            this.editor.setValue(code);
        }
    }

    insertCode(code, position = null) {
        if (!this.editor) return;
        
        if (position) {
            this.editor.executeEdits('insert-code', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: code
            }]);
        } else {
            const selection = this.editor.getSelection();
            this.editor.executeEdits('insert-code', [{
                range: selection,
                text: code
            }]);
        }
    }

    formatCode() {
        if (!this.editor) return;
        
        this.editor.getAction('editor.action.formatDocument').run();
    }

    async runHealthCheck() {
        const code = this.getCurrentCode();
        const problems = this.analyzeCode(code);
        
        // Update problems panel
        this.updateProblemsPanel(problems);
        
        // Show notification
        const problemCount = problems.length;
        if (problemCount === 0) {
            this.showNotification('✅ No problems found! Great job!', 'success');
        } else {
            this.showNotification(`⚠️ Found ${problemCount} potential issue${problemCount > 1 ? 's' : ''}`, 'warning');
        }
    }

    analyzeCode(code) {
        const problems = [];
        const lines = code.split('\n');
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();
            
            // Check for common Python issues
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                // Missing colons
                if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\s/.test(trimmedLine) && !trimmedLine.endsWith(':')) {
                    problems.push({
                        line: lineNum,
                        column: line.length + 1,
                        message: 'Missing colon at end of line',
                        severity: 'error',
                        code: 'missing-colon'
                    });
                }
                
                // Unused variables (simple check)
                const varMatch = line.match(/^(\s*)(\w+)\s*=\s*(.+)/);
                if (varMatch && !code.includes(varMatch[2], code.indexOf(line) + line.length)) {
                    problems.push({
                        line: lineNum,
                        column: varMatch[1].length + 1,
                        message: `Variable '${varMatch[2]}' is assigned but never used`,
                        severity: 'warning',
                        code: 'unused-variable'
                    });
                }
                
                // Long lines
                if (line.length > 100) {
                    problems.push({
                        line: lineNum,
                        column: 100,
                        message: 'Line is too long (>100 characters)',
                        severity: 'info',
                        code: 'line-too-long'
                    });
                }
                
                // Print statements without parentheses (Python 2 style)
                if (/print\s+[^(]/.test(trimmedLine)) {
                    problems.push({
                        line: lineNum,
                        column: line.indexOf('print') + 1,
                        message: 'Use print() function syntax in Python 3',
                        severity: 'warning',
                        code: 'print-statement'
                    });
                }
            }
        });
        
        return problems;
    }

    updateProblemsPanel(problems) {
        const problemsContent = document.getElementById('problemsContent');
        const problemCount = document.getElementById('problemCount');
        
        if (problemCount) {
            problemCount.textContent = problems.length;
            problemCount.style.display = problems.length > 0 ? 'inline' : 'none';
        }
        
        if (problems.length === 0) {
            problemsContent.innerHTML = `
                <div class="no-problems">
                    <i class="fas fa-check-circle"></i>
                    <p>No problems found. Great job!</p>
                </div>
            `;
        } else {
            const problemsHTML = problems.map(problem => `
                <div class="problem-item ${problem.severity}" onclick="editor.goToLine(${problem.line})">
                    <div class="problem-icon">
                        <i class="fas fa-${problem.severity === 'error' ? 'times-circle' : problem.severity === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                    </div>
                    <div class="problem-details">
                        <div class="problem-message">${problem.message}</div>
                        <div class="problem-location">Line ${problem.line}, Column ${problem.column}</div>
                    </div>
                </div>
            `).join('');
            
            problemsContent.innerHTML = problemsHTML;
        }
    }

    goToLine(lineNumber) {
        if (!this.editor) return;
        
        this.editor.revealLine(lineNumber);
        this.editor.setPosition({ lineNumber, column: 1 });
        this.editor.focus();
    }

    markAsUnsaved() {
        this.unsavedChanges = true;
        this.updateProjectStatus('unsaved');
    }

    markAsSaved() {
        this.unsavedChanges = false;
        this.updateProjectStatus('saved');
    }

    updateProjectStatus(status) {
        const statusElement = document.querySelector('.project-status');
        if (statusElement) {
            statusElement.className = `project-status ${status}`;
            statusElement.textContent = status === 'unsaved' ? '• Unsaved' : '• Saved';
        }
    }

    updateProjectName(fileName) {
        const nameElement = document.getElementById('projectName');
        if (nameElement) {
            nameElement.textContent = fileName;
        }
    }

    updateCursorPosition(position) {
        // Could show cursor position in status bar
        console.log(`Line ${position.lineNumber}, Column ${position.column}`);
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, CONFIG.UI.autoSaveInterval);
    }

    async autoSave() {
        if (!this.unsavedChanges || !this.currentFile) return;
        
        try {
            await this.saveCurrentFile(true); // Silent save
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    async saveCurrentFile(silent = false) {
        if (!this.currentFile || !window.projectManager) return;
        
        const code = this.getCurrentCode();
        
        try {
            await window.projectManager.saveProject(this.currentFile, code);
            this.markAsSaved();
            
            if (!silent) {
                this.showNotification('✅ Project saved successfully!', 'success');
            }
        } catch (error) {
            console.error('Save failed:', error);
            if (!silent) {
                this.showNotification('❌ Failed to save project', 'error');
            }
        }
    }

    loadDefaultProject() {
        this.openFile({
            name: CONFIG.DEFAULT_PROJECT.title,
            content: CONFIG.DEFAULT_PROJECT.code,
            language: 'python'
        });
    }

    showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid var(--border-color);
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.borderColor = 'var(--success-color)';
        } else if (type === 'error') {
            notification.style.borderColor = 'var(--danger-color)';
        } else if (type === 'warning') {
            notification.style.borderColor = 'var(--warning-color)';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    dispose() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.openFiles.forEach(model => model.dispose());
        this.openFiles.clear();
        
        if (this.editor) {
            this.editor.dispose();
        }
    }
}

// Add CSS for problem items
const problemStyles = `
.problem-item {
    display: flex;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.problem-item:hover {
    background: var(--bg-tertiary);
}

.problem-item.error {
    border-left: 3px solid var(--danger-color);
}

.problem-item.warning {
    border-left: 3px solid var(--warning-color);
}

.problem-item.info {
    border-left: 3px solid var(--info-color);
}

.problem-icon {
    flex-shrink: 0;
    margin-top: 2px;
}

.problem-icon .fa-times-circle {
    color: var(--danger-color);
}

.problem-icon .fa-exclamation-triangle {
    color: var(--warning-color);
}

.problem-icon .fa-info-circle {
    color: var(--info-color);
}

.problem-details {
    flex: 1;
}

.problem-message {
    font-size: 13px;
    color: var(--text-primary);
    margin-bottom: 2px;
}

.problem-location {
    font-size: 11px;
    color: var(--text-secondary);
}
`;

// Add styles to document
const problemStyleSheet = document.createElement('style');
problemStyleSheet.textContent = problemStyles;
document.head.appendChild(problemStyleSheet);

// Initialize editor
const editor = new CodeEditor();

// Make editor available globally
window.editor = editor;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeEditor;
}