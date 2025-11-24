// API Configuration
// For local development, use localhost. For production, use the deployed backend URL
const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

window.API_BASE_URL = isLocal
  ? 'http://localhost:10000'
  : 'https://efootball-backend-f8ws.onrender.com';

// Debug logging
console.log('🔧 Config loaded:', {
  hostname: hostname,
  isLocal: isLocal,
  apiBaseUrl: window.API_BASE_URL,
  fullUrl: window.location.href
});

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
