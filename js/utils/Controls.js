export class Controls {
    constructor() {
        this.keys = {};
        this.isInteracting = false;
        this.lastMousePosition = { x: 0, y: 0 }; // Track mouse position
        this.onInventoryToggle = null; // Callback for inventory toggle
        this.onHotbarSelection = null; // Callback for hotbar slot selection
        this.onDebugToggle = null; // Callback for debug mode toggle
        this.debugMode = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle inventory toggle
            if (e.code === 'KeyI' && this.onInventoryToggle) {
                this.onInventoryToggle();
            }
            
            // Handle debug mode toggle (P key)
            if (e.code === 'KeyP') {
                this.debugMode = !this.debugMode;
                if (this.onDebugToggle) {
                    this.onDebugToggle(this.debugMode);
                }
            }
            
            // Debug mode controls
            if (this.debugMode) {
                switch(e.code) {
                    case 'KeyT': // T - Teleport to campfire
                        if (window.gameWorld) {
                            this.teleportToCampfire();
                        }
                        break;
                    case 'KeyN': // N - Toggle day/night cycle
                        if (window.gameDayNight) {
                            window.gameDayNight.togglePause();
                        }
                        break;
                    case 'KeyM': // M - Set to day
                        if (window.gameDayNight) {
                            window.gameDayNight.setTimeOfDay(0.5); // Noon
                        }
                        break;
                    case 'KeyB': // B - Set to night
                        if (window.gameDayNight) {
                            window.gameDayNight.setTimeOfDay(0.0); // Midnight
                        }
                        break;
                    case 'KeyH': // H - Toggle hitbox visualization
                        this.toggleHitboxes();
                        break;
                }
            }
            
            // Handle hotbar number keys 1-4
            if (this.onHotbarSelection) {
                switch(e.code) {
                    case 'Digit1':
                        this.onHotbarSelection(0);
                        break;
                    case 'Digit2':
                        this.onHotbarSelection(1);
                        break;
                    case 'Digit3':
                        this.onHotbarSelection(2);
                        break;
                    case 'Digit4':
                        this.onHotbarSelection(3);
                        break;
                }
            }
        });
        
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // Track mouse position
        document.addEventListener('mousemove', (e) => {
            this.lastMousePosition.x = e.clientX;
            this.lastMousePosition.y = e.clientY;
        });
        
        // Add mouse click listener
        document.addEventListener('mousedown', (e) => {
            // Don't interfere with UI elements at all
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('button') ||
                e.target.closest('#debugOverlay') ||
                e.target.closest('#externalDebugButtons') ||
                e.target.closest('#inventoryModal') ||
                e.target.id === 'debugOverlay' ||
                e.target.id === 'externalDebugButtons') {
                // Silently ignore UI interactions
                return;
            }
            
            if (e.button === 0) { // Left click
                this.isInteracting = true;
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            // Don't interfere with UI elements at all
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('button') ||
                e.target.closest('#debugOverlay') ||
                e.target.closest('#externalDebugButtons') ||
                e.target.closest('#inventoryModal') ||
                e.target.id === 'debugOverlay' ||
                e.target.id === 'externalDebugButtons') {
                // Silently ignore UI interactions
                return;
            }
            
            if (e.button === 0) { // Left click
                this.isInteracting = false;
            }
        });

        // Also add click handler to completely block game clicks on UI
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('button') ||
                e.target.closest('#debugOverlay') ||
                e.target.closest('#externalDebugButtons') ||
                e.target.closest('#inventoryModal')) {
                // Silently block the event propagation
                // Important: this listener runs in the bubbling phase so button onclicks still fire
                e.stopPropagation();
                return;
            }
        }, false); // Use bubbling phase to avoid preventing target handlers
    }

    getMovement() {
        const speed = 0.1;
        let movement = { x: 0, z: 0, moved: false };

        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            movement.z -= speed;
            movement.moved = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            movement.z += speed;
            movement.moved = true;
        }
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            movement.x -= speed;
            movement.moved = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            movement.x += speed;
            movement.moved = true;
        }

        return movement;
    }

    isPlayerInteracting() {
        return this.isInteracting;
    }

    getLastMousePosition() {
        return this.lastMousePosition;
    }

    giveDebugItems() {
        // Give useful debug items
        const player = window.gamePlayer;
        if (player && player.inventory) {
            player.inventory.addItem('sticks', 50);
            player.inventory.addItem('wood', 20);
            player.inventory.addItem('stone', 10);
            player.inventory.addItem('axe', 1);
            player.inventory.addItem('pickaxe', 1);
            if (window.gameInterface) {
                window.gameInterface.showMessage('Debug items added to inventory!');
            }
        }
    }

    teleportToCampfire() {
        // Find and teleport to campfire
        const world = window.gameWorld;
        const player = window.gamePlayer;
        if (world && world.assetInstances && player) {
            const campfires = world.assetInstances.get('campfire');
            if (campfires && campfires.length > 0) {
                const campfire = campfires[0];
                player.position.x = campfire.position.x + 2; // Offset a bit
                player.position.z = campfire.position.z + 2;
                player.mesh.position.x = player.position.x;
                player.mesh.position.z = player.position.z;
                
                // Update camera
                if (window.gameCamera) {
                    window.gameCamera.setTarget(player.position.x, player.position.z);
                }
                
                if (window.gameInterface) {
                    window.gameInterface.showMessage('Teleported to campfire!');
                }
            } else {
                if (window.gameInterface) {
                    window.gameInterface.showMessage('No campfire found in the world');
                }
            }
        }
    }

    toggleHitboxes() {
        if (window.gameWorld && window.gameWorld.setShowHitboxes) {
            // Check if hitboxes are currently visible
            const currentlyVisible = window.gameWorld.debugHitboxHelpers && window.gameWorld.debugHitboxHelpers.length > 0;
            
            // Toggle them
            window.gameWorld.setShowHitboxes(!currentlyVisible);
            
            // Also toggle player hitbox
            if (window.gamePlayer && window.gamePlayer.setShowHitbox) {
                window.gamePlayer.setShowHitbox(!currentlyVisible);
            }
            
            // Show message
            if (window.gameInterface) {
                const message = !currentlyVisible ? 'Hitboxes enabled' : 'Hitboxes disabled';
                window.gameInterface.showMessage(message);
            }
        }
    }

    isDebugMode() {
        return this.debugMode;
    }

    listAllAssets() {
        // This is a debug function that logs to console - keep the console logs here
        console.log('=== ASSET DEBUG INFO ===');
        const world = window.gameWorld;
        if (world && world.assetInstances) {
            for (const [type, instances] of world.assetInstances) {
                console.log(`${type.toUpperCase()}: ${instances.length} instances`);
                instances.forEach((instance, index) => {
                    console.log(`  ${index}: Position (${instance.position.x.toFixed(2)}, ${instance.position.y.toFixed(2)}, ${instance.position.z.toFixed(2)})`);
                    if (type === 'campfire') {
                        console.log(`    Active: ${instance.userData?.isActive || false}`);
                        console.log(`    Asset Type: ${instance.userData?.assetType || 'undefined'}`);
                    }
                });
            }
        } else {
            console.log('No world or asset instances found');
        }
        console.log('=== END ASSET DEBUG ===');
        
        if (window.gameInterface) {
            window.gameInterface.showMessage('Asset info logged to console (F12)');
        }
    }
}
