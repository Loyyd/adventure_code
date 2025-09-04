import { World } from './game/World.js';
import { Player } from './game/Player.js';
import { Interface } from './ui/Interface.js';
import { Controls } from './utils/Controls.js';
import { Camera } from './utils/Camera.js';
import { DayNightCycle } from './game/DayNightCycle.js';
import { biomes } from './game/Biomes.js';

let scene, renderer;
let world, player, ui, controls, cameraController, dayNightCycle;
let currentBiome = 'OPEN FIELDS';
const clock = new THREE.Clock();
let outlinePass, composer;
let hoveredObject = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getRequiredTool(assetType) {
    switch(assetType) {
        case 'tree': return 'axe';
        case 'rock': return 'pickaxe';
        case 'campfire': return null; // No tool required for campfire
        default: return null;
    }
}

function init() {
    setupScene();
    
    world = new World(scene);
    player = new Player(scene);
    ui = new Interface(player);
    controls = new Controls();
    cameraController = new Camera(window.innerWidth, window.innerHeight);
    dayNightCycle = new DayNightCycle(scene);
    
    // Store references globally for asset removal and UI updates
    window.gameWorld = world;
    window.gamePlayer = player;
    window.gameDayNight = dayNightCycle;
    window.gameInterface = ui;
    window.gameCamera = cameraController;
    
    // Set up UI callbacks
    player.setInteractionProgressCallback((elapsed, duration, targetPosition) => {
        ui.updateInteractionProgress(elapsed, duration, targetPosition);
    });
    
    // Set up inventory toggle callback
    controls.onInventoryToggle = () => {
        ui.toggleInventory();
    };
    
    // Set up hotbar selection callback
    controls.onHotbarSelection = (slotIndex) => {
        ui.inventoryUI.selectHotbarSlot(slotIndex);
    };
    
    // Set up debug mode callback
    controls.onDebugToggle = (enabled) => {
        ui.toggleDebugMode(enabled);
    };
    
    // Store controls reference globally for UI access
    window.gameControls = controls;
    
    // Set up post-processing after camera is initialized
    setupPostProcessing();
    
    setupResizeHandler();
    animate();
}

function setupScene() {
    scene = new THREE.Scene();
    
    // Set up renderer with shadow support
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // Add ambient light for general scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Add directional sunlight
    const sunlight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunlight.position.set(50, 100, 50);
    sunlight.castShadow = true;
    
    // Configure shadow properties
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.near = 0.5;
    sunlight.shadow.camera.far = 500;
    sunlight.shadow.camera.left = -50;
    sunlight.shadow.camera.right = 50;
    sunlight.shadow.camera.top = 50;
    sunlight.shadow.camera.bottom = -50;
    sunlight.shadow.bias = -0.0001;
    
    scene.add(sunlight);
}

function setupResizeHandler() {
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        cameraController.updateSize(window.innerWidth, window.innerHeight);
        ui.handleResize();
    });

    // Add wheel event listener for camera zoom
    window.addEventListener('wheel', (event) => {
        cameraController.handleZoom(event.deltaY);
    });

    // Add mouse move listener for hover effects
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        checkHover();
    });
}

function handleMovement() {
    const movement = controls.getMovement();
    const newX = player.position.x + movement.x;
    const newZ = player.position.z + movement.z;
    
    // Pass the currently hovered object as the interaction target when interacting
    player.move(newX, newZ, movement.moved, controls.isInteracting, hoveredObject);
    
    if (movement.moved) {
        // Update camera target to follow player
        cameraController.setTarget(newX, newZ);
        
        // Update UI
        updateBiome();
    }
}

function updateBiome() {
    const newBiome = world.getBiomeAt(player.position.x, player.position.z);
    
    if (newBiome !== currentBiome && newBiome !== 'VOID') {
        currentBiome = newBiome;
        ui.updateBiome(currentBiome);
    }
}

function setupPostProcessing() {
    // Set up post-processing for outline effect
    composer = new THREE.EffectComposer(renderer);
    
    // Render pass with proper encoding
    const renderPass = new THREE.RenderPass(scene, cameraController.getCamera());
    renderPass.clearAlpha = 0;
    composer.addPass(renderPass);

    // Create outline pass
    outlinePass = new THREE.OutlinePass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        scene,
        cameraController.getCamera()
    );
    outlinePass.edgeStrength = 3;
    outlinePass.edgeGlow = 0.5;
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set(0xffff00); // Yellow outline
    outlinePass.hiddenEdgeColor.set(0xffff00);
    outlinePass.renderToScreen = false;
    composer.addPass(outlinePass);

    // Add final shader pass to handle encoding
    const gammaCorrectionPass = new THREE.ShaderPass(THREE.GammaCorrectionShader);
    gammaCorrectionPass.renderToScreen = true;
    composer.addPass(gammaCorrectionPass);
}

function checkHover() {
    raycaster.setFromCamera(mouse, cameraController.getCamera());
    
    // Get all meshes from asset instances
    const objectsToTest = [];
    if (world.assetInstances) {
        for (const instances of world.assetInstances.values()) {
            instances.forEach(asset => {
                asset.traverse(child => {
                    if (child.isMesh) {
                        objectsToTest.push(child);
                    }
                });
            });
        }
    }
    
    const intersects = raycaster.intersectObjects(objectsToTest, false);
    
    if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        
        // Find the asset instance parent
        let assetParent = hoveredMesh;
        while (assetParent.parent && !Array.from(world.assetInstances.values()).some(instances => instances.includes(assetParent))) {
            assetParent = assetParent.parent;
        }
        
        // Check if the parent is one of our asset instances
        const isAssetInstance = Array.from(world.assetInstances.values()).some(instances => instances.includes(assetParent));
        
        // Only highlight if the object is within interaction range and is a valid asset instance
        if (isAssetInstance && player.isItemInRange(assetParent.position) && hoveredObject !== assetParent) {
            hoveredObject = assetParent;
            
            // Check if player can interact with this asset (has required tool)
            const assetType = player.getAssetTypePublic(assetParent);
            const canInteract = player.canInteractWithAssetPublic(assetType);
            
            // Set outline color based on whether player can interact
            if (canInteract) {
                outlinePass.visibleEdgeColor.set(0xffff00); // Yellow outline for valid interaction
                outlinePass.hiddenEdgeColor.set(0xffff00);
            } else {
                outlinePass.visibleEdgeColor.set(0xff0000); // Red outline for missing tool
                outlinePass.hiddenEdgeColor.set(0xff0000);
                
                // Show helpful message about required tool
                const requiredTool = getRequiredTool(assetType);
                if (requiredTool) {
                    console.log(`Cannot interact with ${assetType}: requires ${requiredTool}`);
                }
            }
            
            outlinePass.selectedObjects = [assetParent];
        } else if (!player.isItemInRange(assetParent.position)) {
            // Clear highlighting if object is out of range
            hoveredObject = null;
            outlinePass.selectedObjects = [];
        }
    } else {
        hoveredObject = null;
        outlinePass.selectedObjects = [];
    }
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    handleMovement();
    player.update(deltaTime);
    world.updateCampfires(); // Update campfire particles and lighting
    dayNightCycle.update(deltaTime);
    ui.updateTimeInfo(dayNightCycle.getTimeString(), dayNightCycle.getCurrentPeriod(), dayNightCycle.timeSpeed);
    
    // Update debug info if in debug mode
    if (controls.isDebugMode()) {
        ui.updateDebugInfo();
    }
    
    cameraController.update();
    composer.render();
}

// Initialize the game
init();
