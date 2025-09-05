/**
 * Development Auto-Refresh System
 * Automatically refreshes the page when files change on the server
 */

class DevAutoRefresh {
    constructor(options = {}) {
        this.pollInterval = options.pollInterval || 1000; // Check every second
        this.enabled = options.enabled !== false; // Enabled by default
        this.lastModified = null;
        this.isPolling = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        
        this.init();
    }
    
    init() {
        // Only enable in development (when running on localhost)
        if (!this.isDevelopment()) {
            console.log('🔧 Auto-refresh disabled - not in development environment');
            return;
        }
        
        if (!this.enabled) {
            console.log('🔧 Auto-refresh disabled by configuration');
            return;
        }
        
        console.log('🔄 Auto-refresh enabled - watching for file changes...');
        this.addStatusIndicator();
        this.startPolling();
        
        // Add keyboard shortcut to manually refresh
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.forceRefresh();
            }
        });
    }
    
    isDevelopment() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.hostname === '0.0.0.0';
    }
    
    addStatusIndicator() {
        // Create a small status indicator (completely hidden)
        const indicator = document.createElement('div');
        indicator.id = 'dev-refresh-indicator';
        indicator.innerHTML = '🔄';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 255, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 10000;
            font-family: monospace;
            cursor: pointer;
            transition: all 0.3s ease;
            display: none !important;
            visibility: hidden;
            opacity: 0;
        `;
        
        indicator.addEventListener('click', () => this.forceRefresh());
        indicator.title = 'Auto-refresh active\nCtrl+Shift+R to force refresh\nClick to refresh now';
        
        document.body.appendChild(indicator);
        this.indicator = indicator;
    }
    
    updateIndicator(status) {
        if (!this.indicator) return;
        
        switch (status) {
            case 'checking':
                this.indicator.style.background = 'rgba(255, 255, 0, 0.8)';
                this.indicator.innerHTML = '⟳';
                break;
            case 'connected':
                this.indicator.style.background = 'rgba(0, 255, 0, 0.8)';
                this.indicator.innerHTML = '🔄';
                break;
            case 'error':
                this.indicator.style.background = 'rgba(255, 0, 0, 0.8)';
                this.indicator.innerHTML = '⚠';
                break;
            case 'refreshing':
                this.indicator.style.background = 'rgba(0, 150, 255, 0.8)';
                this.indicator.innerHTML = '↻';
                break;
        }
    }
    
    async startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;
        
        while (this.isPolling) {
            try {
                await this.checkForChanges();
                this.retryCount = 0; // Reset retry count on success
                await this.sleep(this.pollInterval);
            } catch (error) {
                console.warn('🔄 Auto-refresh polling error:', error.message);
                this.handleError();
                await this.sleep(Math.min(this.pollInterval * Math.pow(2, this.retryCount), 10000));
            }
        }
    }
    
    async checkForChanges() {
        this.updateIndicator('checking');
        
        const response = await fetch('/dev/poll', {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        
        const data = await response.json();
        this.updateIndicator('connected');
        
        if (this.lastModified === null) {
            this.lastModified = data.lastModified;
            console.log('🔄 Auto-refresh initialized');
            return;
        }
        
        if (data.lastModified > this.lastModified) {
            console.log('🔄 Files changed - refreshing page...');
            this.refresh();
        }
    }
    
    handleError() {
        this.updateIndicator('error');
        this.retryCount++;
        
        if (this.retryCount >= this.maxRetries) {
            console.warn('🔄 Auto-refresh: Max retries reached, reducing poll frequency');
            this.pollInterval = Math.min(this.pollInterval * 2, 30000); // Max 30 seconds
            this.retryCount = 0;
        }
    }
    
    refresh() {
        this.updateIndicator('refreshing');
        
        // Add a small delay to ensure file operations are complete
        setTimeout(() => {
            // For development, use the most aggressive refresh method
            // This clears all caches including Three.js internal caches
            if (window.location.search.includes('force=true')) {
                window.location.href = window.location.pathname + '?t=' + Date.now();
            } else {
                // Add cache-busting parameter to URL
                const separator = window.location.search ? '&' : '?';
                window.location.href = window.location.pathname + window.location.search + separator + 't=' + Date.now();
            }
        }, 100);
    }
    
    forceRefresh() {
        console.log('🔄 Manual refresh triggered');
        
        // Even more aggressive cache clearing for manual refresh
        if ('caches' in window) {
            caches.keys().then(function(names) {
                names.forEach(function(name) {
                    caches.delete(name);
                });
            });
        }
        
        // Force complete page reload with cache busting
        window.location.href = window.location.pathname + '?force=true&t=' + Date.now();
    }
    
    stop() {
        this.isPolling = false;
        if (this.indicator) {
            this.indicator.remove();
        }
        console.log('🔄 Auto-refresh stopped');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Auto-initialize when the script loads
let autoRefresh;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        autoRefresh = new DevAutoRefresh();
    });
} else {
    autoRefresh = new DevAutoRefresh();
}

// Expose globally for manual control
window.DevAutoRefresh = DevAutoRefresh;
window.autoRefresh = autoRefresh;
