export default {
    GRID_ROWS: 9,
    GRID_COLS: 5,
    GRID_SIZE: 100,
    GAME_WIDTH: 500,
    GAME_HEIGHT: 900,

    // 植物属性
    PLANTS: {
        PEASHOOTER: {
            id: 'peashooter',
            name: '豌豆射手',
            emoji: '🌱',
            cost: 100,
            cooldown: 7000,
            hp: 300,
            damage: 20,
            bulletCount: 1,
            attackSpeed: 1400,
            range: 9,
            projectileSpeed: 5
        },
        REPEATER: {
            id: 'repeater',
            name: '双发射手',
            emoji: '🌿',
            cost: 150,
            cooldown: 10000,
            hp: 300,
            damage: 20,
            bulletCount: 2,
            attackSpeed: 1400,
            range: 9,
            projectileSpeed: 5
        },
        GATLINGPEA: {
            id: 'gatlingpea',
            name: '加特林',
            emoji: '🔫',
            cost: 250,
            cooldown: 15000,
            hp: 300,
            damage: 20,
            bulletCount: 4,
            attackSpeed: 1400,
            range: 9,
            projectileSpeed: 5
        },
        CHOMPER: {
            id: 'chomper',
            name: '食人花',
            emoji: '👅',
            cost: 200,
            cooldown: 15000,
            hp: 300,
            chewTime: 42000  // 42秒咀嚼
        },
        CHERRYBOMB: {
            id: 'cherrybomb',
            name: '樱桃炸弹',
            emoji: '🍒',
            cost: 150,
            cooldown: 25000,
            hp: 9999,
            fuseTime: 1200  // 1.2秒引信
        },
        WALLNUT: {
            id: 'wallnut',
            name: '坚果墙',
            emoji: '🥜',
            cost: 50,
            cooldown: 15000,
            hp: 4000
        }
    },

    // 僵尸属性（击杀不给分）
    ZOMBIES: {
        NORMAL: {
            id: 'normal',
            hp: 200,
            speed: 0.5,
            damage: 0.5
        },
        CONE: {
            id: 'cone',
            hp: 560,
            speed: 0.5,
            damage: 0.5
        },
        BUCKET: {
            id: 'bucket',
            hp: 1300,
            speed: 0.4,
            damage: 0.5
        }
    },

    // 关卡波次配置
    WAVES: [
        { time: 0, count: 0 },
        { time: 20, count: 1, interval: 8000 },
        { time: 60, count: 2, interval: 6000 },
        { time: 120, count: 3, interval: 4000 }
    ]
};
