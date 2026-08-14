const fs = require("fs");
const path = require("path");

/* =========================================
   📁 ARCHIVO DE BASE DE DATOS
========================================= */

const databaseFolder = __dirname;
const databaseFile = path.join(
    databaseFolder,
    "guilds.json"
);

/* =========================================
   🗃️ CREAR BASE DE DATOS
========================================= */

function createDatabase() {

    if (!fs.existsSync(databaseFolder)) {
        fs.mkdirSync(databaseFolder, {
            recursive: true
        });
    }

    if (!fs.existsSync(databaseFile)) {

        fs.writeFileSync(
            databaseFile,
            JSON.stringify(
                {
                    guilds: {}
                },
                null,
                4
            )
        );

    }

}

/* =========================================
   📖 LEER BASE DE DATOS
========================================= */

function readDatabase() {

    createDatabase();

    try {

        const data =
            fs.readFileSync(
                databaseFile,
                "utf8"
            );

        return JSON.parse(data);

    } catch (error) {

        console.error(
            "❌ Error leyendo la base de datos:",
            error
        );

        return {
            guilds: {}
        };

    }

}

/* =========================================
   💾 GUARDAR BASE DE DATOS
========================================= */

function saveDatabase(data) {

    createDatabase();

    try {

        fs.writeFileSync(
            databaseFile,
            JSON.stringify(
                data,
                null,
                4
            )
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Error guardando la base de datos:",
            error
        );

        return false;

    }

}

/* =========================================
   🏠 CREAR SERVIDOR
========================================= */

function createGuild(guildId) {

    const database =
        readDatabase();

    if (!database.guilds[guildId]) {

        database.guilds[guildId] = {

            /* 🌎 Idioma */

            language: null,

            /* 🛡️ VERIFICACIÓN */

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

            /* ⚙️ CONFIGURACIÓN */

            setup: {

                configured: false

            },

            /* 📊 ESTADÍSTICAS */

            statistics: {

                verified: 0,

                failed: 0

            }

        };

        saveDatabase(database);

    }

    return database.guilds[guildId];

}

/* =========================================
   🔎 OBTENER SERVIDOR
========================================= */

function getGuild(guildId) {

    const database =
        readDatabase();

    return (
        database.guilds[guildId] ||
        null
    );

}

/* =========================================
   🌎 OBTENER IDIOMA
========================================= */

function getLanguage(guildId) {

    const guild =
        getGuild(guildId);

    if (!guild) {
        return null;
    }

    return guild.language;

}

/* =========================================
   🌎 GUARDAR IDIOMA
========================================= */

function setLanguage(
    guildId,
    language
) {

    const database =
        readDatabase();

    if (!database.guilds[guildId]) {
        createGuild(guildId);
    }

    database.guilds[guildId].language =
        language;

    saveDatabase(database);

    return true;

}

/* =========================================
   🛡️ CONFIGURACIÓN VERIFICACIÓN
========================================= */

function getVerification(
    guildId
) {

    const guild =
        getGuild(guildId);

    if (!guild) {
        return null;
    }

    return guild.verification;

}

/* =========================================
   🛡️ GUARDAR VERIFICACIÓN
========================================= */

function setVerification(
    guildId,
    settings
) {

    const database =
        readDatabase();

    if (!database.guilds[guildId]) {
        createGuild(guildId);
    }

    database.guilds[guildId].verification = {
        ...database.guilds[guildId].verification,
        ...settings
    };

    saveDatabase(database);

    return true;

}

/* =========================================
   📊 ESTADÍSTICAS
========================================= */

function addVerified(
    guildId
) {

    const database =
        readDatabase();

    if (!database.guilds[guildId]) {
        createGuild(guildId);
    }

    database.guilds[guildId]
        .statistics
        .verified++;

    saveDatabase(database);

}

function addFailed(
    guildId
) {

    const database =
        readDatabase();

    if (!database.guilds[guildId]) {
        createGuild(guildId);
    }

    database.guilds[guildId]
        .statistics
        .failed++;

    saveDatabase(database);

}

/* =========================================
   🗑️ ELIMINAR SERV
