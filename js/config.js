export default {
    GRID_ROWS: 9,
    GRID_COLS: 5,
    GRID_SIZE: 100, // 默认基准，会被响应式逻辑覆盖
    GAME_WIDTH: 500, // 逻辑宽度 5 * 100
    GAME_HEIGHT: 900, // 逻辑高度 9 * 100
    
    // 植物属性
    PLANTS: {
        PEASHOOTER: {
            id: 'peashooter',
            name: '豌豆射手',
            cost: 100,
            hp: 300,
            damage: 20,
            attackSpeed: 1400, // ms
            range: 9, // 格子数
            projectileSpeed: 5 // px per frame
        }
    },

    // 僵尸属性
    ZOMBIES: {
        NORMAL: {
            id: 'normal',
            hp: 200,
            speed: 0.5, // px per frame
            damage: 0.5, // per frame
            scoreReward: 50
        },
        CONE: {
            id: 'cone',
            hp: 560, // 普通僵尸的2倍多
            speed: 0.5,
            damage: 0.5,
            scoreReward: 75
        },
        BUCKET: {
            id: 'bucket',
            hp: 1300, // 很高
            speed: 0.4,
            damage: 0.5,
            scoreReward: 100
        }
    },

    // 关卡波次配置
    WAVES: [
        { time: 0, count: 0 }, // 初始安静期
        { time: 20, count: 1, interval: 8000 }, // 20秒后，每8秒一只
        { time: 60, count: 2, interval: 6000 }, // 60秒后，加强
        { time: 120, count: 3, interval: 4000 } // 2分钟后，疯狂
    ]
};
