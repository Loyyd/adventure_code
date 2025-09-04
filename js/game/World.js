import { biomes } from './Biomes.js';
import { biomeAssets } from './BiomeAssets.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.biomeObjects = new Map();
        this.raycaster = new THREE.Raycaster();
        this.assetInstances = new Map(); // Map to store instances by type
        this.loadedModels = new Map(); // Cache for loaded models
        this.createWorld();
    }

    createWorld() {
        const loader = new THREE.GLTFLoader();
        loader.load('/glb/map/map.glb', 
            (gltf) => {
            this.mapModel = gltf.scene;
            this.scene.add(this.mapModel);
            
            // Store references to biome objects for later use and set up shadows
            this.mapModel.traverse((child) => {
                if (child.isMesh) {
                    const biomeName = child.name.toUpperCase().replace(/_/g, ' ');
                    this.biomeObjects.set(biomeName, child);
                    
                    // Enable shadows for all meshes
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Improve material quality
                    if (child.material) {
                        child.material.envMapIntensity = 1;
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            // After map is loaded, add assets to biomes
            this.addAssetsToBiomes();
        },
        (progress) => {
            // Loading progress
        },
        (error) => {
            console.error('Error loading map:', error);
        });
    }

    getBiomeAt(x, z) {
        if (!this.mapModel) return 'VOID';

        // Create a ray pointing downward from above the point
        this.raycaster.set(
            new THREE.Vector3(x, 10, z),
            new THREE.Vector3(0, -1, 0)
        );

        // Get all intersections with the map
        const intersects = this.raycaster.intersectObjects(this.mapModel.children, true);
        
        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            const biomeName = hitObject.name.toUpperCase().replace(/_/g, ' ');
            return biomeName;
        }
        
        return 'VOID';
    }

    async loadModel(assetType) {
        if (this.loadedModels.has(assetType)) {
            return this.loadedModels.get(assetType);
        }

        const modelPath = biomeAssets[assetType].model;
        const loader = new THREE.GLTFLoader();

        try {
            const gltf = await loader.loadAsync(modelPath);
            
            // Find all top-level mesh groups that represent variations
            const variations = [];
            gltf.scene.traverse((child) => {
                // Only consider direct children of the scene as variations
                if (child.parent === gltf.scene) {
                    variations.push(child);
                }
            });

            // If no variations found, use the entire scene as one variation
            if (variations.length === 0) {
                variations.push(gltf.scene);
            }

            // Store all variations
            this.loadedModels.set(assetType, variations);
            return variations;
        } catch (error) {
            console.error(`Error loading model ${assetType}:`, error);
            return null;
        }
    }

    async addAssetsToBiomes() {
        // Clear existing instances
        for (const instances of this.assetInstances.values()) {
            instances.forEach(instance => this.scene.remove(instance));
        }
        this.assetInstances.clear();

        // Add assets to all biomes
        for (const [biomeName, biomeData] of Object.entries(biomes)) {
            const biomeMesh = this.biomeObjects.get(biomeName);
            if (biomeMesh && biomeData.assets) {
                for (const [assetKey, assetConfig] of Object.entries(biomeData.assets)) {
                    const model = await this.loadModel(assetConfig.type);
                    if (model) {
                        const count = assetConfig.instances;
                        const instances = await this.addAssetToMesh(
                            model,
                            biomeMesh,
                            count,
                            assetConfig,
                            biomeName
                        );

                        if (!this.assetInstances.has(assetConfig.type)) {
                            this.assetInstances.set(assetConfig.type, []);
                        }
                        this.assetInstances.get(assetConfig.type).push(...instances);
                    } else {
                        console.error(`Failed to load model for asset type: ${assetConfig.type}`);
                    }
                }
            }
        }
    }


    async addAssetToMesh(model, biomeMesh, count, assetConfig, biomeName) {
        const bbox = new THREE.Box3().setFromObject(biomeMesh);
        const placedPositions = new Set();
        const minDistance = 2;
        let attempts = 0;
        const maxAttempts = count * 3;
        
        const assetType = assetConfig.type;
        const assetData = biomeAssets[assetType];
        
        if (!assetData) {
            console.error(`Asset data not found for type: ${assetType}`);
            return [];
        }
        
        if (!assetData.scale) {
            console.error(`Scale data not found for asset type: ${assetType}`);
            return [];
        }
        
        const scaleRange = assetData.scale[assetConfig.scale];
        if (!scaleRange) {
            console.error(`Scale range '${assetConfig.scale}' not found for asset type: ${assetType}`);
            console.log('Available scales:', Object.keys(assetData.scale));
            return [];
        }
        
        const colorValue = assetData.colors[assetConfig.color];
        if (colorValue === undefined) {
            console.error(`Color '${assetConfig.color}' not found for asset type: ${assetType}`);
            console.log('Available colors:', Object.keys(assetData.colors));
            return [];
        }
        
        const instances = [];
        
        while (instances.length < count && attempts < maxAttempts) {
            const x = THREE.MathUtils.randFloat(bbox.min.x, bbox.max.x);
            const z = THREE.MathUtils.randFloat(bbox.min.z, bbox.max.z);
            
            this.raycaster.set(
                new THREE.Vector3(x, bbox.max.y + 1, z),
                new THREE.Vector3(0, -1, 0)
            );

            const intersects = this.raycaster.intersectObject(biomeMesh);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const posKey = `${Math.round(point.x / minDistance)},${Math.round(point.z / minDistance)}`;
                
                if (!placedPositions.has(posKey)) {
                    const actualBiome = this.getBiomeAt(point.x, point.z);
                    if (actualBiome === biomeName) {
                        // Pick a random variation from the available models
                        const variations = Array.isArray(model) ? model : [model];
                        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
                        const instance = randomVariation.clone();
                        
                        instance.position.set(point.x, point.y, point.z);
                        instance.rotation.y = Math.random() * Math.PI * 2;
                        
                        const scale = scaleRange.min + Math.random() * (scaleRange.max - scaleRange.min);
                        instance.scale.set(scale, scale, scale);
                        
                        instance.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                if (child.material) {
                                    child.material = child.material.clone();
                                    child.material.name = `${assetType}Material`;
                                    child.material.color.setHex(colorValue);
                                    
                                    // Special handling for campfire - make it transparent initially
                                    if (assetType === 'campfire') {
                                        child.material.transparent = true;
                                        child.material.opacity = 0.5;
                                        instance.userData.isActive = false;
                                        instance.userData.assetType = 'campfire';
                                    }
                                }
                            }
                        });
                        
                        this.scene.add(instance);
                        instances.push(instance);
                        placedPositions.add(posKey);
                    }
                }
            }
            
            attempts++;
        }
        
        return instances;
    }

    activateCampfire(campfire) {
        if (!campfire || !campfire.userData || campfire.userData.assetType !== 'campfire') {
            return false;
        }

        if (campfire.userData.isActive) {
            return false; // Already active
        }

        // Make campfire fully visible
        campfire.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.opacity = 1.0;
                child.material.color.setHex(0x8B4513); // Brown color for active campfire
            }
        });

        // Add fire particles
        this.addCampfireParticles(campfire);

        // Add light
        this.addCampfireLight(campfire);

        // Mark as active
        campfire.userData.isActive = true;

        return true;
    }

    addCampfireParticles(campfire) {
        // Create particle system for fire effect
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position particles around the campfire base
            positions[i3] = (Math.random() - 0.5) * 0.5;
            positions[i3 + 1] = Math.random() * 0.2;
            positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
            
            // Upward velocity with some randomness
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = 0.02 + Math.random() * 0.03;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
            
            // Fire colors (red to yellow)
            colors[i3] = 1.0; // Red
            colors[i3 + 1] = Math.random() * 0.5 + 0.5; // Green (for yellow)
            colors[i3 + 2] = 0.0; // Blue
            
            sizes[i] = Math.random() * 0.1 + 0.05;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particles, particleMaterial);
        particleSystem.position.copy(campfire.position);
        particleSystem.position.y += 0.5; // Raise particles above campfire

        this.scene.add(particleSystem);
        
        // Store reference for animation
        campfire.userData.particles = particleSystem;
        campfire.userData.particlePositions = positions;
        campfire.userData.particleVelocities = velocities;
    }

    addCampfireLight(campfire) {
        // Add warm fire light
        const fireLight = new THREE.PointLight(0xff6600, 2, 10);
        fireLight.position.copy(campfire.position);
        fireLight.position.y += 1;
        fireLight.castShadow = true;
        fireLight.shadow.mapSize.width = 512;
        fireLight.shadow.mapSize.height = 512;

        this.scene.add(fireLight);
        campfire.userData.light = fireLight;

        // Add flickering animation
        campfire.userData.lightIntensity = 2;
        campfire.userData.lightFlicker = 0;
    }

    updateCampfires() {
        // Update all active campfires
        if (this.assetInstances && this.assetInstances.has('campfire')) {
            const campfires = this.assetInstances.get('campfire');
            campfires.forEach(campfire => {
                if (campfire.userData.isActive) {
                    // Update particles
                    if (campfire.userData.particles) {
                        this.updateCampfireParticles(campfire);
                    }
                    
                    // Update light flickering
                    if (campfire.userData.light) {
                        this.updateCampfireLight(campfire);
                    }
                }
            });
        }
    }

    updateCampfireParticles(campfire) {
        const particles = campfire.userData.particles;
        const positions = campfire.userData.particlePositions;
        const velocities = campfire.userData.particleVelocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update positions
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // Reset particles that go too high
            if (positions[i3 + 1] > 2.0) {
                positions[i3] = (Math.random() - 0.5) * 0.5;
                positions[i3 + 1] = 0;
                positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
                
                velocities[i3] = (Math.random() - 0.5) * 0.02;
                velocities[i3 + 1] = 0.02 + Math.random() * 0.03;
                velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
            }
        }
        
        particles.geometry.attributes.position.needsUpdate = true;
    }

    updateCampfireLight(campfire) {
        const light = campfire.userData.light;
        campfire.userData.lightFlicker += 0.1;
        
        // Create flickering effect
        const flicker = Math.sin(campfire.userData.lightFlicker) * 0.3 + Math.cos(campfire.userData.lightFlicker * 2.3) * 0.2;
        light.intensity = campfire.userData.lightIntensity + flicker;
    }
    
}