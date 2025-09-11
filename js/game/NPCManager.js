import { NPC } from './NPC.js';

export class NPCManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.npcs = new Map(); // Map of NPC instances by name
        this.interactingNPC = null; // Currently interacting NPC
    }

    spawnBob(campfirePosition) {
        // Check if Bob already exists
        if (this.npcs.has('Bob')) {
            console.log('Bob already exists, not spawning again');
            return;
        }

        // Find a spawn position in deep caves
        const spawnPosition = this.findSpawnPositionInCaves();
        
        // Create Bob NPC
        const bob = new NPC(
            this.scene,
            'Bob',
            'glb/character/character.glb',
            spawnPosition,
            campfirePosition
        );

        this.npcs.set('Bob', bob);
        console.log(`Spawned Bob at position ${spawnPosition.x}, ${spawnPosition.z}, walking to campfire at ${campfirePosition.x}, ${campfirePosition.z}`);
    }

    findSpawnPositionInCaves() {
        // Try to find a good spawn position in deep caves biome
        // We'll sample several potential positions and pick the first one that's in caves
        const candidates = [
            { x: -15, z: -15 },
            { x: -20, z: -10 },
            { x: -10, z: -20 },
            { x: -25, z: -15 },
            { x: -15, z: -25 }
        ];

        for (const candidate of candidates) {
            const biome = this.world.getBiomeAt(candidate.x, candidate.z);
            if (biome === 'DEEP CAVES') {
                // Check if position is free (not blocked by map or assets)
                if (!this.world.isPositionBlocked(candidate.x, candidate.z, 0.4) &&
                    !this.world.checkAssetCollision(candidate.x, candidate.z, 0.4)) {
                    return candidate;
                }
            }
        }

        // Fallback to a position that should be in caves based on typical map layout
        // We'll use the nearest free position function to ensure it's not blocked
        const fallbackPos = { x: -15, z: -15 };
        const freePos = this.world.findNearestFreePositionWithAssets(
            fallbackPos.x, fallbackPos.z, 0.4, 10, 0.5, 16
        );
        
        return freePos || fallbackPos;
    }

    update(deltaTime, playerPosition) {
        // Update all NPCs
        for (const npc of this.npcs.values()) {
            npc.update(deltaTime, playerPosition);
        }

        // Check for player interaction with NPCs
        this.checkPlayerNPCInteraction(playerPosition);
    }

    checkPlayerNPCInteraction(playerPosition) {
        // If we're already interacting with an NPC, check if player moved away
        if (this.interactingNPC) {
            if (!this.interactingNPC.isPlayerInInteractionRange(playerPosition)) {
                this.interactingNPC.endInteraction();
                // Also close the shop UI
                if (window.gameInterface) {
                    window.gameInterface.hideNPCShop();
                }
                this.interactingNPC = null;
            }
            return; // Don't check for new interactions while already interacting
        }

        // Check if player is near any NPC and wants to interact
        for (const npc of this.npcs.values()) {
            if (npc.isPlayerInInteractionRange(playerPosition)) {
                // Check if player is pressing the interaction key
                if (window.gameControls && window.gameControls.isInteracting) {
                    npc.startInteraction(playerPosition);
                    this.interactingNPC = npc;
                    break;
                }
            }
        }
    }

    // Get NPC by name
    getNPC(name) {
        return this.npcs.get(name);
    }

    // Remove NPC
    removeNPC(name) {
        const npc = this.npcs.get(name);
        if (npc) {
            npc.destroy();
            this.npcs.delete(name);
            
            if (this.interactingNPC === npc) {
                this.interactingNPC = null;
            }
        }
    }

    // Remove all NPCs
    removeAllNPCs() {
        for (const [name, npc] of this.npcs) {
            npc.destroy();
        }
        this.npcs.clear();
        this.interactingNPC = null;
    }

    // Get all NPC positions for debugging or other purposes
    getAllNPCPositions() {
        const positions = {};
        for (const [name, npc] of this.npcs) {
            positions[name] = { x: npc.position.x, z: npc.position.z };
        }
        return positions;
    }
}
