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
            bulletSpeed: 300
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
            bulletSpeed: 300
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
            bulletSpeed: 300
        },
        CHOMPER: {
            id: 'chomper',
            name: '食人花',
            emoji: '👅',
            cost: 200,
            cooldown: 15000,
            hp: 300,
            chewTime: 42000
        },
        CHERRYBOMB: {
            id: 'cherrybomb',
            name: '樱桃炸弹',
            emoji: '🍒',
            cost: 150,
            cooldown: 25000,
            hp: 9999,
            fuseTime: 1200
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

    // 僵尸属性 — deltaTime 驱动
    ZOMBIES: {
        NORMAL: {
            id: 'normal',
            name: '普通僵尸',
            emoji: '🧟',
            hp: 200,
            gridSpeed: 4.7,
            damagePerSec: 30
        },
        CONE: {
            id: 'cone',
            name: '路障僵尸',
            emoji: '🚧',
            hp: 560,
            gridSpeed: 4.7,
            damagePerSec: 30
        },
        BUCKET: {
            id: 'bucket',
            name: '铁桶僵尸',
            emoji: '🪣',
            hp: 1300,
            gridSpeed: 4.7,
            damagePerSec: 30
        },
        POLEVAULT: {
            id: 'polevault',
            name: '撑杆僵尸',
            emoji: '🏃',
            hp: 340,
            gridSpeed: 2.5,
            gridSpeedAfterJump: 4.7,
            damagePerSec: 30
        }
    },

    // 关卡配置 — 用精确数量代替权重
    LEVELS: [
        {
            id: 1,
            name: '第 1 关',
            totalZombies: 10,
            zombiePool: [
                { type: 'NORMAL', count: 10 }
            ],
            availablePlants: ['PEASHOOTER'],
            startScore: 150,
            spawnInterval: 6000,
            waves: [
                { at: 0,  count: 3, msg: '🛡️ 准备防御！' },
                { at: 3,  count: 3, msg: '💀 僵尸来袭！' },
                { at: 6,  count: 4, msg: '💀💀 最后一波！' }
            ]
        },
        {
            id: 2,
            name: '第 2 关',
            totalZombies: 15,
            zombiePool: [
                { type: 'NORMAL', count: 12 },
                { type: 'CONE',   count: 3 }
            ],
            availablePlants: ['PEASHOOTER', 'WALLNUT'],
            startScore: 200,
            spawnInterval: 5500,
            waves: [
                { at: 0,  count: 4, msg: '🛡️ 准备防御！' },
                { at: 4,  count: 5, msg: '💀 僵尸来袭！' },
                { at: 9,  count: 6, msg: '💀💀 最后一波！' }
            ]
        },
        {
            id: 3,
            name: '第 3 关',
            totalZombies: 23,
            zombiePool: [
                { type: 'NORMAL', count: 17 },
                { type: 'CONE',   count: 6 }
            ],
            availablePlants: ['PEASHOOTER', 'WALLNUT', 'CHERRYBOMB'],
            startScore: 250,
            spawnInterval: 5000,
            waves: [
                { at: 0,  count: 6, msg: '🛡️ 准备防御！' },
                { at: 6,  count: 8, msg: '💀 僵尸来袭！' },
                { at: 14, count: 9, msg: '💀💀 最后一波！' }
            ]
        },
        {
            id: 4,
            name: '第 4 关',
            totalZombies: 30,
            zombiePool: [
                { type: 'NORMAL',    count: 20 },
                { type: 'CONE',      count: 7 },
                { type: 'POLEVAULT', count: 3 }
            ],
            availablePlants: ['PEASHOOTER', 'WALLNUT', 'CHERRYBOMB', 'REPEATER'],
            startScore: 300,
            spawnInterval: 4500,
            waves: [
                { at: 0,  count: 8,  msg: '🛡️ 准备防御！' },
                { at: 8,  count: 10, msg: '💀 僵尸来袭！' },
                { at: 18, count: 12, msg: '💀💀 最后一波！' }
            ]
        },
        {
            id: 5,
            name: '第 5 关',
            totalZombies: 37,
            zombiePool: [
                { type: 'NORMAL',    count: 23 },
                { type: 'CONE',      count: 9 },
                { type: 'POLEVAULT', count: 5 }
            ],
            availablePlants: ['PEASHOOTER', 'WALLNUT', 'CHERRYBOMB', 'REPEATER', 'CHOMPER'],
            maxSlots: 4,
            startScore: 300,
            spawnInterval: 4000,
            waves: [
                { at: 0,  count: 10, msg: '🛡️ 准备防御！' },
                { at: 10, count: 13, msg: '💀 僵尸来袭！' },
                { at: 23, count: 14, msg: '💀💀 最后一波！' }
            ]
        },
        {
            id: 6,
            name: '第 6 关',
            totalZombies: 37,
            zombiePool: [
                { type: 'NORMAL',    count: 16 },
                { type: 'CONE',      count: 9 },
                { type: 'POLEVAULT', count: 7 },
                { type: 'BUCKET',    count: 5 }
            ],
            availablePlants: ['PEASHOOTER', 'WALLNUT', 'CHERRYBOMB', 'REPEATER', 'GATLINGPEA', 'CHOMPER'],
            maxSlots: 4,
            startScore: 350,
            spawnInterval: 3500,
            waves: [
                { at: 0,  count: 10, msg: '🛡️ 准备防御！' },
                { at: 10, count: 13, msg: '💀 僵尸来袭！' },
                { at: 23, count: 14, msg: '💀💀 最后一波！' }
            ]
        }
    ]
};
