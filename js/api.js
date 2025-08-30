// API module for communicating with InsForge backend
class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_TOKEN, token);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_TOKEN);
        }
    }

    // Get authentication headers
    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            if (response.status === 204) {
                return null; // No content
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        return this.request('/auth/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/auth/sessions', {
            method: 'POST', 
            body: JSON.stringify(credentials)
        });
    }

    async getCurrentUser() {
        return this.request('/auth/sessions/current');
    }

    // Project methods
    async getProjects(userId) {
        return this.request(`/database/records/projects?user_id=eq.${userId}&order=updated_at.desc`);
    }

    async createProject(projectData) {
        return this.request('/database/records/projects', {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([projectData])
        });
    }

    async updateProject(projectId, updates) {
        return this.request(`/database/records/projects?id=eq.${projectId}`, {
            method: 'PATCH',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updates)
        });
    }

    async deleteProject(projectId) {
        return this.request(`/database/records/projects?id=eq.${projectId}`, {
            method: 'DELETE',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            }
        });
    }

    // Code execution methods
    async executeCode(codeData) {
        return this.request('/database/records/code_executions', {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([codeData])
        });
    }

    async getExecutionHistory(projectId, limit = 10) {
        return this.request(`/database/records/code_executions?project_id=eq.${projectId}&order=created_at.desc&limit=${limit}`);
    }

    // AI conversation methods
    async saveConversation(conversationData) {
        return this.request('/database/records/ai_conversations', {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([conversationData])
        });
    }

    async getConversations(projectId, limit = 50) {
        const endpoint = projectId 
            ? `/database/records/ai_conversations?project_id=eq.${projectId}&order=created_at.desc&limit=${limit}`
            : `/database/records/ai_conversations?order=created_at.desc&limit=${limit}`;
        return this.request(endpoint);
    }

    // Tutorial methods
    async getTutorials() {
        return this.request('/database/records/tutorials?is_published=eq.true&order=order_index.asc');
    }

    async getTutorial(tutorialId) {
        return this.request(`/database/records/tutorials?id=eq.${tutorialId}`);
    }

    async getUserProgress(userId) {
        return this.request(`/database/records/learning_progress?user_id=eq.${userId}`);
    }

    async updateProgress(progressData) {
        return this.request('/database/records/learning_progress', {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([progressData])
        });
    }

    // User profile methods
    async getUserProfile(userId) {
        return this.request(`/database/records/user_profiles?user_id=eq.${userId}`);
    }

    async createUserProfile(profileData) {
        return this.request('/database/records/user_profiles', {
            method: 'POST',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify([profileData])
        });
    }

    async updateUserProfile(userId, updates) {
        return this.request(`/database/records/user_profiles?user_id=eq.${userId}`, {
            method: 'PATCH',
            headers: {
                ...this.getAuthHeaders(),
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(updates)
        });
    }

    // Storage methods
    async uploadFile(bucketName, file, fileName = null) {
        const formData = new FormData();
        formData.append('file', file);

        const endpoint = fileName 
            ? `/storage/buckets/${bucketName}/objects/${fileName}`
            : `/storage/buckets/${bucketName}/objects`;

        const method = fileName ? 'PUT' : 'POST';

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    }

    async deleteFile(bucketName, fileName) {
        return this.request(`/storage/buckets/${bucketName}/objects/${fileName}`, {
            method: 'DELETE'
        });
    }

    getFileURL(bucketName, fileName) {
        return `${this.baseURL}/storage/buckets/${bucketName}/objects/${fileName}`;
    }

    // Gemini AI integration (if you have a backend endpoint for this)
    async chatWithAI(message, context = null) {
        // This would typically go through your backend to communicate with Gemini
        // For now, we'll simulate it or you could implement direct client-side integration
        try {
            // Simulate AI response for now - replace with actual Gemini integration
            const response = await this.simulateAIResponse(message, context);
            return response;
        } catch (error) {
            console.error('AI chat failed:', error);
            throw error;
        }
    }

    // Simulate AI response (replace with actual Gemini integration)
    async simulateAIResponse(message, context) {
        // This is a placeholder - implement actual Gemini AI integration
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        
        const responses = {
            'hello': 'Hi there! I\'m your AI programming assistant. How can I help you with Python today?',
            'help': 'I can help you with:\n• Understanding Python concepts\n• Debugging your code\n• Suggesting improvements\n• Explaining errors\n• Teaching AI and machine learning\n\nWhat would you like to learn?',
            'explain': 'I\'d be happy to explain! Could you share the specific code or concept you\'d like me to explain?',
            'bug': 'Let\'s debug this together! Please share your code and I\'ll help you find and fix any issues.',
            'improve': 'Great question! I can suggest ways to make your code better. Share your code and I\'ll provide specific improvements.'
        };
        
        const lowerMessage = message.toLowerCase();
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return `That's an interesting question! I'm here to help with Python programming and AI concepts. Could you be more specific about what you'd like to learn or work on?`;
    }

    // Health check
    async healthCheck() {
        try {
            // Simple request to check if the API is responsive
            const response = await fetch(`${this.baseURL}/database/records/_user?limit=1`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global API instance
const api = new API();

// Make API available globally
window.api = api;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}