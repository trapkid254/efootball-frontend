// API Configuration
window.API_BASE_URL = 'https://efootball-backend-f8ws.onrender.com'; // Your Render backend URL

// CORS configuration
const corsConfig = {
    credentials: true,
    origin: [
        'https://tonakikwetu.netlify.app',
        'http://localhost:3000' // For local development
    ]
};

// Export for Node.js environment if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL: window.API_BASE_URL,
        corsConfig
    };
}
