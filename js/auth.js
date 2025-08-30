// Authentication module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.modal = null;
        this.isAuthenticated = false;
        
        this.init();
    }

    init() {
        this.setupModal();
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupModal() {
        this.modal = document.getElementById('loginModal');
        this.authForm = document.getElementById('authForm');
        this.authTabs = document.querySelectorAll('.auth-tab');
        this.modalClose = this.modal.querySelector('.modal-close');
        
        // Tab switching
        this.authTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchAuthTab(tab));
        });
        
        // Close modal
        this.modalClose.addEventListener('click', () => this.hideModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
        
        // Form submission
        this.authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
    }

    setupEventListeners() {
        // User button click
        const userButton = document.getElementById('userButton');
        if (userButton) {
            userButton.addEventListener('click', () => {
                if (this.isAuthenticated) {
                    this.showUserMenu();
                } else {
                    this.showModal();
                }
            });
        }
    }

    switchAuthTab(activeTab) {
        // Update tab states
        this.authTabs.forEach(tab => tab.classList.remove('active'));
        activeTab.classList.add('active');
        
        const tabType = activeTab.dataset.tab;
        const nameGroup = document.getElementById('nameGroup');
        const submitButton = this.authForm.querySelector('button[type="submit"]');
        
        if (tabType === 'register') {
            nameGroup.style.display = 'block';
            nameGroup.querySelector('input').required = true;
            submitButton.textContent = 'Register';
        } else {
            nameGroup.style.display = 'none';
            nameGroup.querySelector('input').required = false;
            submitButton.textContent = 'Login';
        }
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            submitButton.textContent = 'Loading...';
            submitButton.disabled = true;
            
            const formData = new FormData(this.authForm);
            const email = formData.get('email') || document.getElementById('email').value;
            const password = formData.get('password') || document.getElementById('password').value;
            const name = formData.get('name') || document.getElementById('name').value;
            
            const activeTab = document.querySelector('.auth-tab.active').dataset.tab;
            
            if (activeTab === 'register') {
                await this.register({ email, password, name });
            } else {
                await this.login({ email, password });
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    async register(userData) {
        try {
            const result = await api.register(userData);
            
            if (result && result.accessToken) {
                await this.handleAuthSuccess(result);
                this.showSuccess('Account created successfully! Welcome to PythonAI!');
            } else {
                throw new Error('Registration failed - no token received');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            throw new Error(error.message || 'Registration failed. Please try again.');
        }
    }

    async login(credentials) {
        try {
            const result = await api.login(credentials);
            
            if (result && result.accessToken) {
                await this.handleAuthSuccess(result);
                this.showSuccess(`Welcome back, ${result.user.name || result.user.email}!`);
            } else {
                throw new Error('Login failed - no token received');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error(error.message || 'Invalid email or password. Please try again.');
        }
    }

    async handleAuthSuccess(authResult) {
        const { accessToken, user } = authResult;
        
        // Store auth data
        api.setToken(accessToken);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, user.id);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Update UI
        this.updateUserDisplay(user);
        this.hideModal();
        
        // Initialize or create user profile
        await this.initializeUserProfile(user);
        
        // Load user projects
        if (window.projectManager) {
            await window.projectManager.loadUserProjects();
        }
        
        // Trigger authentication event
        this.triggerAuthEvent('login', user);
    }

    async initializeUserProfile(user) {
        try {
            // Try to get existing profile
            let profile = await api.getUserProfile(user.id);
            
            if (!profile || profile.length === 0) {
                // Create new profile if doesn't exist
                const profileData = {
                    user_id: user.id,
                    age: null,
                    learning_level: 'beginner',
                    preferred_topics: ['python-basics'],
                    total_projects: 0,
                    total_runs: 0,
                    streak_days: 0,
                    last_active: new Date().toISOString()
                };
                
                profile = await api.createUserProfile(profileData);
            } else {
                // Update last active time
                await api.updateUserProfile(user.id, {
                    last_active: new Date().toISOString()
                });
            }
            
            this.currentUser.profile = Array.isArray(profile) ? profile[0] : profile;
        } catch (error) {
            console.error('Failed to initialize user profile:', error);
        }
    }

    updateUserDisplay(user) {
        const userNameElement = document.getElementById('userName');
        const userButton = document.getElementById('userButton');
        
        if (userNameElement) {
            userNameElement.textContent = user.name || user.email.split('@')[0];
        }
        
        if (userButton) {
            userButton.title = `Logged in as ${user.email}`;
        }
    }

    async logout() {
        try {
            // Clear local storage
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
            
            // Reset API token
            api.setToken(null);
            
            // Reset state
            this.currentUser = null;
            this.isAuthenticated = false;
            
            // Update UI
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = 'Guest';
            }
            
            // Clear projects
            if (window.projectManager) {
                window.projectManager.clearProjects();
            }
            
            // Show success message
            this.showSuccess('Logged out successfully!');
            
            // Trigger authentication event
            this.triggerAuthEvent('logout', null);
            
        } catch (error) {
            console.error('Logout failed:', error);
            this.showError('Logout failed. Please try again.');
        }
    }

    async checkExistingAuth() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
        const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
        
        if (token && userData) {
            try {
                api.setToken(token);
                
                // Verify token is still valid
                const currentUser = await api.getCurrentUser();
                
                if (currentUser && currentUser.user) {
                    this.currentUser = JSON.parse(userData);
                    this.isAuthenticated = true;
                    this.updateUserDisplay(this.currentUser);
                    
                    // Initialize user profile
                    await this.initializeUserProfile(this.currentUser);
                    
                    // Load user projects
                    if (window.projectManager) {
                        await window.projectManager.loadUserProjects();
                    }
                    
                    this.triggerAuthEvent('autoLogin', this.currentUser);
                } else {
                    // Token is invalid, clear it
                    this.clearInvalidAuth();
                }
            } catch (error) {
                console.error('Token validation failed:', error);
                this.clearInvalidAuth();
            }
        }
    }

    clearInvalidAuth() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
        api.setToken(null);
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    showModal() {
        this.modal.classList.add('active');
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.focus();
        }
    }

    hideModal() {
        this.modal.classList.remove('active');
        this.authForm.reset();
        this.clearMessages();
    }

    showUserMenu() {
        // Create a simple context menu for logged-in users
        const userButton = document.getElementById('userButton');
        const existingMenu = document.querySelector('.user-context-menu');
        
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.className = 'user-context-menu';
        menu.innerHTML = `
            <div class="user-menu-item">
                <i class="fas fa-user"></i>
                <span>${this.currentUser.email}</span>
            </div>
            <div class="user-menu-divider"></div>
            <div class="user-menu-item" onclick="authManager.logout()">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </div>
        `;
        
        // Position menu
        const rect = userButton.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        menu.style.background = 'var(--bg-secondary)';
        menu.style.border = '1px solid var(--border-color)';
        menu.style.borderRadius = '6px';
        menu.style.padding = '8px';
        menu.style.zIndex = '1000';
        menu.style.minWidth = '200px';
        
        document.body.appendChild(menu);
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !userButton.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        this.clearMessages();
        
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message ${type}`;
        messageEl.textContent = message;
        
        const modalBody = this.modal.querySelector('.modal-body');
        modalBody.insertBefore(messageEl, modalBody.firstChild);
        
        // Auto-remove success messages
        if (type === 'success') {
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        }
    }

    clearMessages() {
        const messages = this.modal.querySelectorAll('.auth-message');
        messages.forEach(msg => msg.remove());
    }

    triggerAuthEvent(type, user) {
        const event = new CustomEvent('auth', {
            detail: { type, user }
        });
        document.dispatchEvent(event);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }

    requireAuth(callback) {
        if (this.isAuthenticated) {
            callback();
        } else {
            this.showModal();
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Make authManager available globally
window.authManager = authManager;

// Add CSS for user menu
const userMenuStyles = `
.user-context-menu {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.user-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;
    color: var(--text-primary);
    transition: background-color 0.2s ease;
}

.user-menu-item:hover {
    background: var(--bg-tertiary);
}

.user-menu-divider {
    height: 1px;
    background: var(--border-color);
    margin: 4px 0;
}

.auth-message {
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
}

.auth-message.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.auth-message.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.2);
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = userMenuStyles;
document.head.appendChild(styleSheet);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}