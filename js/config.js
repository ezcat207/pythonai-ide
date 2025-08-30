// Configuration for PythonAI IDE
const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://vueziy9i.us-east.insforge.app/api',
    
    // Storage buckets
    BUCKETS: {
        PROJECT_FILES: 'project-files',
        TUTORIAL_ASSETS: 'tutorial-assets', 
        USER_AVATARS: 'user-avatars'
    },
    
    // Editor settings
    EDITOR: {
        theme: 'vs-dark',
        language: 'python',
        fontSize: 14,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        minimap: {
            enabled: true,
            side: 'right'
        },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on'
    },
    
    // Gemini AI Configuration
    AI: {
        model: 'gemini-1.5-flash',
        maxTokens: 1000,
        temperature: 0.7,
        systemPrompt: `You are a helpful Python programming tutor for kids learning AI and programming. 
        Your responses should be:
        - Clear and age-appropriate
        - Educational and encouraging  
        - Include practical examples
        - Help debug code issues
        - Suggest improvements
        - Explain concepts step-by-step
        
        Always be patient, positive, and make learning fun!`,
    },
    
    // Code execution settings
    EXECUTION: {
        timeout: 30000, // 30 seconds
        maxOutputLength: 10000,
        allowedModules: [
            'math', 'random', 'datetime', 'json', 'string',
            'numpy', 'pandas', 'matplotlib', 'seaborn',
            'sklearn', 'tensorflow', 'torch', 'PIL'
        ]
    },
    
    // Tutorial configuration
    TUTORIALS: {
        categories: [
            'Python Basics',
            'Data Structures', 
            'Functions',
            'Object-Oriented Programming',
            'Data Science',
            'Machine Learning',
            'Computer Vision',
            'Natural Language Processing'
        ],
        difficulties: {
            'beginner': { color: '#10b981', label: 'Beginner' },
            'intermediate': { color: '#f59e0b', label: 'Intermediate' },  
            'advanced': { color: '#ef4444', label: 'Advanced' }
        }
    },
    
    // Default project template
    DEFAULT_PROJECT: {
        title: 'my_first_ai_program.py',
        description: 'Interactive AI learning program',
        code: `# 🐍🤖 Welcome to PythonAI - Your AI Programming Journey Starts Here!
# This interactive program teaches you Python basics step by step.
# Click "Run" to see the magic happen!

print("🤖 Hello! I'm your AI programming assistant!")
print("=" * 50)

# Let's start with variables - like labeled boxes for storing data
your_name = "Future AI Developer"  # Try changing this to your real name!
age = 12  # Change this to your age
favorite_subject = "AI and Machine Learning"

print(f"👋 Hi {your_name}!")
print(f"🎂 You are {age} years old")
print(f"📚 You love: {favorite_subject}")
print()

# Now let's do some AI-style thinking with conditional logic
print("🧠 Let me analyze your programming potential...")

if age < 10:
    programming_level = "Super Young Genius! 🌟"
    advice = "Start with simple print statements and math!"
elif age < 15:
    programming_level = "Perfect Age for AI! 🚀"
    advice = "You can master loops, functions, and even build chatbots!"
else:
    programming_level = "Advanced Learner! 💯"
    advice = "Ready for machine learning and neural networks!"

print(f"📊 Level: {programming_level}")
print(f"💡 My advice: {advice}")
print()

# Let's simulate some AI behavior with loops and lists
print("🤖 Simulating AI thought process...")
ai_topics = ["Machine Learning", "Neural Networks", "Computer Vision", "Natural Language Processing"]

print("🧠 AI Topics I can teach you:")
for i, topic in enumerate(ai_topics, 1):
    print(f"  {i}. {topic}")

# Simple AI-like calculation
learning_score = age * 10 + len(your_name) * 5
print()
print(f"📈 Your AI Learning Score: {learning_score} points!")

if learning_score > 200:
    print("🏆 Wow! You're destined to be an AI expert!")
elif learning_score > 150:
    print("⭐ Great potential! Keep learning!")
else:
    print("🌱 Every expert was once a beginner!")

print()
print("🎯 Ready to build your first chatbot? Ask the AI assistant!")
print("💬 Try changing the variables above and run again!")`,
        language: 'python',
        tags: ['beginner', 'interactive', 'ai'],
        difficulty_level: 'beginner'
    },
    
    // Example projects
    EXAMPLE_PROJECTS: {
        'simple-chatbot': {
            title: 'Simple Chatbot',
            description: 'Create a basic AI chatbot',
            code: `# Simple AI Chatbot
import random

# Chatbot responses
responses = {
    'hello': ['Hi there!', 'Hello!', 'Hey! How can I help?'],
    'how are you': ['I\\'m doing great!', 'All good! Thanks for asking!'],
    'what is ai': ['AI stands for Artificial Intelligence!', 
                   'AI helps computers think and learn like humans!'],
    'bye': ['Goodbye!', 'See you later!', 'Bye! Come back soon!']
}

def chatbot_response(user_input):
    user_input = user_input.lower()
    
    for key in responses:
        if key in user_input:
            return random.choice(responses[key])
    
    return "I don't understand. Can you ask something else?"

print("🤖 Chatbot: Hello! I'm your AI friend!")
print("Type 'bye' to exit")

while True:
    user_input = input("You: ")
    
    if 'bye' in user_input.lower():
        print("🤖 Chatbot: Goodbye! Have a great day!")
        break
    
    response = chatbot_response(user_input)
    print(f"🤖 Chatbot: {response}")`,
            tags: ['ai', 'chatbot', 'interactive'],
            difficulty_level: 'intermediate'
        },
        
        'data-visualization': {
            title: 'Data Visualization',
            description: 'Create charts with Python',
            code: `# Data Visualization with Python
import matplotlib.pyplot as plt
import numpy as np

# Sample data
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
temperatures = [32, 35, 42, 55, 65, 75]
rainfall = [2.5, 3.1, 2.8, 4.2, 3.9, 2.1]

# Create figure with subplots
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

# Temperature bar chart
ax1.bar(months, temperatures, color='orange', alpha=0.7)
ax1.set_title('Average Temperature by Month')
ax1.set_ylabel('Temperature (°F)')
ax1.grid(True, alpha=0.3)

# Rainfall line chart
ax2.plot(months, rainfall, marker='o', color='blue', linewidth=2)
ax2.fill_between(months, rainfall, alpha=0.3, color='blue')
ax2.set_title('Monthly Rainfall')
ax2.set_ylabel('Inches')
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

print("Charts created successfully! 📊")`,
            tags: ['data-science', 'visualization', 'matplotlib'],
            difficulty_level: 'intermediate'
        },
        
        'neural-network': {
            title: 'Simple Neural Network',
            description: 'Basic deep learning example',
            code: `# Simple Neural Network for beginners
import numpy as np

class SimpleNeuralNetwork:
    def __init__(self):
        # Initialize random weights
        np.random.seed(42)
        self.weights = np.random.random((3, 1)) - 0.5
    
    def sigmoid(self, x):
        """Activation function"""
        return 1 / (1 + np.exp(-x))
    
    def sigmoid_derivative(self, x):
        """Derivative of sigmoid for backpropagation"""
        return x * (1 - x)
    
    def train(self, inputs, outputs, epochs=10000):
        """Train the neural network"""
        for _ in range(epochs):
            # Forward pass
            prediction = self.predict(inputs)
            
            # Calculate error
            error = outputs - prediction
            
            # Backpropagation
            adjustment = np.dot(inputs.T, error * self.sigmoid_derivative(prediction))
            self.weights += adjustment
    
    def predict(self, inputs):
        """Make predictions"""
        return self.sigmoid(np.dot(inputs, self.weights))

# Training data: AND gate
training_inputs = np.array([
    [0, 0, 1],  # Input 1, Input 2, Bias
    [1, 1, 1],
    [1, 0, 1], 
    [0, 1, 1]
])

training_outputs = np.array([[0, 1, 0, 0]]).T  # AND gate outputs

# Create and train network
neural_network = SimpleNeuralNetwork()

print("Random starting weights:")
print(neural_network.weights.T)

neural_network.train(training_inputs, training_outputs)

print("\\nWeights after training:")
print(neural_network.weights.T)

print("\\nTesting the trained network:")
test_inputs = np.array([[1, 1, 1], [0, 0, 1], [1, 0, 1]])
predictions = neural_network.predict(test_inputs)

for i, prediction in enumerate(predictions):
    print(f"Input: {test_inputs[i][:2]} -> Output: {prediction[0]:.4f}")

print("\\n🧠 Neural network trained successfully!")`,
            tags: ['ai', 'machine-learning', 'neural-networks'],
            difficulty_level: 'advanced'
        }
    },
    
    // Local storage keys
    STORAGE_KEYS: {
        USER_TOKEN: 'pythonai_user_token',
        USER_ID: 'pythonai_user_id',
        USER_DATA: 'pythonai_user_data',
        EDITOR_SETTINGS: 'pythonai_editor_settings',
        RECENT_PROJECTS: 'pythonai_recent_projects'
    },
    
    // UI settings
    UI: {
        sidebarWidth: 300,
        aiPanelWidth: 350,
        bottomPanelHeight: 250,
        autoSaveInterval: 30000, // 30 seconds
        maxRecentProjects: 10
    }
};

// Make CONFIG available globally
window.CONFIG = CONFIG;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}