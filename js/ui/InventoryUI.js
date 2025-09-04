export class InventoryUI {
    constructor(player) {
        this.player = player;
        this.isOpen = false;
        this.characterScene = null;
        this.characterCamera = null;
        this.characterRenderer = null;
        this.characterModel = null;
        this.characterMixer = null;
        this.characterAnimations = {};
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.rotationY = 0;
        this.animationClock = new THREE.Clock();
        
        // Hotbar system
        this.hotbarSlots = 4;
        this.selectedHotbarSlot = 0; // Currently selected slot (0-3)
        this.hotbarItems = []; // Array of items in hotbar slots
        
        this.createInventoryModal();
        this.createHotbar();
        this.setupCharacterViewer();
        this.setupEventListeners();
        
        // Item images mapping
        this.itemImages = {
            'seeds': '🌱',
            'axe': '🪓',
            'berries': '🫐',
            'sticks': '🏒',
            'wood': '🪵',
            'stone': '🪨',
            'iron_ore': '⛏️',
            'pickaxe': '⛏️'
        };
    }

    createInventoryModal() {
        // Create main inventory container
        this.inventoryModal = document.createElement('div');
        this.inventoryModal.id = 'inventoryModal';
        this.inventoryModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            z-index: 2000;
            font-family: Arial, sans-serif;
        `;

        // Create inventory content container
        const inventoryContent = document.createElement('div');
        inventoryContent.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            height: 70%;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            display: flex;
            overflow: hidden;
        `;

        // Create character viewer section
        const characterSection = document.createElement('div');
        characterSection.style.cssText = `
            width: 40%;
            background: linear-gradient(135deg, #1a252f, #2c3e50);
            display: flex;
            flex-direction: column;
            border-right: 2px solid #3498db;
        `;

        const characterTitle = document.createElement('h3');
        characterTitle.textContent = 'Character';
        characterTitle.style.cssText = `
            margin: 0;
            padding: 20px;
            color: #ecf0f1;
            text-align: center;
            background: rgba(52, 152, 219, 0.2);
            border-bottom: 1px solid #3498db;
        `;

        this.characterViewerContainer = document.createElement('div');
        this.characterViewerContainer.id = 'characterViewer';
        this.characterViewerContainer.style.cssText = `
            flex: 1;
            position: relative;
            cursor: grab;
        `;

        const viewerInstructions = document.createElement('div');
        viewerInstructions.textContent = 'Click and drag to rotate';
        viewerInstructions.style.cssText = `
            position: absolute;
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            color: #95a5a6;
            font-size: 12px;
            text-align: center;
            pointer-events: none;
        `;

        characterSection.appendChild(characterTitle);
        characterSection.appendChild(this.characterViewerContainer);
        characterSection.appendChild(viewerInstructions);

        // Create inventory items section
        const itemsSection = document.createElement('div');
        itemsSection.style.cssText = `
            width: 60%;
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #2c3e50, #34495e);
        `;

        const itemsTitle = document.createElement('h3');
        itemsTitle.textContent = 'Inventory';
        itemsTitle.style.cssText = `
            margin: 0;
            padding: 20px;
            color: #ecf0f1;
            text-align: center;
            background: rgba(231, 76, 60, 0.2);
            border-bottom: 1px solid #e74c3c;
        `;

        this.itemsGrid = document.createElement('div');
        this.itemsGrid.style.cssText = `
            flex: 1;
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            overflow-y: auto;
            max-height: calc(100% - 60px);
        `;

        // Create slots for inventory items
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.style.cssText = `
                aspect-ratio: 1;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid #34495e;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.3s ease;
                min-height: 80px;
            `;

            slot.addEventListener('mouseenter', () => {
                slot.style.borderColor = '#3498db';
                slot.style.background = 'rgba(52, 152, 219, 0.1)';
            });

            slot.addEventListener('mouseleave', () => {
                slot.style.borderColor = '#34495e';
                slot.style.background = 'rgba(0, 0, 0, 0.3)';
            });

            this.itemsGrid.appendChild(slot);
        }

        itemsSection.appendChild(itemsTitle);
        itemsSection.appendChild(this.itemsGrid);

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            width: 40px;
            height: 40px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s ease;
        `;

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.background = '#c0392b';
        });

        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.background = '#e74c3c';
        });

        closeButton.addEventListener('click', () => {
            this.closeInventory();
        });

        inventoryContent.appendChild(characterSection);
        inventoryContent.appendChild(itemsSection);
        inventoryContent.appendChild(closeButton);
        this.inventoryModal.appendChild(inventoryContent);
        document.body.appendChild(this.inventoryModal);
    }

    createHotbar() {
        // Create persistent hotbar container
        this.hotbarContainer = document.createElement('div');
        this.hotbarContainer.id = 'hotbar';
        this.hotbarContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1500;
            font-family: Arial, sans-serif;
        `;

        // Create hotbar slots
        this.hotbarSlotElements = [];
        for (let i = 0; i < this.hotbarSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.style.cssText = `
                width: 80px;
                height: 80px;
                background: rgba(0, 0, 0, 0.7);
                border: 3px solid ${i === this.selectedHotbarSlot ? '#3498db' : '#34495e'};
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
            `;

            // Add slot number indicator
            const slotNumber = document.createElement('div');
            slotNumber.style.cssText = `
                position: absolute;
                top: 5px;
                left: 8px;
                color: #95a5a6;
                font-size: 12px;
                font-weight: bold;
            `;
            slotNumber.textContent = (i + 1).toString();
            slot.appendChild(slotNumber);

            this.hotbarSlotElements.push(slot);
            this.hotbarContainer.appendChild(slot);
        }

        document.body.appendChild(this.hotbarContainer);
    }

    setupCharacterViewer() {
        // Create Three.js scene for character viewer
        this.characterScene = new THREE.Scene();
        this.characterScene.background = new THREE.Color(0x1a252f);

        // Create camera
        this.characterCamera = new THREE.PerspectiveCamera(
            45,
            this.characterViewerContainer.clientWidth / this.characterViewerContainer.clientHeight,
            0.1,
            1000
        );
        this.characterCamera.position.set(0, 1.6, 4);
        this.characterCamera.lookAt(0, 1, 0);

        // Create renderer
        this.characterRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.characterRenderer.setSize(
            this.characterViewerContainer.clientWidth,
            this.characterViewerContainer.clientHeight
        );
        this.characterRenderer.shadowMap.enabled = true;
        this.characterRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.characterScene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 2, 2);
        directionalLight.castShadow = true;
        this.characterScene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0x4080ff, 0.3);
        fillLight.position.set(-2, 1, -1);
        this.characterScene.add(fillLight);

        this.characterViewerContainer.appendChild(this.characterRenderer.domElement);

        // Load character model
        this.loadCharacterModel();
    }

    async loadCharacterModel() {
        const loader = new THREE.GLTFLoader();
        try {
            const gltf = await loader.loadAsync('glb/character/character.glb');
            
            // Create a group container exactly like in Player.js
            this.characterModel = new THREE.Group();
            
            // Use SkeletonUtils for proper cloning of animated models
            const model = THREE.SkeletonUtils.clone(gltf.scene);
            
            // Debug: Add wireframe view option
            let hasValidMeshes = false;
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    hasValidMeshes = true;
                    
                    // Compute bounding box for mesh
                    node.geometry.computeBoundingBox();
                    
                    // Optional: add wireframe for debugging
                    if (window.debugInventoryModel) {
                        const wireframe = new THREE.WireframeGeometry(node.geometry);
                        const line = new THREE.LineSegments(wireframe);
                        line.material.color.setHex(0xff0000);
                        node.add(line);
                    }
                }
            });
            
            // Scale and position the model exactly like Player.js
            model.scale.set(1, 1, 1);
            this.characterModel.add(model);
            
            // Add the group to the scene
            this.characterScene.add(this.characterModel);

            // Setup animations exactly like Player.js using the cloned model
            this.characterMixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
                this.characterAnimations[clip.name] = this.characterMixer.clipAction(clip);
            });

            // Start idle animation exactly like Player.js
            if (this.characterAnimations['Rig|Idle']) {
                const idleAction = this.characterAnimations['Rig|Idle'];
                idleAction.play();
            } else {
                console.error('Idle animation not found in inventory!');
                console.log('Available animations:', Object.keys(this.characterAnimations));
            }

            // Start animation loop for character viewer
            this.animateCharacterViewer();
        } catch (error) {
            console.error('Error loading character model for inventory:', error);
        }
    }

    logModelStructure(object, depth = 0) {
        const indent = '  '.repeat(depth);
        console.log(`${indent}${object.type}: ${object.name || 'unnamed'}`);
        console.log(`${indent}  Position: (${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)})`);
        console.log(`${indent}  Scale: (${object.scale.x.toFixed(2)}, ${object.scale.y.toFixed(2)}, ${object.scale.z.toFixed(2)})`);
        
        if (object.isMesh) {
            console.log(`${indent}  Material: ${object.material?.name || 'unnamed'}`);
        }
        
        object.children.forEach(child => {
            this.logModelStructure(child, depth + 1);
        });
    }

    setupEventListeners() {
        // Mouse events for character rotation
        this.characterViewerContainer.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
            this.characterViewerContainer.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.previousMousePosition.x;
                this.rotationY += deltaX * 0.01;
                
                if (this.characterModel) {
                    this.characterModel.rotation.y = this.rotationY;
                }
                
                this.previousMousePosition = { x: e.clientX, y: e.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.characterViewerContainer.style.cursor = 'grab';
        });

        // Close inventory on escape key
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape' && this.isOpen) {
                this.closeInventory();
            }
        });
    }

    animateCharacterViewer() {
        if (this.isOpen && this.characterRenderer && this.characterScene && this.characterCamera) {
            // Update animations
            if (this.characterMixer) {
                const deltaTime = this.animationClock.getDelta();
                this.characterMixer.update(deltaTime);
            }
            
            this.characterRenderer.render(this.characterScene, this.characterCamera);
        }
        requestAnimationFrame(() => this.animateCharacterViewer());
    }

    // Hotbar management methods
    selectHotbarSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.hotbarSlots) {
            return;
        }
        
        // Update visual selection
        this.hotbarSlotElements[this.selectedHotbarSlot].style.borderColor = '#34495e';
        this.selectedHotbarSlot = slotIndex;
        this.hotbarSlotElements[this.selectedHotbarSlot].style.borderColor = '#3498db';
        
        // Update player's selected tool
        this.updatePlayerSelectedTool();
    }

    getSelectedTool() {
        const selectedItem = this.hotbarItems[this.selectedHotbarSlot];
        if (selectedItem && this.player.inventory.isTool(selectedItem.item)) {
            return selectedItem.item;
        }
        return null;
    }

    updatePlayerSelectedTool() {
        const selectedTool = this.getSelectedTool();
        if (this.player.setSelectedTool) {
            this.player.setSelectedTool(selectedTool);
        }
    }

    updateHotbarDisplay() {
        // Get player's inventory items
        const allItems = this.player.inventory.getAllItems();
        
        // First, populate hotbar with tools and important items
        this.hotbarItems = [];
        
        // Priority order: tools first, then other items
        const tools = allItems.filter(item => this.player.inventory.isTool(item.item));
        const nonTools = allItems.filter(item => !this.player.inventory.isTool(item.item));
        
        // Fill hotbar slots (tools get priority)
        const priorityItems = [...tools, ...nonTools];
        for (let i = 0; i < this.hotbarSlots && i < priorityItems.length; i++) {
            this.hotbarItems[i] = priorityItems[i];
        }
        
        // Update visual display of hotbar
        for (let i = 0; i < this.hotbarSlots; i++) {
            const slot = this.hotbarSlotElements[i];
            
            // Clear slot content (except slot number)
            const slotNumber = slot.querySelector('div');
            slot.innerHTML = '';
            slot.appendChild(slotNumber);
            
            const item = this.hotbarItems[i];
            if (item) {
                // Create item icon
                const itemIcon = document.createElement('div');
                itemIcon.style.cssText = `
                    font-size: 32px;
                    margin-bottom: 5px;
                `;
                itemIcon.textContent = this.itemImages[item.item] || '📦';

                // Create item name
                const itemName = document.createElement('div');
                itemName.style.cssText = `
                    color: #ecf0f1;
                    font-size: 10px;
                    text-align: center;
                    margin-bottom: 2px;
                    text-transform: capitalize;
                    max-width: 70px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                `;
                itemName.textContent = item.item.replace('_', ' ');

                // Add quantity if not a tool and quantity > 1
                const isTool = this.player.inventory.isTool(item.item);
                if (!isTool && item.quantity > 1) {
                    const itemQuantity = document.createElement('div');
                    itemQuantity.style.cssText = `
                        position: absolute;
                        bottom: 5px;
                        right: 8px;
                        background: #e74c3c;
                        color: white;
                        border-radius: 8px;
                        padding: 2px 6px;
                        font-size: 10px;
                        font-weight: bold;
                        min-width: 16px;
                        text-align: center;
                    `;
                    itemQuantity.textContent = item.quantity;
                    slot.appendChild(itemQuantity);
                } else if (isTool) {
                    // Add tool indicator
                    const toolIndicator = document.createElement('div');
                    toolIndicator.style.cssText = `
                        position: absolute;
                        bottom: 5px;
                        right: 8px;
                        background: #f39c12;
                        color: white;
                        border-radius: 8px;
                        padding: 1px 4px;
                        font-size: 8px;
                        font-weight: bold;
                        text-align: center;
                    `;
                    toolIndicator.textContent = 'T';
                    slot.appendChild(toolIndicator);
                }

                slot.appendChild(itemIcon);
                slot.appendChild(itemName);
            }
        }
        
        // Update player's selected tool
        this.updatePlayerSelectedTool();
    }

    updateInventoryDisplay(items) {
        const slots = this.itemsGrid.children;
        
        // Clear all slots
        for (let i = 0; i < slots.length; i++) {
            slots[i].innerHTML = '';
        }

        // Populate slots with items
        items.forEach((item, index) => {
            if (index < slots.length) {
                const slot = slots[index];
                
                // Create item icon
                const itemIcon = document.createElement('div');
                itemIcon.style.cssText = `
                    font-size: 32px;
                    margin-bottom: 5px;
                `;
                itemIcon.textContent = this.itemImages[item.item] || '📦';

                // Create item name
                const itemName = document.createElement('div');
                itemName.style.cssText = `
                    color: #ecf0f1;
                    font-size: 10px;
                    text-align: center;
                    margin-bottom: 2px;
                    text-transform: capitalize;
                `;
                itemName.textContent = item.item.replace('_', ' ');

                // Create quantity (only for non-tools)
                const isTool = this.player.inventory.isTool(item.item);
                if (!isTool && item.quantity > 1) {
                    const itemQuantity = document.createElement('div');
                    itemQuantity.style.cssText = `
                        position: absolute;
                        bottom: 5px;
                        right: 5px;
                        background: #e74c3c;
                        color: white;
                        border-radius: 10px;
                        padding: 2px 6px;
                        font-size: 12px;
                        font-weight: bold;
                        min-width: 20px;
                        text-align: center;
                    `;
                    itemQuantity.textContent = item.quantity;
                    slot.appendChild(itemQuantity);
                } else if (isTool) {
                    // Add a special indicator for tools
                    const toolIndicator = document.createElement('div');
                    toolIndicator.style.cssText = `
                        position: absolute;
                        bottom: 5px;
                        right: 5px;
                        background: #f39c12;
                        color: white;
                        border-radius: 10px;
                        padding: 2px 6px;
                        font-size: 10px;
                        font-weight: bold;
                        text-align: center;
                    `;
                    toolIndicator.textContent = 'TOOL';
                    slot.appendChild(toolIndicator);
                }

                slot.appendChild(itemIcon);
                slot.appendChild(itemName);

                // Add hover effect for items
                slot.style.cursor = 'pointer';
                slot.addEventListener('click', () => {
                    this.showItemTooltip(item, slot);
                });
            }
        });
        
        // Update hotbar display as well
        this.updateHotbarDisplay();
    }

    showItemTooltip(item, slot) {
        // Remove existing tooltip
        const existingTooltip = document.getElementById('itemTooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        const tooltip = document.createElement('div');
        tooltip.id = 'itemTooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 3000;
            max-width: 200px;
            border: 1px solid #3498db;
        `;

        const isTool = this.player.inventory.isTool(item.item);
        const itemName = item.item.replace('_', ' ').toUpperCase();
        
        if (isTool) {
            tooltip.innerHTML = `
                <strong>${itemName}</strong><br>
                <span style="color: #f39c12;">⚡ UNIQUE TOOL ⚡</span><br>
                <small>Required for certain resources</small><br>
                <small style="color: #95a5a6;">Cannot obtain another</small>
            `;
        } else {
            tooltip.innerHTML = `
                <strong>${itemName}</strong><br>
                Quantity: ${item.quantity}<br>
                <small>Click to use (if applicable)</small>
            `;
        }

        document.body.appendChild(tooltip);

        const rect = slot.getBoundingClientRect();
        tooltip.style.left = (rect.right + 10) + 'px';
        tooltip.style.top = rect.top + 'px';

        // Remove tooltip after 3 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 3000);
    }

    toggleInventory() {
        if (this.isOpen) {
            this.closeInventory();
        } else {
            this.openInventory();
        }
    }

    openInventory() {
        this.isOpen = true;
        this.inventoryModal.style.display = 'block';
        
        // Update inventory display
        this.updateInventoryDisplay(this.player.inventory.getAllItems());
        
        // Restart idle animation for character viewer
        if (this.characterMixer && this.characterAnimations['Rig|Idle']) {
            const idleAction = this.characterAnimations['Rig|Idle'];
            idleAction.reset().play();
        }
        
        // Resize character viewer if needed
        setTimeout(() => {
            if (this.characterRenderer) {
                const width = this.characterViewerContainer.clientWidth;
                const height = this.characterViewerContainer.clientHeight;
                this.characterRenderer.setSize(width, height);
                this.characterCamera.aspect = width / height;
                this.characterCamera.updateProjectionMatrix();
            }
        }, 100);
    }

    closeInventory() {
        this.isOpen = false;
        this.inventoryModal.style.display = 'none';
        
        // Remove any existing tooltips
        const tooltip = document.getElementById('itemTooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    handleResize() {
        if (this.characterRenderer && this.isOpen) {
            const width = this.characterViewerContainer.clientWidth;
            const height = this.characterViewerContainer.clientHeight;
            this.characterRenderer.setSize(width, height);
            this.characterCamera.aspect = width / height;
            this.characterCamera.updateProjectionMatrix();
        }
    }
}
