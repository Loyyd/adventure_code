import { biomes } from '../game/Biomes.js';
import { InventoryUI } from './InventoryUI.js';
import { DebugMenu } from './DebugMenu.js';

export class Interface {
    constructor(player) {
        this.player = player;
        this.biomeElement = document.getElementById('currentBiome');
        this.currentShopNPC = null; // Track current NPC shop interaction
        
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
        // Create modal dialog for campfire building - styled similar to interaction window
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            text-align: center;
            max-width: 320px;
            min-width: 280px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        `;
        
        const title = document.createElement('div');
        title.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 18px;
            font-weight: bold;
        `;
        title.textContent = '🔥 Build Campfire';
        
        // Resource display similar to interaction progress
        const resourceContainer = document.createElement('div');
        resourceContainer.style.cssText = `
            margin: 15px 0;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
        `;
        
        const resourceText = document.createElement('div');
        resourceText.style.cssText = `
            font-size: 14px;
            margin-bottom: 8px;
        `;
        const currentSticks = window.gamePlayer?.inventory?.getItemCount('sticks') || 0;
        resourceText.textContent = `Required: ${requiredSticks} sticks`;
        
        // Progress bar showing current resources
        const progressBarContainer = document.createElement('div');
        progressBarContainer.style.cssText = `
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 5px;
        `;
        
        const progressBar = document.createElement('div');
        const progressPercent = Math.min((currentSticks / requiredSticks) * 100, 100);
        progressBar.style.cssText = `
            width: ${progressPercent}%;
            height: 100%;
            background: linear-gradient(90deg, #ffff00, #ff8800);
            transition: width 0.3s ease;
        `;
        
        const statusText = document.createElement('div');
        statusText.style.cssText = `
            font-size: 12px;
            color: ${currentSticks >= requiredSticks ? '#90EE90' : '#FFB6C1'};
        `;
        statusText.textContent = `You have: ${currentSticks} sticks`;
        
        progressBarContainer.appendChild(progressBar);
        resourceContainer.appendChild(resourceText);
        resourceContainer.appendChild(progressBarContainer);
        resourceContainer.appendChild(statusText);
        
        const hint = document.createElement('div');
        hint.style.cssText = `
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 15px;
        `;
        hint.textContent = 'Gather sticks from grass, bushes, and trees.';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        const yesButton = document.createElement('button');
        yesButton.style.cssText = `
            background: rgba(0, 255, 0, 0.7);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-family: Arial, sans-serif;
        `;
        yesButton.textContent = 'Build';
        
        const noButton = document.createElement('button');
        noButton.style.cssText = `
            background: rgba(255, 0, 0, 0.7);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-family: Arial, sans-serif;
        `;
        noButton.textContent = 'Cancel';
        
        // Hover effects - similar to interaction UI
        yesButton.addEventListener('mouseenter', () => {
            yesButton.style.background = 'rgba(0, 255, 0, 0.9)';
        });
        yesButton.addEventListener('mouseleave', () => {
            yesButton.style.background = 'rgba(0, 255, 0, 0.7)';
        });
        
        noButton.addEventListener('mouseenter', () => {
            noButton.style.background = 'rgba(255, 0, 0, 0.9)';
        });
        noButton.addEventListener('mouseleave', () => {
            noButton.style.background = 'rgba(255, 0, 0, 0.7)';
        });
        
        // Update display function
        const updateDisplay = () => {
            const sticks = window.gamePlayer?.inventory?.getItemCount('sticks') || 0;
            const canBuild = sticks >= requiredSticks;
            const progressPercent = Math.min((sticks / requiredSticks) * 100, 100);
            
            // Update progress bar
            progressBar.style.width = `${progressPercent}%`;
            
            // Update status text
            statusText.textContent = `You have: ${sticks} sticks`;
            statusText.style.color = canBuild ? '#90EE90' : '#FFB6C1';
            
            // Update button state
            yesButton.disabled = !canBuild;
            yesButton.style.opacity = canBuild ? '1' : '0.5';
            yesButton.style.cursor = canBuild ? 'pointer' : 'not-allowed';
            yesButton.style.background = canBuild ? 'rgba(0, 255, 0, 0.7)' : 'rgba(128, 128, 128, 0.7)';
        };
        updateDisplay();
        
        // Listen for inventory changes to live-update
        const originalOnInventoryChange = window.gamePlayer?.inventory?.onInventoryChange;
        if (window.gamePlayer?.inventory) {
            window.gamePlayer.inventory.onInventoryChange = () => {
                // Call existing callback if any
                if (originalOnInventoryChange) originalOnInventoryChange();
                updateDisplay();
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
        
        // Assemble the dialog
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);
        
        dialog.appendChild(title);
        dialog.appendChild(resourceContainer);
        dialog.appendChild(hint);
        dialog.appendChild(buttonContainer);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    showNPCShop(npc) {
        // Create modal dialog for NPC shop
        this.currentShopNPC = npc;
        const overlay = document.createElement('div');
        overlay.id = 'npcShopOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 3500;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.9));
            color: white;
            padding: 25px;
            border-radius: 12px;
            font-family: Arial, sans-serif;
            max-width: 450px;
            min-width: 400px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            border: 2px solid #444;
        `;
        
        // Shop header
        const header = document.createElement('div');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #555;
        `;
        
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 24px;
            font-weight: bold;
            color: #ffd700;
            margin-bottom: 5px;
        `;
        title.textContent = `🏪 ${npc.name}'s Shop`;
        
        const subtitle = document.createElement('div');
        subtitle.style.cssText = `
            font-size: 14px;
            color: #ccc;
            font-style: italic;
        `;
        subtitle.textContent = 'Tools for your adventures';
        
        header.appendChild(title);
        header.appendChild(subtitle);
        
        // Currency display
        const currencyContainer = document.createElement('div');
        currencyContainer.style.cssText = `
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: rgba(255, 215, 0, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(255, 215, 0, 0.3);
        `;
        
        const currencyText = document.createElement('div');
        currencyText.style.cssText = `
            font-size: 16px;
            color: #ffd700;
        `;
        const playerSticks = window.gamePlayer?.inventory?.getItemCount('sticks') || 0;
        currencyText.textContent = `Your Sticks: ${playerSticks} 🪵`;
        
        currencyContainer.appendChild(currencyText);
        
        // Shop items container
        const itemsContainer = document.createElement('div');
        itemsContainer.style.cssText = `
            margin-bottom: 20px;
        `;
        
        // Create shop items
        const shopItems = npc.getShopItems();
        shopItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                margin-bottom: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                transition: background 0.2s ease;
            `;
            
            const leftSection = document.createElement('div');
            leftSection.style.cssText = `
                display: flex;
                align-items: center;
                flex: 1;
            `;
            
            const icon = document.createElement('div');
            icon.style.cssText = `
                font-size: 32px;
                margin-right: 15px;
            `;
            icon.textContent = item.icon;
            
            const itemInfo = document.createElement('div');
            itemInfo.style.cssText = `
                flex: 1;
            `;
            
            const itemName = document.createElement('div');
            itemName.style.cssText = `
                font-size: 16px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 3px;
            `;
            itemName.textContent = item.name;
            
            const itemDesc = document.createElement('div');
            itemDesc.style.cssText = `
                font-size: 12px;
                color: #bbb;
            `;
            itemDesc.textContent = item.description;
            
            itemInfo.appendChild(itemName);
            itemInfo.appendChild(itemDesc);
            
            const rightSection = document.createElement('div');
            rightSection.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const price = document.createElement('div');
            price.style.cssText = `
                font-size: 14px;
                color: #ffd700;
                font-weight: bold;
                text-align: right;
                min-width: 60px;
            `;
            price.textContent = `${item.price} 🪵`;
            
            const buyButton = document.createElement('button');
            const canAfford = npc.canAffordItem(item, window.gamePlayer?.inventory);
            const alreadyHas = window.gamePlayer?.inventory?.getItemCount(item.id) > 0;
            
            buyButton.style.cssText = `
                background: ${canAfford && !alreadyHas ? 'rgba(0, 150, 0, 0.8)' : 'rgba(100, 100, 100, 0.5)'};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                font-size: 12px;
                cursor: ${canAfford && !alreadyHas ? 'pointer' : 'not-allowed'};
                transition: background 0.2s ease;
                font-family: Arial, sans-serif;
                min-width: 60px;
            `;
            
            if (alreadyHas) {
                buyButton.textContent = 'Owned';
                buyButton.disabled = true;
            } else if (canAfford) {
                buyButton.textContent = 'Buy';
                buyButton.addEventListener('mouseenter', () => {
                    buyButton.style.background = 'rgba(0, 180, 0, 0.9)';
                });
                buyButton.addEventListener('mouseleave', () => {
                    buyButton.style.background = 'rgba(0, 150, 0, 0.8)';
                });
            } else {
                buyButton.textContent = 'Need More';
                buyButton.disabled = true;
            }
            
            // Buy button click handler
            if (canAfford && !alreadyHas) {
                buyButton.addEventListener('click', () => {
                    if (npc.purchaseItem(item, window.gamePlayer.inventory)) {
                        // Purchase successful - refresh the shop display
                        this.hideNPCShop();
                        this.showNPCShop(npc);
                        
                        // Show success message
                        this.showMessage(`Purchased ${item.name}! Check your inventory.`, 2000);
                    }
                });
            }
            
            leftSection.appendChild(icon);
            leftSection.appendChild(itemInfo);
            rightSection.appendChild(price);
            rightSection.appendChild(buyButton);
            
            itemDiv.appendChild(leftSection);
            itemDiv.appendChild(rightSection);
            itemsContainer.appendChild(itemDiv);
        });
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.style.cssText = `
            width: 100%;
            background: rgba(150, 0, 0, 0.8);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s ease;
            font-family: Arial, sans-serif;
        `;
        closeButton.textContent = 'Close Shop';
        
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = 'rgba(180, 0, 0, 0.9)';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = 'rgba(150, 0, 0, 0.8)';
        });
        
        closeButton.addEventListener('click', () => {
            this.hideNPCShop();
        });
        
        // ESC key to close
        const handleKeyPress = (event) => {
            if (event.key === 'Escape') {
                this.hideNPCShop();
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // Store cleanup function
        overlay.cleanup = () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
        
        // Assemble the dialog
        dialog.appendChild(header);
        dialog.appendChild(currencyContainer);
        dialog.appendChild(itemsContainer);
        dialog.appendChild(closeButton);
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    hideNPCShop() {
        const overlay = document.getElementById('npcShopOverlay');
        if (overlay) {
            if (overlay.cleanup) {
                overlay.cleanup();
            }
            document.body.removeChild(overlay);
        }
        
        // End NPC interaction WITHOUT calling endInteraction() to avoid circular call
        if (this.currentShopNPC) {
            this.currentShopNPC.state = 'wandering';
            this.currentShopNPC.isShopOpen = false;
            this.currentShopNPC = null;
        }
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
