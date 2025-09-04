export const biomes = {
    'OPEN FIELDS': {
        color: 0x4a7c59,
        assets: {
            grass: {
                type: 'grass',
                instances: 100,
                scale: 'default',
                color: 'default'
            },
            trees: {
                type: 'tree',
                instances: 5,
                scale: 'medium',
                color: 'default'
            },
            rocks: {
                type: 'rock',
                instances: 3,
                scale: 'small',
                color: 'default'
            },
            bushes: {
                type: 'bush',
                instances: 15,
                scale: 'default',
                color: 'default'
            },
            campfire: {
                type: 'campfire',
                instances: 1,
                scale: 'default',
                color: 'inactive'
            }
        }
    },
    'DARK WOODS': {
        color: 0x2d3d2d,
        assets: {
            grass: {
                type: 'grass',
                instances: 300,
                scale: 'default',
                color: 'darkWoods'
            },
            trees: {
                type: 'tree',
                instances: 10,
                scale: 'large',
                color: 'darkWoods'
            },
            rocks: {
                type: 'rock',
                instances: 5,
                scale: 'medium',
                color: 'default'
            },
            bushes: {
                type: 'bush',
                instances: 25,
                scale: 'medium',
                color: 'darkWoods'
            }
        }
    },
    'DEEP WATERS': {
        color: 0x1e3a5f,
        assets: {}  // No assets in water
    },
    'SCARY CAVES': {
        color: 0x3d3d3d,
        assets: {
            rocks: {
                type: 'rock',
                instances: 20,
                scale: 'large',
                color: 'default'
            }
        }
    },
    'LOST DESERT': {
        color: 0xc19a6b,
        assets: {
            rocks: {
                type: 'rock',
                instances: 5,
                scale: 'medium',
                color: 'desert'
            }
        }
    }
};
