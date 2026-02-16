// 僵尸类型常量
const oZ = {
    NZ: 'NORMAL',
    BZ: 'CONE',
    TZ: 'BUCKET',
    CG: 'POLEVAULT'
};

export default {
    GRID_ROWS: 9,
    GRID_COLS: 5,
    GRID_SIZE: 100,
    GAME_WIDTH: 500,
    GAME_HEIGHT: 900,

    // ============ 植物属性 ============
    PLANTS: {
        PEASHOOTER: {
            id: 'peashooter', name: '豌豆射手', emoji: '🌱',
            cost: 100, cooldown: 3000, hp: 300,
            damage: 20, bulletCount: 1, attackSpeed: 1400,
            range: 9, bulletSpeed: 300
        },
        SNOWPEA: {
            id: 'snowpea', name: '寒冰射手', emoji: '❄️',
            cost: 175, cooldown: 7500, hp: 300,
            damage: 20, bulletCount: 1, attackSpeed: 1500,
            range: 9, bulletSpeed: 300,
            isFrozen: true, slowDuration: 10000, slowFactor: 0.5
        },
        REPEATER: {
            id: 'repeater', name: '双发射手', emoji: '🌿',
            cost: 150, cooldown: 10000, hp: 300,
            damage: 20, bulletCount: 2, attackSpeed: 1400,
            range: 9, bulletSpeed: 300
        },
        GATLINGPEA: {
            id: 'gatlingpea', name: '加特林', emoji: '🔫',
            cost: 250, cooldown: 15000, hp: 300,
            damage: 20, bulletCount: 4, attackSpeed: 1400,
            range: 9, bulletSpeed: 300
        },
        POTATOMINE: {
            id: 'potatomine', name: '土豆地雷', emoji: '🥔',
            cost: 25, cooldown: 30000, hp: 300,
            armTime: 15000, explosionDamage: 1800
        },
        CHOMPER: {
            id: 'chomper', name: '食人花', emoji: '👅',
            cost: 200, cooldown: 15000, hp: 300,
            chewTime: 42000
        },
        CHERRYBOMB: {
            id: 'cherrybomb', name: '樱桃炸弹', emoji: '🍒',
            cost: 150, cooldown: 25000, hp: 9999,
            fuseTime: 1200
        },
        WALLNUT: {
            id: 'wallnut', name: '坚果墙', emoji: '🥜',
            cost: 50, cooldown: 15000, hp: 4000
        }
    },

    // ============ 僵尸属性 ============
    ZOMBIES: {
        NORMAL:    { id: 'normal',    name: '普通僵尸', emoji: '🧟', hp: 200,  gridSpeed: 4.7, damagePerSec: 30 },
        CONE:      { id: 'cone',      name: '路障僵尸', emoji: '🚧', hp: 560,  gridSpeed: 4.7, damagePerSec: 30 },
        BUCKET:    { id: 'bucket',    name: '铁桶僵尸', emoji: '🪣', hp: 1300, gridSpeed: 4.7, damagePerSec: 30 },
        POLEVAULT: { id: 'polevault', name: '撑杆僵尸', emoji: '🏃', hp: 340,  gridSpeed: 2.5, gridSpeedAfterJump: 4.7, damagePerSec: 30 }
    },

    // ============ 关卡配置 ============
    // FlagNum: 总波数
    // FlagToSumNum.a1: 大波标记（哪些波是"一大波僵尸正在接近"）
    // FlagToSumNum.a2: 每波僵尸数量数组
    // AZ: [[僵尸类型, 权重, 起始波次]]
    // needPick: 是否需要选卡
    // maxSlots: 卡槽数
    // hasCraters: 是否有陨石坑机制
    // reward: 通关奖励 { emoji, name, unlockPlant }
    // hasShovel: 是否解锁铲子（1-4通关后永久解锁）
    LEVELS: [
        {
            id: 1, name: 'Level 1-1',
            availablePlants: ['PEASHOOTER'],
            needPick: false,
            maxSlots: 1,
            startSun: 150,
            hasCraters: false,
            hasShovel: false,
            FlagNum: 5,
            FlagToSumNum: {
                a1: [5],
                a2: [1, 2, 2, 3, 4]
            },
            AZ: [
                [oZ.NZ, 4, 1]
            ],
            spawnInterval: 2500,
            reward: null
        },
        {
            id: 2, name: 'Level 1-2',
            availablePlants: ['PEASHOOTER'],
            needPick: false,
            maxSlots: 1,
            startSun: 50,
            hasCraters: false,
            hasShovel: false,
            FlagNum: 6,
            FlagToSumNum: {
                a1: [6],
                a2: [1, 2, 2, 3, 3, 4]
            },
            AZ: [
                [oZ.NZ, 4, 1]
            ],
            spawnInterval: 2400,
            reward: { emoji: '💣', name: '樱桃炸弹', unlockPlant: 'CHERRYBOMB' }
        },
        {
            id: 3, name: 'Level 1-3',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB'],
            needPick: false,
            maxSlots: 2,
            startSun: 50,
            hasCraters: false,
            hasShovel: false,
            FlagNum: 8,
            FlagToSumNum: {
                a1: [8],
                a2: [1, 2, 2, 3, 3, 3, 4, 4]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 2, 3]
            ],
            spawnInterval: 2300,
            reward: { emoji: '🧱', name: '坚果墙', unlockPlant: 'WALLNUT' }
        },
        {
            id: 4, name: 'Level 1-4',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT'],
            needPick: false,
            maxSlots: 3,
            startSun: 50,
            hasCraters: false,
            hasShovel: false,
            FlagNum: 9,
            FlagToSumNum: {
                a1: [9],
                a2: [1, 2, 2, 3, 3, 4, 4, 4, 4]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 2, 2]
            ],
            spawnInterval: 2200,
            reward: { emoji: '🔧', name: '铲子', unlockShovel: true }
        },
        {
            id: 5, name: '1-5 陨石洞●',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT'],
            needPick: false,
            maxSlots: 3,
            startSun: 50,
            hasCraters: true,
            hasShovel: true,
            FlagNum: 10,
            FlagToSumNum: {
                a1: [10],
                a2: [2, 2, 3, 3, 3, 4, 4, 4, 4, 5]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 2, 2]
            ],
            spawnInterval: 2100,
            reward: { emoji: '🥔', name: '土豆地雷', unlockPlant: 'POTATOMINE' }
        },
        {
            id: 6, name: 'Level 1-6',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT', 'POTATOMINE'],
            needPick: false,
            maxSlots: 4,
            startSun: 50,
            hasCraters: false,
            hasShovel: true,
            FlagNum: 9,
            FlagToSumNum: {
                a1: [9],
                a2: [2, 2, 3, 3, 3, 4, 4, 4, 5]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 2, 2],
                [oZ.CG, 2, 4]
            ],
            spawnInterval: 2000,
            reward: { emoji: '❄️', name: '寒冰射手', unlockPlant: 'SNOWPEA' }
        },
        {
            id: 7, name: 'Level 1-7',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT', 'POTATOMINE', 'SNOWPEA'],
            needPick: true,
            maxSlots: 4,
            startSun: 50,
            hasCraters: false,
            hasShovel: true,
            FlagNum: 20,
            FlagToSumNum: {
                a1: [10, 20],
                a2: [2,3,3,3,3,4,4,4,4,5, 5,5,5,6,6,6,6,7,7,8]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 2, 1],
                [oZ.CG, 2, 5]
            ],
            spawnInterval: 1800,
            reward: { emoji: '👅', name: '食人花', unlockPlant: 'CHOMPER' }
        },
        {
            id: 8, name: 'Level 1-8',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT', 'POTATOMINE', 'SNOWPEA', 'CHOMPER'],
            needPick: true,
            maxSlots: 4,
            startSun: 50,
            hasCraters: false,
            hasShovel: true,
            FlagNum: 10,
            FlagToSumNum: {
                a1: [10],
                a2: [2, 3, 3, 3, 4, 4, 4, 4, 4, 5]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 2, 1],
                [oZ.CG, 2, 3],
                [oZ.TZ, 1, 5]
            ],
            spawnInterval: 1900,
            reward: { emoji: '🌿', name: '双发射手', unlockPlant: 'REPEATER' }
        },
        {
            id: 9, name: 'Level 1-9',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT', 'POTATOMINE', 'SNOWPEA', 'CHOMPER', 'REPEATER'],
            needPick: true,
            maxSlots: 4,
            startSun: 50,
            hasCraters: false,
            hasShovel: true,
            FlagNum: 30,
            FlagToSumNum: {
                a1: [10, 20, 30],
                a2: [2,2,3,3,3,3,4,4,4,5, 5,5,5,5,6,6,6,6,6,7, 7,7,7,7,8,8,8,8,9,10]
            },
            AZ: [
                [oZ.NZ, 4, 1],
                [oZ.BZ, 3, 1],
                [oZ.CG, 2, 3],
                [oZ.TZ, 2, 8]
            ],
            spawnInterval: 1700,
            reward: null
        },
        {
            id: 10, name: 'Level 1-10 陨石洞●',
            availablePlants: ['PEASHOOTER', 'CHERRYBOMB', 'WALLNUT', 'POTATOMINE', 'SNOWPEA', 'CHOMPER', 'REPEATER'],
            needPick: true,
            maxSlots: 4,
            startSun: 50,
            hasCraters: true,
            hasShovel: true,
            FlagNum: 30,
            FlagToSumNum: {
                a1: [10, 20, 30],
                a2: [2,2,3,3,3,3,4,4,4,5, 5,5,5,5,6,6,6,6,6,7, 7,7,7,7,8,8,8,8,9,10]
            },
            AZ: [
                [oZ.NZ, 3, 1],
                [oZ.BZ, 3, 1],
                [oZ.CG, 3, 3],
                [oZ.TZ, 2, 5]
            ],
            spawnInterval: 1600,
            reward: null
        }
    ]
};
