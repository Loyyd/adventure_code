export class DebugMenu {
    constructor(player) {
        this.player = player;
        this.debugMode = false;
        // Local icon map for debug buttons (keep in sync with InventoryUI where possible)
        this.itemIcons = {
            axe: '\ud83e\ude93',       // 🪓
            pickaxe: '\u26cf\ufe0f',  // ⛏️
            sticks: '\ud83c\udfd2'    // 🏒 (placeholder for sticks)
        };
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
        
        // Create item buttons
        this.createItemButtons();
        
        document.body.appendChild(this.debugOverlay);
    }
    
    createItemButtons() {
        // Create container for item buttons
        this.itemButtonsContainer = document.createElement('div');
        this.itemButtonsContainer.style.cssText = `
            margin-top: 12px;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 6px;
        `;
        
        // Create axe button with direct onclick handler
        const axeButton = document.createElement('button');
        axeButton.style.cssText = this.getButtonStyle();
        this.setButtonContent(axeButton, this.itemIcons.axe, 'Axe');
        axeButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.directAddItem('axe', 1);
        };
        this.addButtonHoverEffects(axeButton);
        
        // Create pickaxe button with direct onclick handler
        const pickaxeButton = document.createElement('button');
        pickaxeButton.style.cssText = this.getButtonStyle();
        this.setButtonContent(pickaxeButton, this.itemIcons.pickaxe, 'Pickaxe');
        pickaxeButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.directAddItem('pickaxe', 1);
        };
        this.addButtonHoverEffects(pickaxeButton);
        
        // Create sticks button with direct onclick handler
        const sticksButton = document.createElement('button');
        sticksButton.style.cssText = this.getButtonStyle();
        this.setButtonContent(sticksButton, this.itemIcons.sticks, '5 Sticks');
        sticksButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.directAddItem('sticks', 5);
        };
        this.addButtonHoverEffects(sticksButton);
        
        // Add buttons to container
        this.itemButtonsContainer.appendChild(axeButton);
        this.itemButtonsContainer.appendChild(pickaxeButton);
        this.itemButtonsContainer.appendChild(sticksButton);
        
        // Add container to debug overlay
        this.debugOverlay.appendChild(this.itemButtonsContainer);
        
        // Create stage buttons
        this.createStageButtons();
    }
    
    setButtonContent(button, icon, label) {
        button.innerHTML = '';
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon;
        iconSpan.style.cssText = `font-size: 14px; line-height: 1;`;
        const textSpan = document.createElement('span');
        textSpan.textContent = label;
        textSpan.style.cssText = `font-size: 11px; margin-left: 6px;`;
        button.appendChild(iconSpan);
        button.appendChild(textSpan);
    }

    addButtonHoverEffects(button) {
        button.addEventListener('mouseover', () => {
            button.style.background = '#0a3a0a';
        });
        button.addEventListener('mouseout', () => {
            button.style.background = '#062d06';
        });
    }
    
    getButtonStyle() {
        return `
            background: #062d06;
            color: #00ff00;
            border: 1px solid #00ff00;
            padding: 4px 8px;
            margin: 0;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            cursor: pointer;
            transition: background 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        `;
    }
    
    givePlayerItem(itemType, quantity) {
        // Use window.gamePlayer which is guaranteed to be the current player instance
        const player = window.gamePlayer || this.player;
        
        if (player && player.inventory) {
            const added = player.inventory.addItem(itemType, quantity);
            if (added) {
                // Show notification if UI is available
                if (window.gameInterface) {
                    window.gameInterface.showItemNotification([`${quantity} ${itemType}(s)`]);
                }
            } else {
                // Show a message explaining why it couldn't be added
                if (window.gameInterface) {
                    if (player.inventory.toolTypes && player.inventory.toolTypes.has(itemType) && player.inventory.items.has(itemType)) {
                        window.gameInterface.showMessage(`You already have a ${itemType}.`, 2000);
                    } else {
                        window.gameInterface.showMessage(`Could not add ${itemType} to inventory.`, 2000);
                    }
                }
            }
        } else {
            console.error("Debug: Player or inventory not available");
            if (window.gameInterface) {
                window.gameInterface.showMessage("Error: Player or inventory not available", 2000);
            }
        }
    }
    
    // Direct inventory manipulation with more robust error checking
    directAddItem(itemType, quantity) {
        try {
            // Make sure global player exists
            if (!window.gamePlayer) {
                console.error("Debug: window.gamePlayer is not defined");
                alert("Error: gamePlayer not found");
                return;
            }

            // Make sure inventory exists
            if (!window.gamePlayer.inventory) {
                console.error("Debug: window.gamePlayer.inventory is not defined");
                alert("Error: Player inventory not found");
                return;
            }

            // Try to add item directly to inventory
            const result = window.gamePlayer.inventory.addItem(itemType, quantity);

            if (result) {
                // Show visual confirmation
                if (window.gameInterface) {
                    window.gameInterface.showMessage(`Added ${quantity} ${itemType}(s) to inventory`, 1500);
                    window.gameInterface.showItemNotification([`${quantity} ${itemType}(s)`]);
                } else {
                    alert(`Added ${quantity} ${itemType}(s) to inventory`);
                }
            } else {
                // Handle tools that can only be added once
                if (window.gamePlayer.inventory.toolTypes && 
                    window.gamePlayer.inventory.toolTypes.has(itemType) && 
                    window.gamePlayer.inventory.items.has(itemType)) {
                    if (window.gameInterface) {
                        window.gameInterface.showMessage(`You already have a ${itemType}`, 1500);
                    } else {
                        alert(`You already have a ${itemType}`);
                    }
                } else {
                    if (window.gameInterface) {
                        window.gameInterface.showMessage(`Failed to add ${itemType} to inventory`, 1500);
                    } else {
                        alert(`Failed to add ${itemType} to inventory`);
                    }
                }
            }
        } catch (error) {
            console.error("Debug: Error in directAddItem:", error);
            alert(`Error adding item: ${error.message}`);
        }
    }

    toggleDebugMode(enabled) {
        this.debugMode = enabled;
        this.debugOverlay.style.display = enabled ? 'block' : 'none';

        if (enabled) {
            this.updateDebugInfo();

            // Make sure item buttons container is visible and properly positioned
            if (this.itemButtonsContainer) {
                this.itemButtonsContainer.style.display = 'flex';

                // Force redraw
                setTimeout(() => {
                    this.debugOverlay.style.display = 'none';
                    setTimeout(() => {
                        this.debugOverlay.style.display = 'block';
                    }, 10);
                }, 0);
            }
        }
    }

    updateDebugInfo() {
        if (!this.debugMode || !this.debugContent) return;
        
        const player = window.gamePlayer;
        const dayNight = window.gameDayNight;
        const world = window.gameWorld;
        
        let debugText = '<strong>🐛 DEBUG CONTROLS</strong><br><br>';
        
        // Hitbox visualization status
        if (world) {
            const hitboxesVisible = world.debugHitboxHelpers && world.debugHitboxHelpers.length > 0;
            const assetHitboxesVisible = world.debugAssetHitboxHelpers && world.debugAssetHitboxHelpers.length > 0;
            debugText += `<strong>Hitbox Visualization:</strong><br>`;
            debugText += `World Hitboxes: ${hitboxesVisible ? '<span style="color: #66ff66;">ENABLED</span>' : '<span style="color: #ff6666;">DISABLED</span>'}<br>`;
            if (hitboxesVisible) {
                debugText += `Showing ${world.debugHitboxHelpers.length} world hitbox(es)<br>`;
            }
            if (assetHitboxesVisible) {
                debugText += `Asset Hitboxes: <span style="color: #66ff66;">ENABLED</span> (${world.debugAssetHitboxHelpers.length} visible)<br>`;
            } else {
                debugText += `Asset Hitboxes: <span style="color: #ff6666;">DISABLED</span><br>`;
            }
            debugText += `H - Toggle hitbox visualization<br>`;
            debugText += `<br>`;
        }
        
        // Player hitbox visualization status
        if (player) {
            const playerHitboxVisible = player.debugHitboxHelper !== null;
            debugText += `<strong>Player Hitbox:</strong><br>`;
            debugText += `Status: ${playerHitboxVisible ? '<span style="color: #66ff66;">ENABLED</span>' : '<span style="color: #ff6666;">DISABLED</span>'}<br>`;
            debugText += `Collision Radius: ${player.collisionRadius.toFixed(1)} units<br>`;
            debugText += `<br>`;
        }
        
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
            // Camera debug info can be logged if needed for debugging
        }
    }
    
    createStageButtons() {
        // Create container for stage buttons
        this.stageButtonsContainer = document.createElement('div');
        this.stageButtonsContainer.style.cssText = `
            margin-top: 12px;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 6px;
            border-top: 1px solid #00ff00;
            padding-top: 8px;
        `;
        
        // Create label for stage section
        const stageLabel = document.createElement('div');
        stageLabel.textContent = 'Stage Skip:';
        stageLabel.style.cssText = `
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            margin-bottom: 6px;
            width: 100%;
        `;
        this.stageButtonsContainer.appendChild(stageLabel);
        
        // Create stage buttons 1, 2, 3
        for (let i = 1; i <= 3; i++) {
            const stageButton = document.createElement('button');
            stageButton.style.cssText = this.getButtonStyle();
            stageButton.textContent = i.toString();
            stageButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.skipToStage(i);
            };
            this.addButtonHoverEffects(stageButton);
            this.stageButtonsContainer.appendChild(stageButton);
        }
        
        // Add stage buttons container to debug overlay
        this.debugOverlay.appendChild(this.stageButtonsContainer);
    }
    
    skipToStage(stageNumber) {
        // Use the global stage manager
        if (window.gameStageManager) {
            const success = window.gameStageManager.skipToStage(stageNumber);
            if (!success) {
                console.error(`Failed to skip to stage ${stageNumber}`);
            }
        } else {
            console.error("Stage manager not available");
            if (window.gameInterface) {
                window.gameInterface.showMessage("Error: Stage manager not available", 2000);
            }
        }
    }
}
