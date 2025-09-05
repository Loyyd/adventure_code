export const biomeAssets = {
    grass: {
        model: '/glb/assets/grass/grass.glb',
    // Time to interact (milliseconds)
    interactionTimeMs: 1500,
        scale: {
            default: { min: 0.8, max: 1.2 }
        },
        colors: {
            default: 0x4f8d63,
            darkWoods: 0x2a4d2a
        },
        // No hitbox - grass can be walked through
        hitbox: null
    },
    bush: {
        model: '/glb/assets/bush/bush.glb',
    // Bushes take ~3 seconds
    interactionTimeMs: 3000,
        scale: {
            default: { min: 0.6, max: 1.0 }
        },
        colors: {
            default: 0x3d5a3d,
            darkWoods: 0x2a3d2a
        },
        // Bush blocks movement - circular hitbox
        hitbox: {
            type: 'circle',
            radius: 0.8 // Radius in world units
        }
    },
    rock: {
        model: '/glb/assets/rock/rock.glb',
    // Stones/rocks take ~7 seconds
    interactionTimeMs: 10000,
        scale: {
            small: { min: 0.5, max: 0.8 },
            medium: { min: 0.8, max: 1.2 },
            large: { min: 1.2, max: 2.0 }
        },
        colors: {
            default: 0x808080,
            desert: 0xc19a6b
        },
        // Rock blocks movement - scale-dependent circular hitbox
        hitbox: {
            type: 'circle',
            radius: 0.6, // Base radius, will be scaled
            scaleWithAsset: true
        }
    },
    tree: {
        model: '/glb/assets/tree/tree.glb',
    // Trees are slower to chop
    interactionTimeMs: 7000,
        scale: {
            small: { min: 0.8, max: 1.2 },
            medium: { min: 1.2, max: 1.8 },
            large: { min: 1.8, max: 2.5 }
        },
        colors: {
            default: 0x4a7c59,
            darkWoods: 0x2d3d2d
        },
        // Tree blocks movement - larger circular hitbox
        hitbox: {
            type: 'circle',
            radius: 1.0,
            scaleWithAsset: true
        }
    },
    campfire: {
        model: '/glb/assets/campfire/campfire.glb',
    // Brief interaction before build dialog
    interactionTimeMs: 1000,
        scale: {
            default: { min: 1.0, max: 1.0 }
        },
        colors: {
            default: 0x8B4513,
            inactive: 0x555555
        },
        // Campfire blocks movement - small circular hitbox
        hitbox: {
            type: 'circle',
            radius: 0.7
        }
    }
};
