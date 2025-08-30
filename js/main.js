// Main application entry point
class PythonAI {
    constructor() {
        this.isInitialized = false;
        this.components = {};
        
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing PythonAI IDE...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
            } else {
                await this.initializeComponents();
            }
            
        } catch (error) {
            console.error('Failed to initialize PythonAI:', error);
            this.showCriticalError(error);
        }
    }

    async initializeComponents() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Initialize components in order
            await this.initializeCore();
            await this.initializeUI();
            await this.initializeFeatures();
            
            // Final setup
            this.setupGlobalEvents();
            this.setupKeyboardShortcuts();
            this.checkBrowserSupport();
            
            // Hide loading state
            this.hideLoadingState();
            
            this.isInitialized = true;
            console.log('✅ PythonAI IDE initialized successfully!');
            
            // Trigger initialization complete event
            this.triggerEvent('initialized');
            
        } catch (error) {
            console.error('Component initialization failed:', error);
            this.showCriticalError(error);
        }
    }

    async initializeCore() {
        console.log('📦 Initializing core components...');
        
        // Core components should already be initialized by their respective files
        this.components.api = window.api;
        this.components.auth = window.authManager;
        this.components.config = window.CONFIG;
        
        // Verify core components
        if (!this.components.api) throw new Error('API module not loaded');
        if (!this.components.auth) throw new Error('Auth module not loaded');
        if (!this.components.config) throw new Error('Config not loaded');
    }

    async initializeUI() {
        console.log('🎨 Initializing UI components...');
        
        // UI components should already be initialized
        this.components.editor = window.editor;
        this.components.projectManager = window.projectManager;
        this.components.aiAssistant = window.aiAssistant;
        this.components.codeExecutor = window.codeExecutor;
        
        // Setup UI interactions
        this.setupSidebarTabs();
        this.setupPanelResizing();
        this.setupResponsiveLayout();
    }

    async initializeFeatures() {
        console.log('⚡ Initializing features...');
        
        // Initialize tutorials
        await this.loadTutorials();
        
        // Initialize examples
        this.loadExamples();
        
        // Setup welcome flow for new users
        this.setupWelcomeFlow();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
    }

    setupSidebarTabs() {
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active tab
                sidebarTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                const tabName = tab.dataset.tab;
                const tabContents = document.querySelectorAll('.tab-content');
                
                tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `${tabName}-tab`);
                });
            });
        });
    }

    setupPanelResizing() {
        // Add resize handles and functionality
        this.makeResizable('.sidebar', 'width', 200, 400);
        this.makeResizable('.ai-panel', 'width', 250, 500);
        this.makeResizable('.bottom-panel', 'height', 150, 400);
    }

    makeResizable(selector, dimension, min, max) {
        const element = document.querySelector(selector);
        if (!element) return;

        const resizeHandle = document.createElement('div');
        resizeHandle.className = `resize-handle ${dimension}`;
        
        let isResizing = false;
        let startPos = 0;
        let startSize = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startPos = dimension === 'width' ? e.clientX : e.clientY;
            startSize = dimension === 'width' ? element.offsetWidth : element.offsetHeight;
            
            document.addEventListener('mousemove', handleResize);
            document.addEventListener('mouseup', stopResize);
            document.body.style.cursor = dimension === 'width' ? 'col-resize' : 'row-resize';
        });

        const handleResize = (e) => {
            if (!isResizing) return;
            
            const currentPos = dimension === 'width' ? e.clientX : e.clientY;
            const diff = currentPos - startPos;
            const newSize = Math.max(min, Math.min(max, startSize + diff));
            
            element.style[dimension] = `${newSize}px`;
        };

        const stopResize = () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', handleResize);
            document.removeEventListener('mouseup', stopResize);
        };

        element.appendChild(resizeHandle);
    }

    setupResponsiveLayout() {
        const handleResize = () => {
            const width = window.innerWidth;
            const ideContainer = document.querySelector('.ide-container');
            
            if (width < 768) {
                ideContainer.classList.add('mobile');
            } else {
                ideContainer.classList.remove('mobile');
            }
            
            if (width < 1200) {
                ideContainer.classList.add('tablet');
            } else {
                ideContainer.classList.remove('tablet');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }

    async loadTutorials() {
        try {
            const tutorials = await this.components.api.getTutorials();
            this.renderTutorials(tutorials || []);
        } catch (error) {
            console.error('Failed to load tutorials:', error);
            this.renderDefaultTutorials();
        }
    }

    renderTutorials(tutorials) {
        const tutorialList = document.getElementById('tutorialList');
        if (!tutorialList) return;

        if (tutorials.length === 0) {
            this.renderDefaultTutorials();
            return;
        }

        const tutorialsHTML = tutorials.map(tutorial => `
            <div class="tutorial-item" 
                 data-tutorial-id="${tutorial.id}"
                 data-level="${tutorial.difficulty_level}"
                 onclick="pythonAI.openTutorial('${tutorial.id}')">
                <div class="tutorial-info">
                    <h4>${tutorial.title}</h4>
                    <p>${tutorial.description}</p>
                    <span class="difficulty ${tutorial.difficulty_level}">
                        ${tutorial.difficulty_level}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>
        `).join('');

        tutorialList.innerHTML = tutorialsHTML;
    }

    renderDefaultTutorials() {
        const tutorialList = document.getElementById('tutorialList');
        if (!tutorialList) return;

        const defaultTutorials = [
            {
                title: 'Python Basics',
                description: 'Learn variables, loops, and functions',
                difficulty: 'beginner',
                progress: 0
            },
            {
                title: 'Data Science Basics', 
                description: 'Introduction to pandas and numpy',
                difficulty: 'intermediate',
                progress: 0
            },
            {
                title: 'Machine Learning',
                description: 'Build your first AI model',
                difficulty: 'advanced',
                progress: 0
            }
        ];

        const tutorialsHTML = defaultTutorials.map((tutorial, index) => `
            <div class="tutorial-item" 
                 data-level="${tutorial.difficulty}"
                 onclick="pythonAI.openTutorial('default_${index}')">
                <div class="tutorial-info">
                    <h4>${tutorial.title}</h4>
                    <p>${tutorial.description}</p>
                    <span class="difficulty ${tutorial.difficulty}">
                        ${tutorial.difficulty}
                    </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${tutorial.progress}%"></div>
                </div>
            </div>
        `).join('');

        tutorialList.innerHTML = tutorialsHTML;
    }

    loadExamples() {
        const exampleList = document.getElementById('exampleList');
        if (!exampleList) return;

        const examples = Object.keys(CONFIG.EXAMPLE_PROJECTS).map(key => ({
            key,
            ...CONFIG.EXAMPLE_PROJECTS[key]
        }));

        const examplesHTML = examples.map(example => `
            <div class="example-item" onclick="pythonAI.loadExample('${example.key}')">
                <i class="fas fa-${this.getExampleIcon(example.key)}"></i>
                <div class="example-info">
                    <h4>${example.title}</h4>
                    <p>${example.description}</p>
                </div>
            </div>
        `).join('');

        exampleList.innerHTML = examplesHTML;
    }

    getExampleIcon(exampleKey) {
        const icons = {
            'simple-chatbot': 'robot',
            'data-visualization': 'chart-bar', 
            'neural-network': 'brain'
        };
        return icons[exampleKey] || 'code';
    }

    setupWelcomeFlow() {
        // Show welcome message for first-time users
        const hasVisited = localStorage.getItem('pythonai_visited');
        
        if (!hasVisited) {
            setTimeout(() => {
                this.showWelcomeDialog();
                localStorage.setItem('pythonai_visited', 'true');
            }, 1000);
        }
    }

    showWelcomeDialog() {
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'modal active';
        welcomeModal.innerHTML = `
            <div class="modal-content welcome-modal">
                <div class="welcome-header">
                    <div class="welcome-icon">
                        <i class="fab fa-python"></i>
                    </div>
                    <h1>Welcome to PythonAI! 🎉</h1>
                    <p>Your AI-powered Python learning environment</p>
                </div>
                <div class="welcome-body">
                    <div class="welcome-features">
                        <div class="feature">
                            <i class="fas fa-code"></i>
                            <h3>Code Editor</h3>
                            <p>Write Python with syntax highlighting and auto-completion</p>
                        </div>
                        <div class="feature">
                            <i class="fas fa-robot"></i>
                            <h3>AI Assistant</h3>
                            <p>Get help, explanations, and code improvements from Gemini AI</p>
                        </div>
                        <div class="feature">
                            <i class="fas fa-play"></i>
                            <h3>Code Execution</h3>
                            <p>Run your Python code and see results instantly</p>
                        </div>
                        <div class="feature">
                            <i class="fas fa-graduation-cap"></i>
                            <h3>Tutorials</h3>
                            <p>Learn Python and AI with guided, kid-friendly lessons</p>
                        </div>
                    </div>
                    <div class="welcome-actions">
                        <button class="btn primary" onclick="pythonAI.startTutorial()">
                            Start Learning
                        </button>
                        <button class="btn" onclick="pythonAI.closeWelcome()">
                            Start Coding
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(welcomeModal);
        this.welcomeModal = welcomeModal;
    }

    closeWelcome() {
        if (this.welcomeModal) {
            this.welcomeModal.remove();
            this.welcomeModal = null;
        }
    }

    startTutorial() {
        this.closeWelcome();
        // Switch to tutorials tab
        const tutorialTab = document.querySelector('[data-tab="tutorials"]');
        if (tutorialTab) {
            tutorialTab.click();
        }
        // Open first tutorial
        this.openTutorial('default_0');
    }

    openTutorial(tutorialId) {
        // Implementation for opening tutorial
        console.log(`Opening tutorial: ${tutorialId}`);
        
        if (this.components.aiAssistant) {
            this.components.aiAssistant.addMessage(
                `Great choice! Let's start with this tutorial. I'll guide you through each step. 📚`,
                'ai'
            );
        }
    }

    loadExample(exampleKey) {
        if (this.components.projectManager) {
            this.components.projectManager.loadExampleProject(exampleKey);
        }
    }

    setupGlobalEvents() {
        // Handle authentication events
        document.addEventListener('auth', (e) => {
            this.handleAuthEvent(e.detail);
        });

        // Handle project events
        document.addEventListener('projectChanged', (e) => {
            this.handleProjectChange(e.detail);
        });

        // Handle errors
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S - Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.components.projectManager) {
                    this.components.projectManager.saveCurrentProject();
                }
            }
            
            // Ctrl/Cmd + R - Run code  
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                if (this.components.codeExecutor) {
                    this.components.codeExecutor.runCode();
                }
            }
            
            // Ctrl/Cmd + N - New project
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (this.components.projectManager) {
                    this.components.projectManager.newProject();
                }
            }
            
            // F1 - Show help
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
    }

    handleAuthEvent(detail) {
        const { type, user } = detail;
        
        switch (type) {
            case 'login':
            case 'autoLogin':
                console.log(`User logged in: ${user.email}`);
                this.onUserLogin(user);
                break;
                
            case 'logout':
                console.log('User logged out');
                this.onUserLogout();
                break;
        }
    }

    onUserLogin(user) {
        // Update UI for logged-in state
        this.showNotification(`Welcome ${user.name || user.email}! 👋`, 'success');
    }

    onUserLogout() {
        // Update UI for logged-out state
        this.showNotification('Logged out successfully', 'info');
    }

    handleProjectChange(project) {
        console.log(`Project changed: ${project.title}`);
        this.triggerEvent('projectChanged', project);
    }

    checkBrowserSupport() {
        const unsupported = [];
        
        // Check for required features
        if (!window.fetch) unsupported.push('Fetch API');
        if (!window.localStorage) unsupported.push('Local Storage');
        if (!window.WebSocket) unsupported.push('WebSocket');
        if (!window.Promise) unsupported.push('Promises');
        
        if (unsupported.length > 0) {
            this.showBrowserWarning(unsupported);
        }
    }

    showBrowserWarning(unsupported) {
        const warning = `
            <div class="browser-warning">
                <h3>⚠️ Browser Compatibility</h3>
                <p>Some features may not work properly. Missing support for:</p>
                <ul>
                    ${unsupported.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <p>Please use a modern browser like Chrome, Firefox, or Safari.</p>
            </div>
        `;
        
        this.showNotification(warning, 'warning', 10000);
    }

    initializePerformanceMonitoring() {
        // Simple performance monitoring
        let loadTime = performance.now();
        
        window.addEventListener('load', () => {
            loadTime = performance.now() - loadTime;
            console.log(`⚡ App loaded in ${loadTime.toFixed(2)}ms`);
        });

        // Monitor memory usage (if available)
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('⚠️ High memory usage detected');
                }
            }, 30000); // Check every 30 seconds
        }
    }

    showLoadingState() {
        const loading = document.createElement('div');
        loading.id = 'app-loading';
        loading.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <h2>Loading PythonAI...</h2>
                <p>Initializing your coding environment</p>
            </div>
        `;
        
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--bg-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        document.body.appendChild(loading);
    }

    hideLoadingState() {
        const loading = document.getElementById('app-loading');
        if (loading) {
            loading.remove();
        }
    }

    showCriticalError(error) {
        const errorModal = document.createElement('div');
        errorModal.className = 'modal active';
        errorModal.innerHTML = `
            <div class="modal-content error-modal">
                <div class="modal-header">
                    <h2>❌ Initialization Error</h2>
                </div>
                <div class="modal-body">
                    <p>Sorry, PythonAI failed to initialize properly.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error.message}\n${error.stack}</pre>
                    </details>
                    <div class="error-actions">
                        <button onclick="location.reload()" class="btn primary">
                            Reload Page
                        </button>
                        <button onclick="pythonAI.reportError('${error.message}')" class="btn">
                            Report Issue
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorModal);
    }

    showHelp() {
        if (this.components.aiAssistant) {
            this.components.aiAssistant.addMessage(
                "Need help? I'm here to assist! 🤖\n\nKeyboard shortcuts:\n• Ctrl/Cmd + S - Save project\n• Ctrl/Cmd + R - Run code\n• Ctrl/Cmd + N - New project\n• F1 - Show this help\n\nJust ask me anything about Python or coding!",
                'ai'
            );
        }
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        });
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (this.components.editor && this.components.editor.showNotification) {
            this.components.editor.showNotification(message, type);
        } else {
            console.log(`Notification (${type}):`, message);
        }
    }

    reportError(message) {
        console.error('User reported error:', message);
        alert('Error reported. Thank you for your feedback!');
    }

    triggerEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    // Public API methods
    getComponent(name) {
        return this.components[name];
    }

    isReady() {
        return this.isInitialized;
    }

    getVersion() {
        return '1.0.0';
    }
}

// Add welcome modal styles
const welcomeStyles = `
.welcome-modal {
    max-width: 600px;
    text-align: center;
}

.welcome-header {
    padding: 24px;
    border-bottom: 1px solid var(--border-color);
}

.welcome-icon {
    font-size: 48px;
    color: var(--python-color);
    margin-bottom: 16px;
}

.welcome-header h1 {
    margin-bottom: 8px;
    color: var(--text-primary);
}

.welcome-header p {
    color: var(--text-secondary);
    font-size: 16px;
}

.welcome-features {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 32px;
}

.feature {
    text-align: center;
}

.feature i {
    font-size: 32px;
    color: var(--primary-color);
    margin-bottom: 12px;
}

.feature h3 {
    margin-bottom: 8px;
    color: var(--text-primary);
}

.feature p {
    color: var(--text-secondary);
    font-size: 14px;
}

.welcome-actions {
    padding: 0 32px 32px;
    display: flex;
    gap: 16px;
    justify-content: center;
}

.loading-container {
    text-align: center;
    color: var(--text-primary);
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 24px;
}

.error-modal pre {
    background: var(--bg-tertiary);
    padding: 12px;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
    text-align: left;
}

.error-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-top: 20px;
}

.resize-handle {
    position: absolute;
    background: transparent;
    transition: background-color 0.2s ease;
}

.resize-handle:hover {
    background: var(--primary-color);
}

.resize-handle.width {
    width: 4px;
    height: 100%;
    right: -2px;
    top: 0;
    cursor: col-resize;
}

.resize-handle.height {
    width: 100%;
    height: 4px;
    bottom: -2px;
    left: 0;
    cursor: row-resize;
}

@media (max-width: 768px) {
    .welcome-features {
        grid-template-columns: 1fr;
        gap: 16px;
    }
    
    .welcome-actions {
        flex-direction: column;
    }
}
`;

// Add styles to document
const welcomeStyleSheet = document.createElement('style');
welcomeStyleSheet.textContent = welcomeStyles;
document.head.appendChild(welcomeStyleSheet);

// Initialize the application
const pythonAI = new PythonAI();

// Make it globally available
window.pythonAI = pythonAI;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PythonAI;
}