import { biomes } from '../game/Biomes.js';
import { InventoryUI } from './InventoryUI.js';
import { DebugMenu } from './DebugMenu.js';

export class Interface {
    constructor(player) {
        this.player = player;
        this.biomeElement = document.getElementById('currentBiome');
        
        // Check if required DOM elements exist
        if (!this.biomeElement) {
            console.error('Could not find element with ID "currentBiome". Make sure the DOM is fully loaded before initializing Interface.');
            throw new Error('Required DOM element "currentBiome" not found');
        }
        
        this.inventoryUI = new InventoryUI(player);
        this.debugMenu = new DebugMenu(player);
        this.createInteractionUI();
        this.createTimeUI();
        this.createItemNotificationUI();
        this.createBiomeTransitionUI();
        
        // Set up inventory update callback
        this.player.inventory.onInventoryChange = () => {
            if (this.inventoryUI.isOpen) {
                this.inventoryUI.updateInventoryDisplay(this.player.inventory.getAllItems());
            } else {
                // Update hotbar even when inventory is closed
                this.inventoryUI.updateHotbarDisplay();
            }
        };
        
        // Initialize hotbar display
        this.inventoryUI.updateHotbarDisplay();
    }

    createInteractionUI() {
        // Create interaction progress bar
        this.interactionContainer = document.createElement('div');
        this.interactionContainer.id = 'interactionContainer';
        this.interactionContainer.style.cssText = `
            position: fixed;
            bottom: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            display: none;
            z-index: 1000;
        `;
        
        this.interactionText = document.createElement('div');
        this.interactionText.textContent = 'Interacting...';
        this.interactionText.style.cssText = `
            margin-bottom: 8px;
            text-align: center;
        `;
        
        this.progressBarContainer = document.createElement('div');
        this.progressBarContainer.style.cssText = `
            width: 200px;
            height: 10px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            overflow: hidden;
        `;
        
        this.progressBar = document.createElement('div');
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ffff00, #ff8800);
            transition: width 0.1s ease;
        `;
        
        this.progressBarContainer.appendChild(this.progressBar);
        this.interactionContainer.appendChild(this.interactionText);
        this.interactionContainer.appendChild(this.progressBarContainer);
        document.body.appendChild(this.interactionContainer);
    }

    createTimeUI() {
        // Create time display container
        this.timeContainer = document.createElement('div');
        this.timeContainer.id = 'timeContainer';
        this.timeContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1000;
            min-width: 120px;
        `;
        
        // Time display
        this.timeDisplay = document.createElement('div');
        this.timeDisplay.style.cssText = `
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            text-align: center;
        `;
        
        // Period display (Dawn, Day, Dusk, Night, etc.)
        this.periodDisplay = document.createElement('div');
        this.periodDisplay.style.cssText = `
            font-size: 12px;
            text-align: center;
            margin-bottom: 10px;
            color: #cccccc;
        `;
        
        // Speed display
        this.speedDisplay = document.createElement('div');
        this.speedDisplay.style.cssText = `
            font-size: 10px;
            text-align: center;
            color: #aaaaaa;
        `;
        
        this.timeContainer.appendChild(this.timeDisplay);
        this.timeContainer.appendChild(this.periodDisplay);
        this.timeContainer.appendChild(this.speedDisplay);
        document.body.appendChild(this.timeContainer);
    }

    updateBiome(biomeName) {
        if (!this.biomeElement) {
            console.warn('biomeElement is null, cannot update biome display');
            return;
        }
        
        this.biomeElement.textContent = biomeName;
        if (biomes[biomeName]) {
            this.biomeElement.style.color = `#${biomes[biomeName].color.toString(16).padStart(6, '0')}`;
        }
    }

    toggleInventory() {
        this.inventoryUI.toggleInventory();
    }

    updateInteractionProgress(elapsed, duration, targetPosition = null, assetType = null) {
        if (elapsed === null || duration === null) {
            // Hide progress bar
            this.interactionContainer.style.display = 'none';
        } else {
            // Show and update progress bar
            this.interactionContainer.style.display = 'block';
            const progress = Math.min((elapsed / duration) * 100, 100);
            this.progressBar.style.width = `${progress}%`;
            
            const remainingTime = Math.max(0, (duration - elapsed) / 1000);
            const label = assetType ? assetType.charAt(0).toUpperCase() + assetType.slice(1) : 'Object';
            this.interactionText.textContent = `Interacting with ${label}... ${remainingTime.toFixed(1)}s`;
            
            // Position the progress bar near the mouse cursor if we have mouse position
            if (window.gameControls && window.gameControls.getLastMousePosition) {
                const mousePos = window.gameControls.getLastMousePosition();
                if (mousePos) {
                    // Position near mouse but slightly offset to avoid blocking view
                    const containerWidth = 240; // approximate width of container
                    const containerHeight = 80; // approximate height of container
                    const offsetX = 20; // offset from mouse
                    const offsetY = -60; // offset above mouse
                    
                    let finalX = mousePos.x + offsetX;
                    let finalY = mousePos.y + offsetY;
                    
                    // Make sure it stays within screen bounds
                    finalX = Math.max(10, Math.min(window.innerWidth - containerWidth - 10, finalX));
                    finalY = Math.max(10, Math.min(window.innerHeight - containerHeight - 10, finalY));
                    
                    this.interactionContainer.style.left = `${finalX}px`;
                    this.interactionContainer.style.top = `${finalY}px`;
                    this.interactionContainer.style.transform = 'none';
                    this.interactionContainer.style.bottom = 'auto';
                    return;
                }
            }
            
            // Fallback: position based on target 3D position if available
            if (targetPosition && window.gameCamera) {
                const camera = window.gameCamera.getCamera();
                const vector = new THREE.Vector3(targetPosition.x, targetPosition.y + 1, targetPosition.z);
                vector.project(camera);
                
                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
                
                // Make sure it stays within screen bounds
                const containerWidth = 240; // approximate width of container
                const containerHeight = 80; // approximate height of container
                const finalX = Math.max(10, Math.min(window.innerWidth - containerWidth - 10, x - containerWidth / 2));
                const finalY = Math.max(10, Math.min(window.innerHeight - containerHeight - 10, y - 50));
                
                this.interactionContainer.style.left = `${finalX}px`;
                this.interactionContainer.style.top = `${finalY}px`;
                this.interactionContainer.style.transform = 'none';
                this.interactionContainer.style.bottom = 'auto';
            } else {
                // Final fallback to bottom center if no position provided
                this.interactionContainer.style.left = '50%';
                this.interactionContainer.style.top = 'auto';
                this.interactionContainer.style.bottom = '50px';
                this.interactionContainer.style.transform = 'translateX(-50%)';
            }
        }
    }

    updateTimeInfo(timeString, period, speed) {
        if (this.timeDisplay) {
            this.timeDisplay.textContent = timeString;
        }
        if (this.periodDisplay) {
            this.periodDisplay.textContent = period;
            // Color code the period
            const periodColors = {
                'NIGHT': '#4169E1',
                'DAWN': '#FF6B35',
                'MORNING': '#FFD700',
                'DAY': '#FFFAF0',
                'AFTERNOON': '#FFE4B5',
                'DUSK': '#FF4500',
                'EVENING': '#8B0000'
            };
            this.periodDisplay.style.color = periodColors[period] || '#cccccc';
        }
        if (this.speedDisplay) {
            if (speed === 0) {
                this.speedDisplay.textContent = 'Time: PAUSED';
                this.speedDisplay.style.color = '#ff6666';
            } else {
                this.speedDisplay.textContent = `Speed: ${speed}x`;
                this.speedDisplay.style.color = '#aaaaaa';
            }
        }
    }

    createItemNotificationUI() {
        // Create notification container
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'itemNotificationContainer';
        this.notificationContainer.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            z-index: 1500;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            pointer-events: none;
        `;
        document.body.appendChild(this.notificationContainer);
    }

    createBiomeTransitionUI() {
        // Create biome transition notification container
        this.biomeTransitionContainer = document.createElement('div');
        this.biomeTransitionContainer.id = 'biomeTransitionContainer';
        this.biomeTransitionContainer.style.cssText = `
            position: fixed;
            top: 18%;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2500;
            pointer-events: none;
            display: none;
        `;
        document.body.appendChild(this.biomeTransitionContainer);
    }

    showItemNotification(items) {
        if (!items || items.length === 0) return;
        
        items.forEach((itemInfo, index) => {
            // Parse item info (expected format: "1 wood(s)")
            const match = itemInfo.match(/(\d+)\s+(.+?)(?:\(s\))?$/);
            if (!match) return;
            
            const quantity = match[1];
            const itemType = match[2].trim();
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = 'item-notification';
            notification.style.cssText = `
                background: rgba(0, 0, 0, 0.8);
                color: white;
                border-left: 4px solid #3498db;
                padding: 10px 15px;
                border-radius: 5px;
                font-family: Arial, sans-serif;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
                transform: translateX(120%);
                transition: transform 0.3s ease, opacity 0.3s ease;
                opacity: 0;
                max-width: 250px;
                animation: slideIn 0.3s ease forwards, fadeOut 0.5s ease 2.5s forwards;
            `;
            
            // Create item icon
            const icon = document.createElement('div');
            icon.style.cssText = `
                font-size: 24px;
                margin-right: 12px;
            `;
            icon.textContent = this.inventoryUI.itemImages[itemType] || '📦';
            
            // Create text content
            const textContent = document.createElement('div');
            textContent.style.cssText = `
                display: flex;
                flex-direction: column;
            `;
            
            const title = document.createElement('div');
            title.style.cssText = `
                font-weight: bold;
                font-size: 14px;
                color: #3498db;
                text-transform: capitalize;
            `;
            title.textContent = 'Item received!';
            
            const itemText = document.createElement('div');
            itemText.style.cssText = `
                font-size: 12px;
                color: #ecf0f1;
            `;
            itemText.textContent = `${quantity}× ${itemType.replace('_', ' ')}`;
            
            textContent.appendChild(title);
            textContent.appendChild(itemText);
            
            notification.appendChild(icon);
            notification.appendChild(textContent);
            
            this.notificationContainer.appendChild(notification);
            
            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    0% { transform: translateX(120%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    0% { opacity: 1; }
                    100% { opacity: 0; transform: translateX(120%); }
                }
            `;
            document.head.appendChild(style);
            
            // Remove notification after animation completes (3s total)
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
            
            // Stagger notifications
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
                notification.style.opacity = '1';
            }, index * 300);
        });
    }

    handleResize() {
        this.inventoryUI.handleResize();
    }

    showMessage(message, duration = 3000) {
        // Create a general message notification
        const messageElement = document.createElement('div');
        messageElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            z-index: 2000;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
            animation: fadeInOut ${duration / 1000}s ease;
        `;
        
        messageElement.textContent = message;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(messageElement);
        
        // Remove after duration
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, duration);
    }

    showBiomeTransition(biomeName, biomeColor) {
        if (!this.biomeTransitionContainer) return;

        // Format biome name for display (capitalize each word)
        const formattedBiomeName = biomeName.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Create the transition notification
        const biomeNotification = document.createElement('div');
        biomeNotification.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
            color: white;
            padding: 30px 50px;
            border-radius: 20px;
            font-family: 'Arial', sans-serif;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 3px solid #${biomeColor.toString(16).padStart(6, '0')};
            backdrop-filter: blur(10px);
            min-width: 300px;
            animation: biomeTransitionAnimation 2s ease-in-out forwards;
        `;

        // Add the entering text
        const enteringText = document.createElement('div');
        enteringText.style.cssText = `
            font-size: 16px;
            color: #cccccc;
            margin-bottom: 10px;
            letter-spacing: 1px;
            opacity: 0;
            animation: textFadeIn 0.5s ease-in-out 0.3s forwards;
        `;
        enteringText.textContent = 'Entering';

        // Add the biome name
        const biomeNameElement = document.createElement('div');
        biomeNameElement.style.cssText = `
            font-size: 32px;
            font-weight: bold;
            color: #${biomeColor.toString(16).padStart(6, '0')};
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            letter-spacing: 2px;
            opacity: 0;
            animation: textFadeIn 0.5s ease-in-out 0.6s forwards;
        `;
        biomeNameElement.textContent = formattedBiomeName;

        // Add some decorative elements
        const decorator = document.createElement('div');
        decorator.style.cssText = `
            font-size: 20px;
            margin: 15px 0;
            opacity: 0;
            animation: textFadeIn 0.5s ease-in-out 0.9s forwards;
        `;
        decorator.textContent = '◆ ◇ ◆';

        biomeNotification.appendChild(enteringText);
        biomeNotification.appendChild(biomeNameElement);
        biomeNotification.appendChild(decorator);

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes biomeTransitionAnimation {
                0% { 
                    opacity: 0; 
                    transform: scale(0.3) translateY(50px);
                }
                10% { 
                    opacity: 1; 
                    transform: scale(1.1) translateY(0px);
                }
                15% { 
                    transform: scale(1) translateY(0px);
                }
                85% { 
                    opacity: 1; 
                    transform: scale(1) translateY(0px);
                }
                95% { 
                    opacity: 0.7; 
                    transform: scale(0.9) translateY(-20px);
                }
                100% { 
                    opacity: 0; 
                    transform: scale(0.5) translateY(-50px);
                }
            }
            
            @keyframes textFadeIn {
                0% { 
                    opacity: 0; 
                    transform: translateY(10px);
                }
                100% { 
                    opacity: 1; 
                    transform: translateY(0px);
                }
            }
        `;
        document.head.appendChild(style);

        // Clear any existing notification
        this.biomeTransitionContainer.innerHTML = '';
        this.biomeTransitionContainer.appendChild(biomeNotification);
        this.biomeTransitionContainer.style.display = 'block';

        // Hide after animation completes
        setTimeout(() => {
            this.biomeTransitionContainer.style.display = 'none';
            this.biomeTransitionContainer.innerHTML = '';
        }, 2000);
    }

    showCampfireDialog(campfire, requiredSticks) {
        // Create modal dialog for campfire building
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #2c3e50;
            color: white;
            padding: 30px;
            border-radius: 15px;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 2px solid #34495e;
        `;
        
        const title = document.createElement('h2');
        title.style.cssText = `
            margin: 0 0 20px 0;
            color: #e67e22;
            font-size: 24px;
        `;
        title.textContent = '🔥 Build Campfire';
        
        const message = document.createElement('p');
        message.style.cssText = `
            margin: 0 0 25px 0;
            font-size: 16px;
            line-height: 1.5;
            color: #ecf0f1;
        `;
        const currentSticks = window.gamePlayer?.inventory?.getItemCount('sticks') || 0;
        message.textContent = `Cost: ${requiredSticks} sticks • You have: ${currentSticks}`;
        
        const hint = document.createElement('div');
        hint.style.cssText = `
            font-size: 12px;
            color: #bdc3c7;
            margin-top: -18px;
            margin-bottom: 18px;
        `;
        hint.textContent = 'Gather sticks from grass, bushes, and trees.';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 15px;
            justify-content: center;
        `;
        
        const yesButton = document.createElement('button');
        yesButton.style.cssText = `
            background: #27ae60;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease;
        `;
        yesButton.textContent = `Build (${requiredSticks})`;
        
        const noButton = document.createElement('button');
        noButton.style.cssText = `
            background: #e74c3c;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s ease;
        `;
        noButton.textContent = 'No';
        
        // Hover effects
        yesButton.addEventListener('mouseenter', () => {
            yesButton.style.background = '#2ecc71';
        });
        yesButton.addEventListener('mouseleave', () => {
            yesButton.style.background = '#27ae60';
        });
        
        noButton.addEventListener('mouseenter', () => {
            noButton.style.background = '#c0392b';
        });
        noButton.addEventListener('mouseleave', () => {
            noButton.style.background = '#e74c3c';
        });
        
        // Disable/enable build button based on inventory
        const updateButtonState = () => {
            const sticks = window.gamePlayer?.inventory?.getItemCount('sticks') || 0;
            const canBuild = sticks >= requiredSticks;
            yesButton.disabled = !canBuild;
            yesButton.style.opacity = canBuild ? '1' : '0.6';
            yesButton.style.cursor = canBuild ? 'pointer' : 'not-allowed';
            message.textContent = `Cost: ${requiredSticks} sticks • You have: ${sticks}`;
        };
        updateButtonState();
        
        // Listen for inventory changes to live-update
        const originalOnInventoryChange = window.gamePlayer?.inventory?.onInventoryChange;
        if (window.gamePlayer?.inventory) {
            window.gamePlayer.inventory.onInventoryChange = () => {
                // Call existing callback if any
                if (originalOnInventoryChange) originalOnInventoryChange();
                updateButtonState();
            };
        }

        // Button events
        yesButton.addEventListener('click', () => {
            if (!yesButton.disabled) {
                window.gamePlayer.buildCampfire(campfire, requiredSticks);
                cleanup();
            }
        });
        
        noButton.addEventListener('click', () => {
            cleanup();
        });
        
        // ESC key to close
        const handleKeyPress = (event) => {
            if (event.key === 'Escape') {
                cleanup();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        const cleanup = () => {
            // Restore original inventory callback
            if (window.gamePlayer?.inventory) {
                window.gamePlayer.inventory.onInventoryChange = originalOnInventoryChange || null;
            }
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
            document.removeEventListener('keydown', handleKeyPress);
        };
        
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
        
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(hint);
        dialog.appendChild(buttonContainer);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    toggleDebugMode(enabled) {
        this.debugMenu.toggleDebugMode(enabled);
    }

    updateDebugInfo() {
        this.debugMenu.updateDebugInfo();
    }

    toggleCameraInfo() {
        this.debugMenu.toggleCameraInfo();
    }
}
