export const biomeAssets = {
    grass: {
        model: '/glb/assets/grass/grass.glb',
        // Time to interact (milliseconds)
        interactionTimeMs: 1500,
        // Interaction radius (world units)
        interactionRadius: 1.2,
        scale: {
            default: { min: 0.8, max: 1.2 }
        },
        colors: {
            default: 0x4f8d63,
            darkWoods: 0x2a4d2a
        },
        // Player can walk through grass
        walkThrough: true,
        // Hitbox for interaction and debug - but won't block movement due to walkThrough
        hitbox: {
            type: 'circle',
            radius: 0.5 // Small radius for grass interaction
        }
    },
    bush: {
        model: '/glb/assets/bush/bush.glb',
        // Bushes take ~3 seconds
        interactionTimeMs: 3000,
        // Interaction radius (world units)
        interactionRadius: 1.5,
        scale: {
            default: { min: 0.6, max: 1.0 }
        },
        colors: {
            default: 0x3d5a3d,
            darkWoods: 0x2a3d2a
        },
        // Player cannot walk through bushes
        walkThrough: false,
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
        // Interaction radius (world units) - bigger for large rocks
        interactionRadius: 2.5,
        scale: {
            small: { min: 0.5, max: 0.8 },
            medium: { min: 0.8, max: 1.2 },
            large: { min: 1.2, max: 2.0 }
        },
        colors: {
            default: 0x808080,
            desert: 0xc19a6b
        },
        // Player cannot walk through rocks
        walkThrough: false,
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
        // Interaction radius (world units) - larger for big trees
        interactionRadius: 2.2,
        scale: {
            small: { min: 0.8, max: 1.2 },
            medium: { min: 1.2, max: 1.8 },
            large: { min: 1.8, max: 2.5 }
        },
        colors: {
            default: 0x4a7c59,
            darkWoods: 0x2d3d2d
        },
        // Player cannot walk through trees
        walkThrough: false,
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
        // Interaction radius (world units)
        interactionRadius: 1.8,
        scale: {
            default: { min: 1.0, max: 1.0 }
        },
        colors: {
            default: 0x8B4513,
            inactive: 0x555555
        },
        // Player cannot walk through campfire
        walkThrough: false,
        // Campfire blocks movement - small circular hitbox
        hitbox: {
            type: 'circle',
            radius: 0.7
        }
    }
};
