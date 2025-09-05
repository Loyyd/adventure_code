export class Inventory {
    constructor() {
        this.items = new Map(); // Map of item type to quantity
        this.maxSlots = 20; // Maximum number of different item types
        this.itemDrops = new Map(); // Map of asset types to their possible drops
        this.onInventoryChange = null; // Callback for UI updates
        
        // Define which items are tools (can only be obtained once)
        this.toolTypes = new Set(['axe', 'pickaxe']);
        
        // Initialize item drops for different assets
        this.setupItemDrops();
    }

    setupItemDrops() {
        // Define what each asset can drop with their probabilities
        this.itemDrops.set('grass', [
            //{ item: 'axe', probability: 0.30, quantity: 1 },
            { item: 'seeds', probability: 0.50, quantity: 1 },
            { item: 'sticks', probability: 0.30, quantity: 1 },
            { item: 'seeds', probability: 0.50, quantity: 1 }
        ]);
        
        this.itemDrops.set('bush', [
            { item: 'berries', probability: 0.40, quantity: 2 },
            { item: 'sticks', probability: 0.40, quantity: 1 },
            { item: 'sticks', probability: 0.30, quantity: 1 },
            { item: 'seeds', probability: 0.20, quantity: 1 }
        ]);
        
        this.itemDrops.set('tree', [
            { item: 'wood', probability: 0.80, quantity: 3 },
            { item: 'sticks', probability: 0.60, quantity: 2 },
            //{ item: 'pickaxe', probability: 0.2, quantity: 1 }
        ]);
        
        this.itemDrops.set('rock', [
            { item: 'stone', probability: 0.70, quantity: 2 },
            { item: 'iron_ore', probability: 0.15, quantity: 1 },
            { item: 'gems', probability: 0.05, quantity: 1 }
        ]);
    }

    addItem(itemType, quantity = 1) {
        // Check if this is a tool and we already have it
        if (this.toolTypes.has(itemType) && this.items.has(itemType)) {
            return false;
        }
        
        if (this.items.has(itemType)) {
            // For tools, don't add to existing quantity (they should only have 1)
            if (this.toolTypes.has(itemType)) {
                return false;
            }
            this.items.set(itemType, this.items.get(itemType) + quantity);
        } else {
            if (this.items.size >= this.maxSlots) {
                return false;
            }
            // For tools, always set quantity to 1, regardless of requested quantity
            const actualQuantity = this.toolTypes.has(itemType) ? 1 : quantity;
            this.items.set(itemType, actualQuantity);
        }
        
        // Trigger UI update
        if (this.onInventoryChange) {
            this.onInventoryChange();
        }
        
        return true;
    }

    removeItem(itemType, quantity = 1) {
        if (!this.items.has(itemType)) {
            return false;
        }
        
        const currentQuantity = this.items.get(itemType);
        if (currentQuantity < quantity) {
            return false;
        }
        
        if (currentQuantity === quantity) {
            this.items.delete(itemType);
        } else {
            this.items.set(itemType, currentQuantity - quantity);
        }
        
        // Trigger UI update
        if (this.onInventoryChange) {
            this.onInventoryChange();
        }
        
        return true;
    }

    hasItem(itemType, quantity = 1) {
        return this.items.has(itemType) && this.items.get(itemType) >= quantity;
    }

    getItemCount(itemType) {
        return this.items.get(itemType) || 0;
    }

    // Check if an item is a tool
    isTool(itemType) {
        return this.toolTypes.has(itemType);
    }

    displayInventory() {
        console.log('Current Inventory:');
        if (this.items.size === 0) {
            console.log('  Empty');
        } else {
            for (const [item, quantity] of this.items) {
                console.log(`  ${item}: ${quantity}`);
            }
        }
    }

    // Generate item drops for a specific asset type
    generateDrops(assetType) {
        const drops = this.itemDrops.get(assetType);
        if (!drops) {
            return [];
        }

        const generatedDrops = [];
        
        for (const drop of drops) {
            // Skip tool drops if we already have that tool
            if (this.toolTypes.has(drop.item) && this.items.has(drop.item)) {
                continue;
            }
            
            const random = Math.random();
            if (random < drop.probability) {
                generatedDrops.push({
                    item: drop.item,
                    quantity: drop.quantity
                });
            }
        }

        return generatedDrops;
    }

    // Process drops from an asset interaction
    processAssetDrops(assetType) {
        const drops = this.generateDrops(assetType);
        let addedItems = [];
        
        for (const drop of drops) {
            if (this.addItem(drop.item, drop.quantity)) {
                addedItems.push(`${drop.quantity} ${drop.item}(s)`);
            }
        }

        if (addedItems.length > 0) {
            // Show item notification if user interface is available
            if (window.gameInterface) {
                window.gameInterface.showItemNotification(addedItems);
            }
        }

        return addedItems;
    }

    // Get a list of all items with their quantities
    getAllItems() {
        return Array.from(this.items.entries()).map(([item, quantity]) => ({
            item,
            quantity
        }));
    }
}
