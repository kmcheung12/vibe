export const CONSTANTS = {
    // Game Area
    GRID_WIDTH: 40,         // Number of cells horizontally
    GRID_HEIGHT: 30,        // Number of cells vertically
    CELL_SIZE: 1,           // Size of each grid cell
    BOUNDARY_WIDTH: 40,     // GRID_WIDTH 
    BOUNDARY_HEIGHT: 30,    // GRID_HEIGHT
    
    // Snake Settings
    INITIAL_SPEED: 5,       // Cells per second
    MOVE_INTERVAL: 200,     // Milliseconds between moves (1000 / INITIAL_SPEED)
    COLLISION_THRESHOLD: 0.5,
    
    // Snake Colors
    SNAKE_COLORS: {
        PLAYER_ALIVE: 0x00ff00,  // Green for alive player snake
        PLAYER_DEAD: 0x888888,   // Gray for dead player snake
        BOT_ALIVE: 0xffffff,     // White for alive bot snake
        BOT_DEAD: 0x666666       // Darker gray for dead bot snake
    },
    
    // Directions
    DIRECTION: {
        UP: { x: 0, y: 1 },
        DOWN: { x: 0, y: -1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 }
    },
    
    // Speed levels (frames per movement)
    SPEED_LEVELS: [
        { framesPerMove: 20, name: "Level 1 - Very Slow" },
        { framesPerMove: 15, name: "Level 2 - Slow" },
        { framesPerMove: 12, name: "Level 3 - Casual" },
        { framesPerMove: 10, name: "Level 4 - Normal" },
        { framesPerMove: 8, name: "Level 5 - Fast" },
        { framesPerMove: 6, name: "Level 6 - Very Fast" },
        { framesPerMove: 5, name: "Level 7 - Super Fast" },
        { framesPerMove: 4, name: "Level 8 - Extreme" },
        { framesPerMove: 3, name: "Level 9 - Impossible" }
    ],
    
    // Default speed level index (0-8)
    DEFAULT_SPEED_LEVEL: 3,
    
    // Boost Settings
    BOOST_MULTIPLIER: 2.0,    // Speed multiplier during boost
    BOOST_DURATION: 3.0,      // Duration of boost in seconds
    BOOST_COOLDOWN: 5.0,      // Cooldown time before boost can be used again
    
    // Food Settings
    INITIAL_ORB_COUNT: 20,
    MIN_ORB_COUNT: 10,
    ORB_COLLISION_DISTANCE: 1,
    FOOD_VALUE: 1,
    
};
