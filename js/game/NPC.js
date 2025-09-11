export class NPC {
    constructor(scene, name, characterModel, spawnPosition, targetPosition) {
        this.scene = scene;
        this.name = name;
        this.position = { x: spawnPosition.x, z: spawnPosition.z };
        this.targetPosition = { x: targetPosition.x, z: targetPosition.z };
        this.mesh = new THREE.Group();
        this.mixer = null;
        this.animations = {};
        this.currentAnimation = null;
        this.targetRotation = 0;
        this.rotationSpeed = 0.1;
        
        // NPC states
        this.state = 'walking'; // 'walking', 'wandering', 'talking'
        this.walkSpeed = 3.0;
        this.wanderRadius = 8.0;
        this.wanderTime = 0;
        this.wanderDirection = Math.random() * Math.PI * 2;
        this.wanderCenter = { x: targetPosition.x, z: targetPosition.z };
        this.interactionRange = 2.0;
        
        // Nametag
        this.nametag = null;
        this.nametagHeight = 2.5;
        
        // Shop state
        this.isShopOpen = false;
        
        this.loadCharacterModel(characterModel);
        this.createNametag();
        scene.add(this.mesh);
    }

    async loadCharacterModel(modelPath) {
        const loader = new THREE.GLTFLoader();
        try {
            let cacheBustedPath = modelPath;
            
            // Add cache-busting for development environment
            if (this.isDevelopment()) {
                const cacheBuster = Date.now();
                cacheBustedPath = `${modelPath}?t=${cacheBuster}`;
                console.log(`[NPC ${this.name}] Loading character with cache-bust: ${cacheBustedPath}`);
            }
            
            const gltf = await loader.loadAsync(cacheBustedPath);
            const model = gltf.scene;
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    // Make NPC slightly different color to distinguish from player
                    if (node.material) {
                        node.material = node.material.clone();
                        node.material.color.multiplyScalar(0.8); // Slightly darker
                    }
                }
            });

            // Scale and position the model
            model.scale.set(1, 1, 1);
            this.mesh.add(model);

            // Setup animations
            this.mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                this.animations[clip.name] = this.mixer.clipAction(clip);
            });

            // Set default walking animation
            if (this.animations['Rig|Running_A']) {
                this.playAnimation('Rig|Running_A');
            } else if (this.animations['Rig|Idle']) {
                this.playAnimation('Rig|Idle');
            } else {
                console.error('No suitable animations found for NPC!');
                console.log('Available animations:', Object.keys(this.animations));
            }
        } catch (error) {
            console.error(`Error loading NPC character model for ${this.name}:`, error);
        }
    }

    isDevelopment() {
        return location.hostname === 'localhost' || 
               location.hostname === '127.0.0.1' || 
               location.hostname === '0.0.0.0';
    }

    createNametag() {
        // Create canvas for nametag
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 128;
        canvas.height = 64;
        
        // Style the text
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 16, canvas.width, 32);
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, 38);
        
        // Create texture and material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1,
            depthTest: false,
            depthWrite: false
        });
        
        // Create sprite
        this.nametag = new THREE.Sprite(material);
        this.nametag.scale.set(2, 0.5, 1);
        this.nametag.position.set(0, this.nametagHeight, 0);
        
        // Make nametag always face camera
        this.nametag.renderOrder = 1000;
        
        this.mesh.add(this.nametag);
    }

    playAnimation(name) {
        if (!this.mixer || Object.keys(this.animations).length === 0) {
            return;
        }

        if (this.currentAnimation === name) return;
        
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

    update(deltaTime, playerPosition) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Update state machine
        switch (this.state) {
            case 'walking':
                this.updateWalking(deltaTime);
                break;
            case 'wandering':
                this.updateWandering(deltaTime);
                break;
            case 'talking':
                this.updateTalking(deltaTime, playerPosition);
                break;
        }

        // Smooth rotation interpolation
        if (this.mesh.rotation.y !== this.targetRotation) {
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

        // Update mesh position
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;

        // Make nametag face camera
        if (this.nametag && window.gameCamera) {
            const camera = window.gameCamera.getCamera();
            this.nametag.lookAt(camera.position);
        }
    }

    updateWalking(deltaTime) {
        // Move towards target position
        const dx = this.targetPosition.x - this.position.x;
        const dz = this.targetPosition.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        if (distance > 0.5) {
            // Calculate movement
            const moveDistance = this.walkSpeed * deltaTime;
            const normalizedDx = dx / distance;
            const normalizedDz = dz / distance;
            
            // Update position
            this.position.x += normalizedDx * moveDistance;
            this.position.z += normalizedDz * moveDistance;
            
            // Update rotation to face movement direction
            this.targetRotation = Math.atan2(normalizedDx, normalizedDz);
            
            // Play walking animation
            if (this.currentAnimation !== 'Rig|Running_A') {
                this.playAnimation('Rig|Running_A');
            }
        } else {
            // Reached target, switch to wandering
            this.state = 'wandering';
            this.wanderCenter = { x: this.targetPosition.x, z: this.targetPosition.z };
            this.playAnimation('Rig|Idle');
        }
    }

    updateWandering(deltaTime) {
        this.wanderTime += deltaTime;
        
        // Change direction every 3-5 seconds
        if (this.wanderTime > 3 + Math.random() * 2) {
            this.wanderDirection = Math.random() * Math.PI * 2;
            this.wanderTime = 0;
        }
        
        // Move in wander direction
        const moveSpeed = 0.3; // Slower than walking
        const targetX = this.position.x + Math.sin(this.wanderDirection) * moveSpeed * deltaTime;
        const targetZ = this.position.z + Math.cos(this.wanderDirection) * moveSpeed * deltaTime;
        
        // Check if still within wander radius
        const centerDx = targetX - this.wanderCenter.x;
        const centerDz = targetZ - this.wanderCenter.z;
        const centerDistance = Math.sqrt(centerDx * centerDx + centerDz * centerDz);
        
        if (centerDistance <= this.wanderRadius) {
            // Move to target position
            this.position.x = targetX;
            this.position.z = targetZ;
            
            // Update rotation
            this.targetRotation = this.wanderDirection;
            
            // Play walking animation
            if (this.currentAnimation !== 'Rig|Running_A') {
                this.playAnimation('Rig|Running_A');
            }
        } else {
            // Turn back towards center
            this.wanderDirection = Math.atan2(
                this.wanderCenter.x - this.position.x,
                this.wanderCenter.z - this.position.z
            );
            this.wanderTime = 0;
        }
    }

    updateTalking(deltaTime, playerPosition) {
        // Face the player
        if (playerPosition) {
            const dx = playerPosition.x - this.position.x;
            const dz = playerPosition.z - this.position.z;
            this.targetRotation = Math.atan2(dx, dz);
        }
        
        // Play idle animation
        if (this.currentAnimation !== 'Rig|Idle') {
            this.playAnimation('Rig|Idle');
        }
    }

    isPlayerInInteractionRange(playerPosition) {
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance <= this.interactionRange;
    }

    startInteraction(playerPosition) {
        if (this.isShopOpen) return; // Already interacting
        
        this.state = 'talking';
        this.isShopOpen = true;
        
        // Face the player
        const dx = playerPosition.x - this.position.x;
        const dz = playerPosition.z - this.position.z;
        this.targetRotation = Math.atan2(dx, dz);
        
        // Show shop UI
        this.showShop();
    }

    endInteraction() {
        this.state = 'wandering';
        this.isShopOpen = false;
        // Don't call hideShop() here to avoid circular dependency
        // The UI will handle closing the shop
    }

    showShop() {
        if (window.gameInterface) {
            window.gameInterface.showNPCShop(this);
        }
    }

    hideShop() {
        if (window.gameInterface) {
            window.gameInterface.hideNPCShop();
        }
    }

    // Shop inventory - Bob sells tools for sticks
    getShopItems() {
        return [
            {
                id: 'axe',
                name: 'Axe',
                description: 'Cut down trees to get wood',
                price: 15,
                currency: 'sticks',
                icon: '🪓'
            },
            {
                id: 'pickaxe',
                name: 'Pickaxe', 
                description: 'Mine rocks to get stones',
                price: 20,
                currency: 'sticks',
                icon: '⛏️'
            }
        ];
    }

    canAffordItem(item, playerInventory) {
        const playerSticks = playerInventory.getItemCount(item.currency);
        return playerSticks >= item.price;
    }

    purchaseItem(item, playerInventory) {
        if (!this.canAffordItem(item, playerInventory)) {
            return false;
        }
        
        // Remove currency from player
        if (playerInventory.removeItem(item.currency, item.price)) {
            // Give item to player
            playerInventory.addItem(item.id, 1);
            return true;
        }
        
        return false;
    }

    // Get the position where Bob should spawn (in deep caves)
    static getSpawnPosition() {
        // Find a position in deep caves biome
        // For now, use a fixed position that's likely to be in caves
        return { x: -15, z: -15 }; // Adjust based on your map
    }

    // Remove NPC from scene
    destroy() {
        if (this.mesh && this.mesh.parent) {
            this.mesh.parent.remove(this.mesh);
        }
        
        // Clean up animations
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }
        
        // Hide shop if open - call UI directly to avoid circular dependency
        if (this.isShopOpen && window.gameInterface) {
            window.gameInterface.hideNPCShop();
        }
    }
}
