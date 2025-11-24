class Preloader {
    constructor() {
        this.preloader = null;
        this.init();
    }

    init() {
        // Create preloader HTML
        this.createPreloaderHTML();

        // Show preloader immediately
        this.show();

        // Hide preloader when page is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.hideOnLoad();
            });
        } else {
            this.hideOnLoad();
        }

        // Also hide on window load to ensure all resources are loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.hide();
            }, 500); // Small delay to ensure smooth transition
        });
    }

    createPreloaderHTML() {
        // Create preloader container
        const preloader = document.createElement('div');
        preloader.className = 'preloader';
        preloader.id = 'preloader';

        // Get the logo path from existing elements or use default
        const existingLogo = document.querySelector('.site-logo, .hero-logo-img');
        const logoSrc = existingLogo ? existingLogo.src : 'assets/images/ChatGPT%20Image%20Nov%2012,%202025,%2011_55_36%20PM.png';

        preloader.innerHTML = `
            <div class="preloader-content">
                <div class="preloader-logo">
                    <img src="${logoSrc}" alt="TONA KIKWETU Logo" onerror="this.style.display='none'">
                </div>
                <h1 class="preloader-title">TONA KIKWETU</h1>
                <p class="preloader-subtitle">Loading your gaming experience...</p>
                <div class="football-loader">
                    <i class="fas fa-futbol football-icon"></i>
                    <i class="fas fa-futbol football-icon"></i>
                    <i class="fas fa-futbol football-icon"></i>
                    <i class="fas fa-futbol football-icon"></i>
                    <i class="fas fa-futbol football-icon"></i>
                </div>
            </div>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(preloader, document.body.firstChild);
        this.preloader = preloader;
    }

    show() {
        if (this.preloader) {
            this.preloader.classList.remove('hidden');
        }
    }

    hide() {
        if (this.preloader) {
            this.preloader.classList.add('hidden');

            // Remove from DOM after animation completes
            setTimeout(() => {
                if (this.preloader && this.preloader.parentNode) {
                    this.preloader.parentNode.removeChild(this.preloader);
                }
            }, 500);
        }
    }

    hideOnLoad() {
        // Check if critical resources are loaded
        const checkResources = () => {
            // Check if main scripts are loaded
            const scripts = [
                'js/auth.js',
                'js/navigation.js',
                'js/main.js'
            ];

            let loadedScripts = 0;
            scripts.forEach(scriptSrc => {
                const script = document.querySelector(`script[src="${scriptSrc}"]`);
                if (script) {
                    loadedScripts++;
                }
            });

            // If most scripts are loaded, hide preloader
            if (loadedScripts >= scripts.length - 1) {
                this.hide();
            } else {
                // Check again in a short time
                setTimeout(checkResources, 100);
            }
        };

        checkResources();
    }

    // Manual control methods for special cases
    forceHide() {
        this.hide();
    }

    forceShow() {
        this.show();
    }
}

// Auto-initialize preloader when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize preloader
    window.preloader = new Preloader();

    // Add theme support
    const updateTheme = () => {
        const body = document.body;
        const preloader = document.getElementById('preloader');

        if (preloader) {
            if (body.classList.contains('dark-theme')) {
                preloader.classList.add('dark-theme');
                preloader.classList.remove('light-theme');
            } else if (body.classList.contains('light-theme')) {
                preloader.classList.add('light-theme');
                preloader.classList.remove('dark-theme');
            }
        }
    };

    // Update theme initially
    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
});

// Export for potential manual control
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Preloader;
}