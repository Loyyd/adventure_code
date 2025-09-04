export class Camera {
    constructor(width, height) {
        this.camera = new THREE.OrthographicCamera(-15, 15, 15, -15, 1, 1000);
        this.camera.position.set(0, 20, 10);
        this.camera.lookAt(0, 0, 0);

        // Camera follow properties
        this.target = { x: 0, z: 0 };
        this.current = { x: 0, z: 0 };
        this.followSpeed = 0.1;

        // Zoom properties
        this.zoomLevel = 0.5;
        this.currentZoom = 0.5;
        this.targetZoom = 1;
        this.zoomSpeed = 0.1;
        this.MIN_ZOOM = 0.2;
        this.MAX_ZOOM = 2.0;

        // Debug fly mode
        this.flyMode = false;
        this.flyHeight = 20;
        this.flySpeed = 0.5;

        this.updateSize(width, height);
    }

    updateSize(width, height) {
        const aspect = width / height;
        this.camera.left = -15 * aspect * this.currentZoom;
        this.camera.right = 15 * aspect * this.currentZoom;
        this.camera.top = 15 * this.currentZoom;
        this.camera.bottom = -15 * this.currentZoom;
        this.camera.updateProjectionMatrix();
    }

    handleZoom(deltaY) {
        const zoomDelta = deltaY > 0 ? 0.1 : -0.1;
        this.targetZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.targetZoom + zoomDelta));
    }

    setTarget(x, z) {
        this.target.x = x;
        this.target.z = z;
    }

    update() {
        // Handle fly mode
        if (this.flyMode && window.gameControls) {
            const keys = window.gameControls.keys;
            if (keys['KeyW'] || keys['ArrowUp']) {
                this.current.z -= this.flySpeed;
                this.target.z = this.current.z;
            }
            if (keys['KeyS'] || keys['ArrowDown']) {
                this.current.z += this.flySpeed;
                this.target.z = this.current.z;
            }
            if (keys['KeyA'] || keys['ArrowLeft']) {
                this.current.x -= this.flySpeed;
                this.target.x = this.current.x;
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                this.current.x += this.flySpeed;
                this.target.x = this.current.x;
            }
            if (keys['KeyQ']) {
                this.flyHeight += 1;
            }
            if (keys['KeyE']) {
                this.flyHeight = Math.max(5, this.flyHeight - 1);
            }
        } else {
            // Normal follow mode
            this.current.x += (this.target.x - this.current.x) * this.followSpeed;
            this.current.z += (this.target.z - this.current.z) * this.followSpeed;
        }
        
        // Smooth zoom
        this.currentZoom += (this.targetZoom - this.currentZoom) * this.zoomSpeed;
        
        // Update camera position
        this.camera.position.x = this.current.x;
        this.camera.position.y = this.flyMode ? this.flyHeight : 20;
        this.camera.position.z = this.current.z + 10;
        this.camera.lookAt(this.current.x, 0, this.current.z);
        
        // Update camera zoom
        const aspect = window.innerWidth / window.innerHeight;
        this.camera.left = -15 * aspect * this.currentZoom;
        this.camera.right = 15 * aspect * this.currentZoom;
        this.camera.top = 15 * this.currentZoom;
        this.camera.bottom = -15 * this.currentZoom;
        this.camera.updateProjectionMatrix();
    }

    toggleFlyMode() {
        this.flyMode = !this.flyMode;
        console.log(`Fly mode: ${this.flyMode ? 'ON' : 'OFF'}`);
        if (window.gameInterface) {
            window.gameInterface.showMessage(
                this.flyMode ? 
                '✈️ Fly mode ON - Use WASD to move, Q/E for height' : 
                '🚶 Follow mode ON'
            );
        }
    }

    getCamera() {
        return this.camera;
    }
}
