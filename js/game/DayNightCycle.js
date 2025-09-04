export class DayNightCycle {
    constructor(scene) {
        this.scene = scene;
        
        // Time settings (in seconds)
        this.dayDuration = 600; // 10 minutes for a full day
        this.currentTime = 0.25; // Start at dawn (0 = midnight, 0.5 = noon, 1 = midnight)
        this.timeSpeed = 1; // Speed multiplier
        
        // Lighting references
        this.sunlight = null;
        this.moonlight = null;
        this.ambientLight = null;
        
        // Sky and atmosphere
        this.skyBox = null;
        this.fog = null;
        
        // Time periods (0-1 normalized)
        this.timeSlots = {
            night: { start: 0, end: 0.2 },
            dawn: { start: 0.2, end: 0.3 },
            morning: { start: 0.3, end: 0.4 },
            day: { start: 0.4, end: 0.6 },
            afternoon: { start: 0.6, end: 0.7 },
            dusk: { start: 0.7, end: 0.8 },
            evening: { start: 0.8, end: 1.0 }
        };
        
        // Color configurations for different times
        this.lightingConfig = {
            night: {
                sunIntensity: 0,
                moonIntensity: 0.3,
                ambientIntensity: 0.1,
                sunColor: 0x4169E1,
                moonColor: 0xB0C4DE,
                ambientColor: 0x2F2F4F,
                skyColor: 0x0F0F23,
                fogColor: 0x0F0F23,
                fogDensity: 0.01
            },
            dawn: {
                sunIntensity: 0.3,
                moonIntensity: 0.1,
                ambientIntensity: 0.3,
                sunColor: 0xFF6B35,
                moonColor: 0xB0C4DE,
                ambientColor: 0x4A4A6A,
                skyColor: 0xFF8C69,
                fogColor: 0xFF8C69,
                fogDensity: 0.005
            },
            morning: {
                sunIntensity: 0.6,
                moonIntensity: 0,
                ambientIntensity: 0.4,
                sunColor: 0xFFD700,
                moonColor: 0xB0C4DE,
                ambientColor: 0x6A6A8A,
                skyColor: 0x87CEEB,
                fogColor: 0x87CEEB,
                fogDensity: 0.003
            },
            day: {
                sunIntensity: 1.0,
                moonIntensity: 0,
                ambientIntensity: 0.5,
                sunColor: 0xFFFAF0,
                moonColor: 0xB0C4DE,
                ambientColor: 0x8A8AAA,
                skyColor: 0x87CEEB,
                fogColor: 0x87CEEB,
                fogDensity: 0.001
            },
            afternoon: {
                sunIntensity: 0.8,
                moonIntensity: 0,
                ambientIntensity: 0.4,
                sunColor: 0xFFE4B5,
                moonColor: 0xB0C4DE,
                ambientColor: 0x7A7A9A,
                skyColor: 0xFFA07A,
                fogColor: 0xFFA07A,
                fogDensity: 0.002
            },
            dusk: {
                sunIntensity: 0.4,
                moonIntensity: 0.1,
                ambientIntensity: 0.3,
                sunColor: 0xFF4500,
                moonColor: 0xB0C4DE,
                ambientColor: 0x5A5A7A,
                skyColor: 0xFF6347,
                fogColor: 0xFF6347,
                fogDensity: 0.004
            },
            evening: {
                sunIntensity: 0.1,
                moonIntensity: 0.2,
                ambientIntensity: 0.2,
                sunColor: 0x8B0000,
                moonColor: 0xB0C4DE,
                ambientColor: 0x3A3A5A,
                skyColor: 0x483D8B,
                fogColor: 0x483D8B,
                fogDensity: 0.007
            }
        };
        
        this.initializeLighting();
        this.initializeSky();
    }
    
    initializeLighting() {
        // Find existing lights in the scene or create new ones
        this.scene.traverse((object) => {
            if (object.isDirectionalLight && !this.sunlight) {
                this.sunlight = object;
            } else if (object.isAmbientLight && !this.ambientLight) {
                this.ambientLight = object;
            }
        });
        
        // Create moonlight
        this.moonlight = new THREE.DirectionalLight(0xB0C4DE, 0.3);
        this.moonlight.position.set(-50, 100, -50);
        this.moonlight.castShadow = true;
        
        // Configure moon shadow properties (lighter shadows than sun)
        this.moonlight.shadow.mapSize.width = 1024;
        this.moonlight.shadow.mapSize.height = 1024;
        this.moonlight.shadow.camera.near = 0.5;
        this.moonlight.shadow.camera.far = 500;
        this.moonlight.shadow.camera.left = -50;
        this.moonlight.shadow.camera.right = 50;
        this.moonlight.shadow.camera.top = 50;
        this.moonlight.shadow.camera.bottom = -50;
        this.moonlight.shadow.bias = -0.0001;
        
        this.scene.add(this.moonlight);
    }
    
    initializeSky() {
        // Create a simple sky sphere
        const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87CEEB,
            side: THREE.BackSide,
            fog: false
        });
        
        this.skyBox = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyBox);
        
        // Add fog for atmospheric effect
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 300);
    }
    
    update(deltaTime) {
        // Update time
        this.currentTime += (deltaTime / this.dayDuration) * this.timeSpeed;
        if (this.currentTime >= 1) {
            this.currentTime -= 1; // Wrap around to next day
        }
        
        // Update lighting based on current time
        this.updateLighting();
        this.updateSunPosition();
        this.updateMoonPosition();
    }
    
    updateLighting() {
        const currentPeriod = this.getCurrentTimePeriod();
        const config = this.lightingConfig[currentPeriod];
        
        // Get blend factor for smooth transitions
        const blendFactor = this.getBlendFactor(currentPeriod);
        const nextPeriod = this.getNextTimePeriod(currentPeriod);
        const nextConfig = this.lightingConfig[nextPeriod];
        
        // Interpolate lighting values
        if (this.sunlight) {
            this.sunlight.intensity = this.lerp(config.sunIntensity, nextConfig.sunIntensity, blendFactor);
            this.sunlight.color.setHex(this.lerpColor(config.sunColor, nextConfig.sunColor, blendFactor));
        }
        
        if (this.moonlight) {
            this.moonlight.intensity = this.lerp(config.moonIntensity, nextConfig.moonIntensity, blendFactor);
            this.moonlight.color.setHex(this.lerpColor(config.moonColor, nextConfig.moonColor, blendFactor));
        }
        
        if (this.ambientLight) {
            this.ambientLight.intensity = this.lerp(config.ambientIntensity, nextConfig.ambientIntensity, blendFactor);
            this.ambientLight.color.setHex(this.lerpColor(config.ambientColor, nextConfig.ambientColor, blendFactor));
        }
        
        // Update sky color
        if (this.skyBox) {
            const skyColor = this.lerpColor(config.skyColor, nextConfig.skyColor, blendFactor);
            this.skyBox.material.color.setHex(skyColor);
        }
        
        // Update fog
        if (this.scene.fog) {
            const fogColor = this.lerpColor(config.fogColor, nextConfig.fogColor, blendFactor);
            this.scene.fog.color.setHex(fogColor);
            this.scene.fog.density = this.lerp(config.fogDensity, nextConfig.fogDensity, blendFactor);
        }
    }
    
    updateSunPosition() {
        if (!this.sunlight) return;
        
        // Sun moves in an arc across the sky
        // At noon (0.5), sun is directly overhead
        // At dawn/dusk, sun is on the horizon
        const sunAngle = (this.currentTime - 0.5) * Math.PI; // -π/2 to π/2
        const sunHeight = Math.sin(sunAngle * 0.5 + Math.PI * 0.5) * 100; // 0 to 100
        const sunDistance = Math.cos(sunAngle) * 100;
        
        this.sunlight.position.set(
            sunDistance,
            Math.max(sunHeight, 10), // Never go below ground
            50
        );
    }
    
    updateMoonPosition() {
        if (!this.moonlight) return;
        
        // Moon is opposite to the sun
        const moonAngle = (this.currentTime - 0.5) * Math.PI + Math.PI; // Opposite to sun
        const moonHeight = Math.sin(moonAngle * 0.5 + Math.PI * 0.5) * 100;
        const moonDistance = Math.cos(moonAngle) * 100;
        
        this.moonlight.position.set(
            moonDistance,
            Math.max(moonHeight, 10),
            -50
        );
    }
    
    getCurrentTimePeriod() {
        for (const [period, range] of Object.entries(this.timeSlots)) {
            if (this.currentTime >= range.start && this.currentTime < range.end) {
                return period;
            }
        }
        // Handle edge case where currentTime is exactly 1.0
        return 'night';
    }
    
    getNextTimePeriod(currentPeriod) {
        const periods = Object.keys(this.timeSlots);
        const currentIndex = periods.indexOf(currentPeriod);
        const nextIndex = (currentIndex + 1) % periods.length;
        return periods[nextIndex];
    }
    
    getBlendFactor(currentPeriod) {
        const range = this.timeSlots[currentPeriod];
        const periodLength = range.end - range.start;
        if (periodLength <= 0) return 0;
        
        const timeInPeriod = this.currentTime - range.start;
        return Math.min(timeInPeriod / periodLength, 1);
    }
    
    // Utility functions
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    lerpColor(color1, color2, factor) {
        const c1 = new THREE.Color(color1);
        const c2 = new THREE.Color(color2);
        return c1.lerp(c2, factor).getHex();
    }
    
    // Public methods for external access
    getTimeString() {
        const hours = Math.floor(this.currentTime * 24);
        const minutes = Math.floor((this.currentTime * 24 - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    getCurrentPeriod() {
        return this.getCurrentTimePeriod().toUpperCase();
    }
    
    setTimeSpeed(speed) {
        this.timeSpeed = Math.max(0, speed);
    }
    
    setTime(normalizedTime) {
        this.currentTime = Math.max(0, Math.min(1, normalizedTime));
    }
    
    // Convenience methods for setting specific times
    setToNoon() {
        this.setTime(0.5);
    }
    
    setToMidnight() {
        this.setTime(0);
    }
    
    setToDawn() {
        this.setTime(0.25);
    }
    
    setToDusk() {
        this.setTime(0.75);
    }
    
    // Debug methods for controlling time
    togglePause() {
        if (this.timeSpeed === 0) {
            this.timeSpeed = 1; // Resume normal speed
        } else {
            this.timeSpeed = 0; // Pause
        }
    }
    
    setTimeOfDay(normalizedTime) {
        this.setTime(normalizedTime);
    }
    
    isPaused() {
        return this.timeSpeed === 0;
    }
}
