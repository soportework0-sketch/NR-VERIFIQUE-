const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const express = require("express");
const config = require("./config.json");

const database = require("./database/database");

/* =========================================
   🌐 PORT
========================================= */

const PORT = config.port || 3000;

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("🛡️ NR VERIFIQUE está online.");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "online",
        bot: "NR VERIFIQUE"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Puerto activo: ${PORT}`);
});

/* =========================================
   🤖 CLIENTE
========================================= */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],

    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.User
    ]
});

/* =========================================
   🌎 IDIOMAS
========================================= */

const languages = {
    es: require("./languages/es.json"),
    en: require("./languages/en.json"),
    pt: require("./languages/pt.json"),
    fr: require("./languages/fr.json"),
    de: require("./languages/de.json"),
    it: require("./languages/it.json")
};

/* =========================================
   🛡️ MENÚ DE IDIOMAS
========================================= */

function createLanguageMenu() {

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId("select_language")
            .setPlaceholder(
                "🌎 Selecciona un idioma"
            )
            .addOptions(
                {
                    label: "Español",
                    description: "Usar NR VERIFIQUE en español",
                    value: "es",
                    emoji: "🇪🇸"
                },
                {
                    label: "English",
                    description: "Use NR VERIFIQUE in English",
                    value: "en",
                    emoji: "🇺🇸"
                },
                {
                    label: "Português",
                    description: "Usar NR VERIFIQUE em português",
                    value: "pt",
                    emoji: "🇧🇷"
                },
                {
                    label: "Français",
                    description: "Utiliser NR VERIFIQUE en français",
                    value: "fr",
                    emoji: "🇫🇷"
                },
                {
                    label: "Deutsch",
                    description: "NR VERIFIQUE auf Deutsch",
                    value: "de",
                    emoji: "🇩🇪"
                },
                {
                    label: "Italiano",
                    description: "Usare NR VERIFIQUE in italiano",
                    value: "it",
                    emoji: "🇮🇹"
                }
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =========================================
   📋 COMANDOS
========================================= */

const commands = [

    /* 🛡️ VERIFICACIÓN */

    new SlashCommandBuilder()
        .setName("verificar")
        .setDescription(
            "Inicia el proceso de verificación."
        ),

    new SlashCommandBuilder()
        .setName("desverificar")
        .setDescription(
            "Retira la verificación de un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        ),

    new SlashCommandBuilder()
        .setName("reverificar")
        .setDescription(
            "Obliga a un usuario a volver a verificarse."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageRoles
        ),

    new SlashCommandBuilder()
        .setName("estado")
        .setDescription(
            "Consulta el estado de verificación."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
        ),

    /* ⚙️ SETUP */

    new SlashCommandBuilder()
        .setName("setup")
        .setDescription(
            "Configura NR VERIFIQUE."
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("verificacion")
                .setDescription(
                    "Configura el sistema de verificación."
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName("idioma")
                .setDescription(
                    "Cambia el idioma del servidor."
                )
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    /* 🔨 MODERACIÓN */

    new SlashCommandBuilder()
        .setName("ban")
        .setDescription(
            "Banea a un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón.")
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription(
            "Expulsa a un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón.")
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        ),

    new SlashCommandBuilder()
        .setName("timeout")
        .setDescription(
            "Aplica un timeout."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("minutos")
                .setDescription("Duración.")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón.")
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    new SlashCommandBuilder()
        .setName("warn")
        .setDescription(
            "Advierte a un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription("Razón.")
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    new SlashCommandBuilder()
        .setName("clear")
        .setDescription(
            "Elimina mensajes."
        )
        .addIntegerOption(option =>
            option
                .setName("cantidad")
                .setDescription("Cantidad.")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    /* ℹ️ INFORMACIÓN */

    new SlashCommandBuilder()
        .setName("help")
        .setDescription(
            "Muestra la guía de NR VERIFIQUE."
        ),

    new SlashCommandBuilder()
        .setName("info")
        .setDescription(
            "Información del bot."
        ),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription(
            "Muestra la latencia."
        ),

    new SlashCommandBuilder()
        .setName("uptime")
        .setDescription(
            "Muestra el tiempo activo."
        ),

    new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription(
            "Información del servidor."
        ),

    new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription(
            "Información de un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Usuario.")
        )

].map(command => command.toJSON());

/* =========================================
   📡 REGISTRO GLOBAL
========================================= */

const rest =
    new REST({
        version: "10"
    })
    .setToken(config.token);

async function registerCommands() {

    try {

        console.log(
            "🔄 Registrando comandos globales..."
        );

        await rest.put(
            Routes.applicationCommands(
                config.clientId
            ),
            {
                body: commands
            }
        );

        console.log(
            "✅ Comandos globales registrados."
        );

    } catch (error) {

        console.error(
            "❌ Error registrando comandos:",
            error
        );

    }
}

/* =========================================
   🟢 READY
========================================= */

client.once("ready", () => {

    console.log(
        "===================================="
    );

    console.log(
        "🛡️ NR VERIFIQUE ONLINE"
    );

    console.log(
        "===================================="
    );

    console.log(
        `🤖 Bot: ${client.user.tag}`
    );

    console.log(
        `🌐 Servidores: ${client.guilds.cache.size}`
    );

    console.log(
        `📡 Ping: ${client.ws.ping}ms`
    );

    console.log(
        `🌐 PORT: ${PORT}`
    );

    console.log(
        "🔴 Estado: DND"
    );

    console.log(
        "⚙️ +10 bots en funcionamiento"
    );

    console.log(
        "===================================="
    );

    /* 🔴 DND */

    client.user.setPresence({

        status: "dnd",

        activities: [
            {
                name:
                    "⚙️ +10 bots en funcionamiento",

                type: 3
            }
        ]

    });

});

/* =========================================
   ➕ NUEVO SERVIDOR
========================================= */

client.on(
    "guildCreate",
    async guild => {

        console.log(
            `➕ Nuevo servidor: ${guild.name}`
        );

        /* 💾 Crear configuración */

        database.createGuild(
            guild.id
        );

        /* 👑 Obtener propietario */

        const owner =
            await guild.fetchOwner()
                .catch(() => null);

        if (!owner) return;

        /* 🌎 Panel */

        const embed =
            new EmbedBuilder()

                .setTitle(
                    "🛡️ NR VERIFIQUE"
                )

                .setDescription(

                    "## 🌎 Configuración inicial\n\n" +

                    "¡Gracias por añadir **NR VERIFIQUE**!\n\n" +

                    "Antes de utilizar el bot debes " +
                    "seleccionar el idioma del servidor.\n\n" +

                    "### Idiomas disponibles\n\n" +

                    "🇪🇸 Español\n" +
                    "🇺🇸 English\n" +
                    "🇧🇷 Português\n" +
                    "🇫🇷 Français\n" +
                    "🇩🇪 Deutsch\n" +
                    "🇮🇹 Italiano\n\n" +

                    "👇 **Selecciona un idioma:**"

                )

                .setColor(0x5865F2)

                .setFooter({
                    text:
                        "NR VERIFIQUE • Configuración inicial"
                });

        try {

            await owner.send({

                embeds: [
                    embed
                ],

                components: [
                    createLanguageMenu()
                ]

            });

            console.log(
                "📩 Configuración enviada por DM."
            );

        } catch {

            console.log(
                "⚠️ No se pudo enviar DM."
            );

            if (
                guild.systemChannel
            ) {

                await guild.systemChannel
                    .send({

                        embeds: [
                            embed
                        ],

                        components: [
                            createLanguageMenu()
                        ]

                    })
                    .catch(() => {});

            }

        }

    }
);

/* =========================================
   💬 INTERACCIONES
========================================= */

client.on(
    "interactionCreate",
    async interaction => {

        try {

            /* =====================================
               🌎 SELECTOR DE IDIOMA
            ===================================== */

            if (
                interaction.isStringSelectMenu() &&
                interaction.customId ===
                "select_language"
            ) {

                const selected =
                    interaction.values[0];

                const language =
                    languages[selected];

                if (!language) {

                    return interaction.reply({

                        content:
                            "❌ Idioma no válido.",

                        ephemeral: true

                    });

                }

                /* 💾 GUARDAR */

                database.setLanguage(
                    interaction.guild.id,
                    selected
                );

                const embed =
                    new EmbedBuilder()

                        .setTitle(
                            `${language.flag} ${language.welcome}`
                        )

                        .setDescription(

                            `✅ **${language.language_configured}**\n\n` +

                            `🌎 **${language.name}**\n\n` +

                            "Ya puedes utilizar NR VERIFIQUE.\n\n" +

                            "Usa `/setup verificacion` " +
                            "para comenzar a configurar " +
                            "el sistema."

                        )

                        .setColor(0x57F287)

                        .setFooter({
                            text:
                                "NR VERIFIQUE"
                        });

                return interaction.update({

                    embeds: [
                        embed
                    ],

                    components: []

                });

            }

            /* =====================================
               SOLO SLASH COMMANDS
            ===================================== */

            if (
                !interaction.isChatInputCommand()
            ) {
                return;
            }

            /* =====================================
               🌎 IDIOMA
            ===================================== */

            let languageCode =
                database.getLanguage(
                    interaction.guild.id
                );

            /* =====================================
               ⚙️ SETUP IDIOMA
            ===================================== */

            if (
                interaction.commandName === "setup" &&
                interaction.options.getSubcommand() ===
                "idioma"
            ) {

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setTitle(
                                "🌎 Idioma"
                            )

                            .setDescription(
                                "Selecciona el idioma que utilizará NR VERIFIQUE."
                            )

                            .setColor(
                                0x5865F2
                            )

                    ],

                    components: [
                        createLanguageMenu()
                    ],

                    ephemeral: true

                });

            }

            /* =====================================
               BLOQUEAR SI NO HAY IDIOMA
            ===================================== */

            if (!languageCode) {

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setTitle(
                                "🌎 Configuración requerida"
                            )

                            .setDescription(
                                "Primero debes seleccionar el idioma del servidor."
                            )

                            .setColor(
                                0xFEE75C
                            )

                    ],

                    components: [
                        createLanguageMenu()
                    ],

                    ephemeral: true

                });

            }

            const language =
                languages[languageCode];

            const command =
                interaction.commandName;

            /* =====================================
               📖 HELP
            ===================================== */

            if (command === "help") {

                const embed =
                    new EmbedBuilder()

                        .setTitle(
                            `🛡️ NR VERIFIQUE`
                        )

                        .setDescription(

                            `## 📚 ${language.help}\n\n` +

                            "### 🛡️ Verificación\n" +
                            "`/verificar`\n" +
                            "`/desverificar`\n" +
                            "`/reverificar`\n" +
                            "`/estado`\n\n" +

                            "### ⚙️ Configuración\n" +
                            "`/setup verificacion`\n" +
                            "`/setup idioma`\n\n" +

                            "### 🔨 Moderación\n" +
                            "`/ban`\n" +
                            "`/kick`\n" +
                            "`/timeout`\n" +
                            "`/warn`\n" +
                            "`/clear`\n\n" +

                            "### ℹ️ Información\n" +
                            "`/info`\n" +
                            "`/ping`\n" +
                            "`/uptime`\n" +
                            "`/serverinfo`\n" +
                            "`/userinfo`"

                        )

                        .addFields({

                            name:
                                "🆘 Soporte",

                            value:
                                "[Servidor oficial de soporte](https://discord.gg/PZw45tHPfc)"

                        })

                        .setColor(
                            0x5865F2
                        )

                        .setFooter({

                            tex:
                                `NR VERIFIQUE • ${language.name}`

                        });

                return interaction.reply({

                    embeds: [
                        embed
                    ],

                    ephemeral: true

                });

            }

            /* =====================================
               🛡️ VERIFICAR
            ===================================== */

            if (command === "verificar") {

                const verification =
                    database.getVerification(
                        interaction.guild.id
                    );

                if (
                    !verification ||
                    !verification.enabled
                ) {

                    return interaction.reply({

                        content:
                            "❌ El sistema de verificación todavía no está configurado.",

                        ephemeral: true

                    });

                }

                return interaction.reply({

                    content:
                        "🛡️ El sistema de verificación está activo.",

                    ephemeral: true

                });

            }

            /* =====================================
               ⚙️ SETUP VERIFICACIÓN
            ===================================== */

            if (
                command === "setup" &&
                interaction.options.getSubcommand() ===
                "verificacion"
            ) {

                const embed =
                    new EmbedBuilder()

                        .setTitle(
                            "🛡️ NR VERIFIQUE"
                        )

                        .setDescription(
                            "### Configuración de verificación\n\n" +
                            "Aquí podrás configurar el panel de verificación."
                        )

                        .addFields(

                            {
                                name:
                                    "📍 Canal",

                                value:
                                    "Por configurar",

                                inline: true
                            },

                            {
                                name:
                                    "👤 Rol verificado",

                                value:
                                    "Por configurar",

                                inline: true
                            },

                            {
                                name:
                                    "📋 Canal de logs",

                                value:
                                    "Por configurar",

                                inline: true
                            },

                            {
                                name:
                                    "🛡️ Tipo",

                                value:
                                    "🔢 Código MD\n" +
                                    "🤖 CAPTCHA\n" +
                                    "🧩 Puzle\n" +
                                    "📋 Cuestionario"

                            },

                            {
                                name:
                                    "🎨 Panel",

                                value:
                                    "Mensaje, color e imagen personalizables."

                            }

                        )

                        .setColor(
                            0x5865F2
                        );

                return interaction.reply({

                    embeds: [
                        embed
                    ],

                    ephemeral: true

                });

            }

            /* =====================================
               🏓 PING
            ===================================== */

            if (command === "ping") {

                return interaction.reply({

                    content:
                        `🏓 Pong! **${client.ws.ping}ms**`,

                    ephemeral: true

                });

            }

            /* =====================================
               ℹ️ INFO
            ===================================== */

            if (command === "info") {

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setTitle(
                                "🛡️ NR VERIFIQUE"
                            )

                            .setDescription(
                                "Bot global de verificación y moderación."
                            )

                            .addFields(

                                {
                                    name:
                                        "🌐 Servidores",

                                    value:
                                        `${client.guilds.cache.size}`,

                                    inline: true
                                },

                                {
                                    name:
                                        "📡 Ping",

                                    value:
                                        `${client.ws.ping}ms`,

                                    inline: true
                                },

                                {
                                    name:
                                        "🌎 Idioma",

                                    value:
                                        `${language.flag} ${language.name}`,

                                    inline: true
                                }

                            )

                            .setColor(
                                0x5865F2
                            )

                    ]

                });

            }

            /* =====================================
               ⏱️ UPTIME
            ===================================== */

            if (command === "uptime") {

                const seconds =
                    Math.floor(
                        client.uptime / 1000
                    );

                const days =
                    Math.floor(
                        seconds / 86400
                    );

                const hours =
                    Math.floor(
                        (seconds % 86400) / 3600
                    );

                const minutes =
                    Math.floor(
                        (seconds % 3600) / 60
                    );

                return interaction.reply({

                    content:
                        `⏱️ **NR VERIFIQUE**\n\n` +
                        `📅 ${days} días\n` +
                        `🕐 ${hours} horas\n` +
                        `⏰ ${minutes} minutos`,

                    ephemeral: true

                });

            }

            /* =====================================
               🔨 BAN
            ===================================== */

            if (command === "ban") {

                const user =
                    interaction.options
                        .getUser("usuario");

                const reason =
                    interaction.options
                        .getString("razon") ||
                    "Sin razón especificada";

                const member =
                    await interaction.guild.members
                        .fetch(user.id)
                        .catch(() => null);

                if (
                    !member ||
                    !member.bannable
                ) {

                    return interaction.reply({

                        content:
                            "❌ No puedo banear a este usuario.",

                        ephemeral: true

                    });

                }

                await member.ban({
                    reason
                });

                return interaction.reply(
                    `🔨 **${user.tag}** fue baneado.\n📝 ${reason}`
                );

            }

            /* =====================================
               👢 KICK
            ===================================== */

            if (command === "kick") {

                const user =
                    interaction.options
                        .getUser("usuario");

                const reason =
                    interaction.options
                        .getString("razon") ||
                    "Sin razón especificada";

                const member =
                    await interaction.guild.members
                        .fetch(user.id)
                        .catch(() => null);

                if (
                    !member ||
                    !member.kickable
                ) {

                    return interaction.reply({

                        content:
                            "❌ No puedo expulsar a este usuario.",

                        ephemeral: true

                    });

                }

                await member.kick(
                    reason
                );

                return interaction.reply(
                    `👢 **${user.tag}** fue expulsado.\n📝 ${reason}`
                );

            }

            /* =====================================
               🔇 TIMEOUT
            ===================================== */

            if (command === "timeout") {

                const user =
                    interaction.options
                        .getUser("usuario");

                const minutes =
                    interaction.options
                        .getInteger("minutos");

                const reason =
                    interaction.options
                        .getString("razon") ||
                    "Sin razón especificada";

                const member =
                    await interaction.guild.members
                        .fetch(user.id)
                        .catch(() => null);

                if (
                    !member ||
                    !member.moderatable
                ) {

                    return interaction.reply({

                        content:
                            "❌ No puedo aplicar timeout.",

                        ephemeral: true

                    });

                }

                await member.timeout(
                    minutes * 60 * 1000,
                    reason
                );

                return interaction.reply(
                    `🔇 **${user.tag}** recibió timeout de **${minutes} minutos**.`
                );

            }

            /* =====================================
               🧹 CLEAR
            ===================================== */

            if (command === "clear") {

                const amount =
                    interaction.options
                        .getInteger("cantidad");

                const messages =
                    await interaction.channel
                        .bulkDelete(
                            amount,
                            true
                        );

                return interaction.reply({

                    content:
                        `🧹 Eliminé **${messages.size} mensajes**.`,

                    ephemeral: true

                });

            }

            /* =====================================
               ⚠️ WARN
            ===================================== */

            if (command === "warn") {

                const user =
                    interaction.options
                        .getUser("usuario");

                const reason =
                    interaction.options
                        .getString("razon");

                return interaction.reply(
                    `⚠️ **${user.tag}** recibió una advertencia.\n📝 ${reason}`
                );

            }

            /* =====================================
               👤 USERINFO
            ===================================== */

            if (command === "userinfo") {

                const user =
                    interaction.options
                        .getUser("usuario") ||
                    interaction.user;

                return interaction.reply({

                    embeds: [

                        new EmbedBuilder()

                            .setTitle(
                                `👤 ${user.username}`
                            )

                            .setThumbnail(
                                user.displayAvatarURL()
                            )

                            .addFields(

                                {
                                    name:
                                        "🆔 ID",

                                    value:
                                        user.id
                                },

                                {
                                    name:
                                        "🤖 Bot",

                                    value:
                                        user.bot
                                            ? "Sí"
                                            : "No"
                                }

                            )

                            .setColor(
                                0x5865F2
                            )

                    ]

                });

            }

        } catch (error) {

            console.error(
                "❌ Error:",
                error
            );

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                return interaction.followUp({

                    content:
                        "❌ Ocurrió un error.",

                    ephemeral: true

                });

            }

            return interaction.reply({

                content:
                    "❌ Ocurrió un error.",

                ephemeral: true

            });

        }

    }
);

/* =========================================
   🚨 ERRORES
========================================= */

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ Unhandled Rejection:",
            error
        );

    }
);

process.on(
    "uncaughtException",
    error => {

        console.error(
            "❌ Uncaught Exception:",
            error
        );

    }
);

/* =========================================
   🚀 INICIAR
========================================= */

async function start() {

    if (!config.token) {

        console.error(
            "❌ Falta el token en config.json"
        );

        process.exit(1);

    }

    if (!config.clientId) {

        console.error(
            "❌ Falta clientId en config.json"
        );

        process.exit(1);

    }

    await registerCommands();

    await client.login(
        config.token
    );

}

start();
