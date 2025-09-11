export class StageManager {
    constructor(world, player) {
        this.world = world;
        this.player = player;
        this.currentStage = 0;
        this.stages = {
            1: {
                name: "Campfire Built",
                description: "Build a campfire to attract Bob the merchant",
                completed: false
            },
            2: {
                name: "Pickaxe Acquired",
                description: "Obtain a pickaxe for mining",
                completed: false
            },
            3: {
                name: "Stage 3",
                description: "Future stage - not yet implemented",
                completed: false
            }
        };
        
        // Store references to game objects
        this.activeCampfire = null;
    }

    // Check if a stage is completed
    isStageCompleted(stageNumber) {
        return this.stages[stageNumber] && this.stages[stageNumber].completed;
    }

    // Get current stage
    getCurrentStage() {
        return this.currentStage;
    }

    // Update stage progression based on game state
    checkStageProgression() {
        // Stage 1: Check if campfire is built
        if (!this.isStageCompleted(1)) {
            const campfires = this.findActiveCampfires();
            if (campfires.length > 0) {
                this.completeStage(1);
                this.activeCampfire = campfires[0];
            }
        }

        // Stage 2: Check if player has pickaxe
        if (!this.isStageCompleted(2) && this.isStageCompleted(1)) {
            if (this.player.inventory.hasItem('pickaxe')) {
                this.completeStage(2);
            }
        }

        // Update current stage to highest completed + 1
        let highestCompleted = 0;
        for (let i = 1; i <= 3; i++) {
            if (this.isStageCompleted(i)) {
                highestCompleted = i;
            }
        }
        this.currentStage = Math.min(highestCompleted + 1, 3);
    }

    // Complete a specific stage
    completeStage(stageNumber) {
        if (this.stages[stageNumber] && !this.stages[stageNumber].completed) {
            this.stages[stageNumber].completed = true;
            console.log(`Stage ${stageNumber} completed: ${this.stages[stageNumber].name}`);
            
            // Show completion notification
            if (window.gameInterface) {
                window.gameInterface.showMessage(
                    `Stage ${stageNumber} Complete: ${this.stages[stageNumber].name}`, 
                    3000
                );
            }
        }
    }

    // Find active campfires in the world
    findActiveCampfires() {
        const activeCampfires = [];
        if (this.world.assetInstances && this.world.assetInstances.has('campfire')) {
            const campfires = this.world.assetInstances.get('campfire');
            for (const campfire of campfires) {
                if (campfire.userData && campfire.userData.isActive) {
                    activeCampfires.push(campfire);
                }
            }
        }
        return activeCampfires;
    }

    // Find a campfire position for teleportation
    getCampfirePosition() {
        const campfires = this.findActiveCampfires();
        if (campfires.length > 0) {
            return campfires[0].position;
        }
        
        // If no active campfire, find any campfire
        if (this.world.assetInstances && this.world.assetInstances.has('campfire')) {
            const campfires = this.world.assetInstances.get('campfire');
            if (campfires.length > 0) {
                return campfires[0].position;
            }
        }
        
        return null;
    }

    // Debug method: Skip to a specific stage
    skipToStage(stageNumber) {
        if (!this.stages[stageNumber]) {
            console.error(`Stage ${stageNumber} does not exist`);
            return false;
        }

        console.log(`Skipping to stage ${stageNumber}`);

        switch (stageNumber) {
            case 1:
                this.skipToStage1();
                break;
            case 2:
                this.skipToStage2();
                break;
            case 3:
                this.skipToStage3();
                break;
            default:
                console.error(`Skip to stage ${stageNumber} not implemented`);
                return false;
        }

        return true;
    }

    // Skip to Stage 1: Build campfire and teleport player
    skipToStage1() {
        // First, make sure player has enough sticks
        const requiredSticks = 5; // Standard campfire cost
        const currentSticks = this.player.inventory.getItemCount('sticks');
        if (currentSticks < requiredSticks) {
            this.player.inventory.addItem('sticks', requiredSticks - currentSticks);
        }

        // Find a campfire to activate
        let campfire = null;
        if (this.world.assetInstances && this.world.assetInstances.has('campfire')) {
            const campfires = this.world.assetInstances.get('campfire');
            if (campfires.length > 0) {
                campfire = campfires[0];
            }
        }

        if (campfire) {
            // Activate the campfire directly
            this.world.activateCampfire(campfire);
            
            // Complete stage 1
            this.completeStage(1);
            this.activeCampfire = campfire;
            
            // Teleport player to campfire
            this.teleportPlayerToCampfire();
            
            // Show notification
            if (window.gameInterface) {
                window.gameInterface.showMessage("Skipped to Stage 1: Campfire built!", 2500);
            }
        } else {
            console.error("No campfire found to activate");
            if (window.gameInterface) {
                window.gameInterface.showMessage("Error: No campfire found", 2000);
            }
        }
    }

    // Skip to Stage 2: Complete stage 1 and give pickaxe
    skipToStage2() {
        // First complete stage 1 if not already done
        if (!this.isStageCompleted(1)) {
            this.skipToStage1();
        }

        // Give player pickaxe
        const added = this.player.inventory.addItem('pickaxe', 1);
        if (added) {
            this.completeStage(2);
            
            if (window.gameInterface) {
                window.gameInterface.showMessage("Skipped to Stage 2: Pickaxe acquired!", 2500);
                window.gameInterface.showItemNotification(['1 pickaxe']);
            }
        } else {
            if (window.gameInterface) {
                window.gameInterface.showMessage("Already have pickaxe - Stage 2 complete!", 2000);
            }
            this.completeStage(2);
        }
    }

    // Skip to Stage 3: Complete stages 1-2 (placeholder for future content)
    skipToStage3() {
        // First complete previous stages
        if (!this.isStageCompleted(1)) {
            this.skipToStage1();
        }
        if (!this.isStageCompleted(2)) {
            this.skipToStage2();
        }

        // Stage 3 doesn't do anything yet
        this.completeStage(3);
        
        if (window.gameInterface) {
            window.gameInterface.showMessage("Skipped to Stage 3: Not yet implemented!", 2500);
        }
    }

    // Teleport player to the campfire
    teleportPlayerToCampfire() {
        const campfirePos = this.getCampfirePosition();
        if (campfirePos && this.player) {
            // Position player near campfire but not on top of it
            const offsetX = 2.0; // Stand 2 units away from campfire
            const offsetZ = 0;
            
            const newX = campfirePos.x + offsetX;
            const newZ = campfirePos.z + offsetZ;
            
            // Update player position
            this.player.position.x = newX;
            this.player.position.z = newZ;
            
            // Update player mesh position
            if (this.player.mesh) {
                this.player.mesh.position.x = newX;
                this.player.mesh.position.z = newZ;
            }
            
            // Update camera to follow player
            if (window.gameCamera) {
                window.gameCamera.setTarget(newX, newZ);
            }
            
            console.log(`Teleported player to campfire at (${newX.toFixed(1)}, ${newZ.toFixed(1)})`);
        }
    }

    // Get stage info for UI display
    getStageInfo(stageNumber) {
        return this.stages[stageNumber] || null;
    }

    // Get all stages info
    getAllStagesInfo() {
        return {
            current: this.currentStage,
            stages: this.stages
        };
    }
}
