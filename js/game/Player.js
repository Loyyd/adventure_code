import { Inventory } from './Inventory.js';
import { biomeAssets } from './BiomeAssets.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = { x: 0, z: 0 };
        this.mesh = new THREE.Group();
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.targetRotation = 0;
        this.rotationSpeed = 0.1; // Adjust this value to control rotation speed (0.1 = smooth, 1.0 = instant)
        this.interactionRange = 1.8; // Maximum distance for interactions in world units
        this.collisionRadius = 0.4; // Player collision radius against map hitboxes
        this.currentInteractionTarget = null; // Store the current object being interacted with
        this.inventory = new Inventory(); // Add inventory system
        
        // Debug visualization
        this.debugHitboxHelper = null; // Visual helper for player hitbox
        this.selectedTool = null; // Currently selected tool from hotbar
        // Interaction timing system
        this.interactionStartTime = null;
        // Interaction duration: base per asset (see biomeAssets), with debug scaling
        this.debugDurationScale = 0.2; // e.g., 20% of normal in debug mode
        this.isInteractionInProgress = false;
        this.interactionProgressCallback = null; // Callback for UI updates
        this.justCompletedInteraction = false; // Flag to prevent immediate re-interaction
        this.completionCooldownTime = 500; // Half second cooldown after completion
        
        this.loadCharacterModel();
        scene.add(this.mesh);
    }

    isDevelopment() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.hostname === '0.0.0.0';
    }

    getInteractionDurationForAsset(assetType) {
        // Default fallback if type unknown
        let duration = 3000;
        if (assetType && biomeAssets[assetType] && biomeAssets[assetType].interactionTimeMs) {
            duration = biomeAssets[assetType].interactionTimeMs;
        }
        const isDebugMode = window.gameControls && window.gameControls.isDebugMode();
        return isDebugMode ? Math.max(100, Math.floor(duration * this.debugDurationScale)) : duration;
    }

    async loadCharacterModel() {
        const loader = new THREE.GLTFLoader();
        try {
            let modelPath = 'glb/character/character.glb';
            
            // Add cache-busting for development environment
            if (this.isDevelopment()) {
                const cacheBuster = Date.now();
                modelPath = `${modelPath}?t=${cacheBuster}`;
                console.log(`[Player] Loading character with cache-bust: ${modelPath}`);
            }
            
            const gltf = await loader.loadAsync(modelPath);
            const model = gltf.scene;
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Scale and position the model as needed
            model.scale.set(1, 1, 1);
            this.mesh.add(model);

            // Setup animations
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                this.animations[clip.name] = this.mixer.clipAction(clip);
            });

            // Set default idle animation
            if (this.animations['Rig|Idle']) {
                this.playAnimation('Rig|Idle');
            } else {
                console.error('Idle animation not found!');
                console.log('Available animations:', Object.keys(this.animations));
            }
        } catch (error) {
            console.error('Error loading character model:', error);
        }
    }

    playAnimation(name) {
        // If animations aren't loaded yet, just return silently
        if (!this.mixer || Object.keys(this.animations).length === 0) {
            return;
        }

        if (this.currentAnimation === name) return; // Don't restart if it's already playing
        
        if (this.currentAnimation) {
            const prevAnim = this.animations[this.currentAnimation];
            if (prevAnim) {
                prevAnim.fadeOut(0.2);
            }
        }

        const newAnim = this.animations[name];
        if (newAnim) {
            newAnim.reset().fadeIn(0.2).play();
            this.currentAnimation = name;
        }
    }

    move(x, z, isMoving = false, isInteracting = false, interactionTarget = null) {
        const dx = x - this.position.x;
        const dz = z - this.position.z;
        
        // Update position
        this.position.x = x;
        this.position.z = z;
        this.mesh.position.x = x;
        this.mesh.position.z = z;

        // Handle interaction logic
        if (isInteracting && interactionTarget) {
            if (this.tryStartInteraction(interactionTarget)) {
                // Interaction is valid and started/continuing
                if (this.currentAnimation !== 'Rig|Interact') {
                    this.playAnimation('Rig|Interact');
                }
            } else {
                // Interaction failed or stopped
                this.stopInteraction();
                if (this.currentAnimation !== 'Rig|Idle') {
                    this.playAnimation('Rig|Idle');
                }
            }
        } else {
            // Not interacting anymore
            this.stopInteraction();
            
            if (isMoving && (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001)) {
                // Calculate target rotation angle based on movement direction
                this.targetRotation = Math.atan2(dx, dz);

                // Play running animation
                if (this.currentAnimation !== 'Rig|Running_A') {
                    this.playAnimation('Rig|Running_A');
                }
            } else if (!isMoving) {
                // Play idle animation when not moving
                if (this.currentAnimation !== 'Rig|Idle') {
                    this.playAnimation('Rig|Idle');
                }
            }
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Handle interaction timing
        this.updateInteraction();

        // Update hitbox helper position
        this.updateHitboxHelper();

        // Smooth rotation interpolation
        if (this.mesh.rotation.y !== this.targetRotation) {
            // Calculate the shortest rotation direction
            let delta = this.targetRotation - this.mesh.rotation.y;
            
            // Normalize the angle to [-PI, PI]
            while (delta > Math.PI) delta -= 2 * Math.PI;
            while (delta < -Math.PI) delta += 2 * Math.PI;
            
            // Apply smooth rotation
            this.mesh.rotation.y += delta * this.rotationSpeed;
            
            // Normalize the current rotation
            while (this.mesh.rotation.y > Math.PI) this.mesh.rotation.y -= 2 * Math.PI;
            while (this.mesh.rotation.y < -Math.PI) this.mesh.rotation.y += 2 * Math.PI;
        }
    }

    isItemInRange(itemPosition) {
        const dx = itemPosition.x - this.position.x;
        const dz = itemPosition.z - this.position.z;
        const distanceSquared = dx * dx + dz * dz;
        return distanceSquared <= (this.interactionRange * this.interactionRange);
    }

    isItemSelectable(item) {
        const assetType = this.getAssetType(item);
        
        // Check if item is a valid interactable asset
        const validAssets = ['grass', 'bush', 'tree', 'rock', 'campfire'];
        if (!validAssets.includes(assetType)) return false;

        // Special case: once a campfire is built (active), it should no longer be interactable
        if (assetType === 'campfire' && item && item.userData && item.userData.isActive) {
            return false;
        }

        return true;
    }

    canInteractWithAsset(assetType) {
        // Rules for tool requirements
        switch(assetType) {
            case 'tree':
                const hasAxe = this.selectedTool === 'axe';
                return hasAxe;
            case 'rock':
                const hasPickaxe = this.selectedTool === 'pickaxe';
                return hasPickaxe;
            case 'grass':
            case 'bush':
                return true; // No tool required
            case 'campfire':
                return true; // Can always interact with campfire
            default:
                return false;
        }
    }

    setSelectedTool(tool) {
        this.selectedTool = tool;
    }

    getSelectedTool() {
        return this.selectedTool;
    }

    faceTowards(position) {
        const dx = position.x - this.position.x;
        const dz = position.z - this.position.z;
        this.targetRotation = Math.atan2(dx, dz);
    }

    tryStartInteraction(item) {
        if (!item) return false;

        // If we just completed an interaction, don't start a new one immediately
        if (this.justCompletedInteraction) {
            return false;
        }

        // If we're already interacting with a different item, stop current interaction
        if (this.currentInteractionTarget && this.currentInteractionTarget !== item) {
            this.stopInteraction();
        }

        // Check if item is valid for interaction and we have the required tool
        const assetType = this.getAssetType(item);
        if (this.isItemSelectable(item) && this.isItemInRange(item.position)) {
            // Check if we have the required tool
            if (!this.canInteractWithAsset(assetType)) {
                return false;
            }

            // If this is a new interaction, start timing
            if (!this.isInteractionInProgress) {
                this.startInteraction(item);
            }
            
            this.currentInteractionTarget = item;
            this.faceTowards(item.position);
            return true;
        }

        this.stopInteraction();
        return false;
    }

    startInteraction(item) {
        this.isInteractionInProgress = true;
        this.interactionStartTime = Date.now();
        this.currentInteractionTarget = item;
        
        // Notify UI about interaction start
        if (this.interactionProgressCallback) {
            const assetType = this.getAssetType(item);
            const duration = this.getInteractionDurationForAsset(assetType);
            this.interactionProgressCallback(0, duration, item.position, assetType);
        }
    }

    stopInteraction() {
        if (this.isInteractionInProgress) {
            this.isInteractionInProgress = false;
            this.interactionStartTime = null;
            this.currentInteractionTarget = null;
            
            // Notify UI about interaction stop
            if (this.interactionProgressCallback) {
                this.interactionProgressCallback(null, null, null);
            }
        }
    }

    updateInteraction() {
        if (!this.isInteractionInProgress || !this.interactionStartTime) {
            return;
        }

        const elapsed = Date.now() - this.interactionStartTime;
        const assetType = this.getAssetType(this.currentInteractionTarget);
        const interactionDuration = this.getInteractionDurationForAsset(assetType);
        const progress = Math.min(elapsed / interactionDuration, 1.0);
        
        // Update UI progress
        if (this.interactionProgressCallback) {
            const targetPos = this.currentInteractionTarget ? this.currentInteractionTarget.position : null;
            this.interactionProgressCallback(elapsed, interactionDuration, targetPos, assetType);
        }

        // Check if interaction is complete
        if (elapsed >= interactionDuration) {
            this.completeInteraction();
        }
    }

    completeInteraction() {
        if (!this.currentInteractionTarget) {
            this.stopInteraction();
            return;
        }

        // Store the target before processing to prevent re-interaction
        const completedTarget = this.currentInteractionTarget;
        
        // Set completion flag to prevent immediate re-interaction
        this.justCompletedInteraction = true;
        
        // Determine asset type for special handling
        const assetType = this.getAssetType(completedTarget);
        
        if (assetType === 'campfire') {
            this.handleCampfireInteraction(completedTarget);
        } else if (assetType) {
            // Process normal item drops
            const receivedItems = this.inventory.processAssetDrops(assetType);
            
            // Remove the asset from the scene (it disappears)
            this.removeAssetFromScene(completedTarget);
            
            // Show feedback to player
            if (receivedItems.length > 0) {
                // Feedback is now handled by UI notification system
            }
        }

        // Stop the interaction and clear the target
        this.stopInteraction();
        this.currentInteractionTarget = null;
        
        // Clear the completion flag after a brief delay
        setTimeout(() => {
            this.justCompletedInteraction = false;
        }, this.completionCooldownTime);
    }

    handleCampfireInteraction(campfire) {
        // Check if campfire is already active
        if (campfire.userData && campfire.userData.isActive) {
            // Do not allow any further interaction with an active campfire
            return;
        }

        // Always show the campfire dialog with cost and current sticks; button will enable only if enough
        const requiredSticks = 20;
        this.showCampfireBuildDialog(campfire, requiredSticks);
    }

    showCampfireBuildDialog(campfire, requiredSticks) {
        // This will be handled by the UI system
        if (window.gameInterface) {
            window.gameInterface.showCampfireDialog(campfire, requiredSticks);
        } else {
            // Fallback: auto-confirm for now
            this.buildCampfire(campfire, requiredSticks);
        }
    }

    buildCampfire(campfire, requiredSticks) {
        // Remove sticks from inventory
        if (this.inventory.removeItem('sticks', requiredSticks)) {
            // Activate the campfire
            if (window.gameWorld) {
                window.gameWorld.activateCampfire(campfire);
            }
        } else {
            // Failed to remove sticks from inventory - should not happen
        }
    }

    getAssetType(asset) {
        // Check material name first
        let assetType = null;
        
        asset.traverse((child) => {
            if (child.isMesh && child.material && child.material.name) {
                const materialName = child.material.name.toLowerCase();
                if (materialName.includes('grass')) {
                    assetType = 'grass';
                } else if (materialName.includes('bush')) {
                    assetType = 'bush';
                } else if (materialName.includes('tree')) {
                    assetType = 'tree';
                } else if (materialName.includes('rock')) {
                    assetType = 'rock';
                }
            }
        });
        
        // Fallback: check by material name pattern created in World.js
        if (!assetType) {
            asset.traverse((child) => {
                if (child.isMesh && child.material && child.material.name) {
                    const materialName = child.material.name;
                    if (materialName.endsWith('Material')) {
                        // Extract the type from material names like "grassMaterial", "treeMaterial", etc.
                        const typeMatch = materialName.match(/^(\w+)Material$/);
                        if (typeMatch) {
                            assetType = typeMatch[1];
                        }
                    }
                }
            });
        }
        
        return assetType;
    }

    removeAssetFromScene(asset) {
        // Remove from scene
        this.scene.remove(asset);
        
        // Remove from world's asset instances tracking
        // This requires access to the world instance, which we'll need to pass or store
        if (window.gameWorld && window.gameWorld.assetInstances) {
            for (const [type, instances] of window.gameWorld.assetInstances) {
                const index = instances.indexOf(asset);
                if (index !== -1) {
                    instances.splice(index, 1);
                    break;
                }
            }
        }
    }

    setInteractionProgressCallback(callback) {
        this.interactionProgressCallback = callback;
    }

    // Legacy method for compatibility
    tryInteract(item) {
        return this.tryStartInteraction(item);
    }

    // Public method to check asset type (used by main.js for outline colors)
    getAssetTypePublic(item) {
        return this.getAssetType(item);
    }

    // Public method to check tool requirements (used by main.js for outline colors)
    canInteractWithAssetPublic(assetType) {
        return this.canInteractWithAsset(assetType);
    }

    // Debug hitbox visualization
    setShowHitbox(show) {
        // Remove existing helper
        if (this.debugHitboxHelper) {
            this.scene.remove(this.debugHitboxHelper);
            this.debugHitboxHelper = null;
        }

        if (!show) return;

        // Create a circle geometry to represent the player's collision radius
        const geometry = new THREE.RingGeometry(this.collisionRadius - 0.05, this.collisionRadius + 0.05, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        this.debugHitboxHelper = new THREE.Mesh(geometry, material);
        this.debugHitboxHelper.rotation.x = -Math.PI / 2; // Rotate to lie flat on ground
        this.debugHitboxHelper.position.copy(this.position);
        this.debugHitboxHelper.position.y = 0.01; // Slightly above ground to avoid z-fighting

        this.scene.add(this.debugHitboxHelper);
    }

    // Update hitbox helper position when player moves
    updateHitboxHelper() {
        if (this.debugHitboxHelper) {
            this.debugHitboxHelper.position.x = this.position.x;
            this.debugHitboxHelper.position.z = this.position.z;
        }
    }
}
