const fs = require("fs");
const path = require("path");

const databaseFile = path.join(__dirname, "guilds.json");

function ensureDatabase() {
    if (!fs.existsSync(__dirname)) {
        fs.mkdirSync(__dirname, { recursive: true });
    }

    if (!fs.existsSync(databaseFile)) {
        fs.writeFileSync(
            databaseFile,
            JSON.stringify({ guilds: {} }, null, 4),
            "utf8"
        );
    }
}

function readDatabase() {
    ensureDatabase();

    try {
        const data = fs.readFileSync(databaseFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("❌ Error leyendo la base de datos:", error);

        return {
            guilds: {}
        };
    }
}

function saveDatabase(data) {
    ensureDatabase();

    try {
        fs.writeFileSync(
            databaseFile,
            JSON.stringify(data, null, 4),
            "utf8"
        );

        return true;
    } catch (error) {
        console.error("❌ Error guardando la base de datos:", error);
        return false;
    }
}

function createGuild(guildId) {
    const database = readDatabase();

    if (!database.guilds[guildId]) {
        database.guilds[guildId] = {
            language: null,

            verification: {
                enabled: false,
                channelId: null,
                roleId: null,
                logsChannelId: null,
                type: null,
                message: "🛡️ Verifícate para acceder al servidor.",
                color: "#5865F2",
                image: null,
                thumbnail: null
            },

            setup: {
                configured: false
            },

            statistics: {
                verified: 0,
                failed: 0
            }
        };

        saveDatabase(database);
    }

    return database.guilds[guildId];
}

function getGuild(guildId) {
    const database = readDatabase();

    return database.guilds[guildId] || null;
}

function getLanguage(guildId) {
    const guild = getGuild(guildId);

    if (!guild) {
        return null;
    }

    return guild.language;
}

function setLanguage(guildId, language) {
    const database = readDatabase();

    if (!database.guilds[guildId]) {
        database.guilds[guildId] = createDefaultGuild();
    }

    database.guilds[guildId].language = language;

    saveDatabase(database);

    return true;
}

function getVerification(guildId) {
    const guild = getGuild(guildId);

    if (!guild) {
        return null;
    }

    return guild.verification;
}

function setVerification(guildId, settings) {
    const database = readDatabase();

    if (!database.guilds[guildId]) {
        database.guilds[guildId] = createDefaultGuild();
    }

    database.guilds[guildId].verification = {
        ...database.guilds[guildId].verification,
        ...settings
    };

    saveDatabase(database);

    return true;
}

function addVerified(guildId) {
    const database = readDatabase();

    if (!database.guilds[guildId]) {
        database.guilds[guildId] = createDefaultGuild();
    }

    database.guilds[guildId].statistics.verified++;

    saveDatabase(database);
}

function addFailed(guildId) {
    const database = readDatabase();

    if (!database.guilds[guildId]) {
        database.guilds[guildId] = createDefaultGuild();
    }

    database.guilds[guildId].statistics.failed++;

    saveDatabase(database);
}

function deleteGuild(guildId) {
    const database = readDatabase();

    if (!database.guilds[guildId]) {
        return false;
    }

    delete database.guilds[guildId];

    saveDatabase(database);

    return true;
}

function createDefaultGuild() {
    return {
        language: null,

        verification: {
            enabled: false,
            channelId: null,
            roleId: null,
            logsChannelId: null,
            type: null,
            message: "🛡️ Verifícate para acceder al servidor.",
            color: "#5865F2",
            image: null,
            thumbnail: null
        },

        setup: {
            configured: false
        },

        statistics: {
            verified: 0,
            failed: 0
        }
    };
}

module.exports = {
    createGuild,
    getGuild,
    getLanguage,
    setLanguage,
    getVerification,
    setVerification,
    addVerified,
    addFailed,
    deleteGuild,
    readDatabase,
    saveDatabase
};
