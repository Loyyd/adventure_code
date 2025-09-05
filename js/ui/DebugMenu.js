export class DebugMenu {
    constructor(player) {
        this.player = player;
        this.debugMode = false;
        this.createDebugUI();
    }

    createDebugUI() {
        // Create debug overlay
        this.debugOverlay = document.createElement('div');
        this.debugOverlay.id = 'debugOverlay';
        this.debugOverlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            z-index: 2000;
            display: none;
            min-width: 250px;
            border: 1px solid #00ff00;
            pointer-events: auto;
            user-select: none;
        `;
        
        this.debugContent = document.createElement('div');
        this.debugOverlay.appendChild(this.debugContent);
        
        document.body.appendChild(this.debugOverlay);
    }

    toggleDebugMode(enabled) {
        console.log(`Debug: toggleDebugMode called with enabled=${enabled}`);
        this.debugMode = enabled;
        this.debugOverlay.style.display = enabled ? 'block' : 'none';
        
        if (enabled) {
            console.log('Debug: Debug mode enabled, updating info');
            this.updateDebugInfo();
            console.log('Debug: Debug overlay should now be visible');
        } else {
            console.log('Debug: Debug mode disabled');
        }
    }

    updateDebugInfo() {
        if (!this.debugMode || !this.debugContent) return;
        
        const player = window.gamePlayer;
        const dayNight = window.gameDayNight;
        
        let debugText = '<strong>🐛 DEBUG CONTROLS</strong><br><br>';
        
        // Time controls section
        debugText += `<strong>Time Controls:</strong><br>`;
        if (dayNight) {
            const timeString = dayNight.getTimeString();
            const period = dayNight.getCurrentPeriod();
            const isPaused = dayNight.timeSpeed === 0;
            debugText += `Current Time: ${timeString} (${period})<br>`;
            debugText += `Status: ${isPaused ? '<span style="color: #ff6666;">PAUSED</span>' : '<span style="color: #66ff66;">RUNNING</span>'}<br>`;
        }
        debugText += `N - ${dayNight && dayNight.timeSpeed === 0 ? 'Resume' : 'Pause'} time<br>`;
        debugText += `M - Set to day<br>`;
        debugText += `B - Set to night<br><br>`;
        
        // Teleport section
        debugText += `<strong>Teleport:</strong><br>`;
        debugText += `T - Teleport to campfire<br><br>`;
        
        // Player info
        if (player) {
            debugText += `<strong>Player Position:</strong><br>`;
            debugText += `(${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})<br><br>`;
        }
        
        // Exit
        debugText += `<strong>P - Close Debug Mode</strong>`;
        
        this.debugContent.innerHTML = debugText;
    }

    toggleCameraInfo() {
        // This will be called from debug controls
        this.updateDebugInfo();
        
        if (window.gameCamera) {
            const cam = window.gameCamera.camera;
            console.log('Camera Debug Info:');
            console.log('Position:', cam.position);
            console.log('Looking at:', this.debugContent);
            console.log('Zoom:', window.gameCamera.currentZoom);
            console.log('Fly mode:', window.gameCamera.flyMode);
        }
    }
}
