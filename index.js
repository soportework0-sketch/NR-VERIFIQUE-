const {
    Client,
    GatewayIntentBits,
    Events,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

const express = require("express");
const fs = require("fs");
const path = require("path");

/* =====================================================
   CONFIGURACIÓN
===================================================== */

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const PORT = process.env.PORT || 10000;

if (!TOKEN) {
    console.error("❌ Falta TOKEN en Render.");
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error("❌ Falta CLIENT_ID en Render.");
    process.exit(1);
}

/* =====================================================
   SERVIDOR WEB PARA RENDER
   SOLO UNA VEZ
===================================================== */

const app = express();

app.get("/", (req, res) => {
    res.status(200).send(
        "🛡️ NR VERIFIQUE está funcionando correctamente."
    );
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

/* =====================================================
   CLIENTE DISCORD
   NO MESSAGE CONTENT
   NO GUILD MEMBERS
===================================================== */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

/* =====================================================
   BASE DE DATOS
===================================================== */

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "config.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({}, null, 2)
    );
}

function loadDatabase() {
    try {
        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );
    } catch {
        return {};
    }
}

function saveDatabase(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 2)
    );
}

function defaultConfig() {
    return {
        language: "es",
        verification: {
            enabled: false,
            channelId: null,
            roleId: null,
            logsChannelId: null,
            type: "code",
            message:
                "🛡️ Pulsa el botón para comenzar tu verificación.",
            color: "#5865F2",
            image: null
        }
    };
}

function getGuildConfig(guildId) {
    const db = loadDatabase();

    if (!db[guildId]) {
        db[guildId] = defaultConfig();
        saveDatabase(db);
    }

    return db[guildId];
}

function updateGuildConfig(guildId, changes) {
    const db = loadDatabase();

    if (!db[guildId]) {
        db[guildId] = defaultConfig();
    }

    db[guildId] = {
        ...db[guildId],
        ...changes,
        verification: {
            ...db[guildId].verification,
            ...(changes.verification || {})
        }
    };

    saveDatabase(db);

    return db[guildId];
}

/* =====================================================
   COLOR
===================================================== */

function parseColor(color) {
    if (!color) {
        return 0x5865F2;
    }

    const value = String(color)
        .replace("#", "")
        .trim();

    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return 0x5865F2;
    }

    return parseInt(value, 16);
}

/* =====================================================
   TIPOS
===================================================== */

const TYPE_NAMES = {
    code: "🔢 Código MD",
    captcha: "🤖 CAPTCHA",
    puzzle: "🧩 Puzle",
    quiz: "📋 Cuestionario"
};

/* =====================================================
   COMANDOS
===================================================== */

const commands = [

    new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Configura NR VERIFIQUE.")
        .addSubcommand(sub =>
            sub
                .setName("verificacion")
                .setDescription(
                    "Configura el sistema de verificación."
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("idioma")
                .setDescription(
                    "Configura el idioma."
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    new SlashCommandBuilder()
        .setName("verificar")
        .setDescription(
            "Abre el sistema de verificación."
        ),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription(
            "Muestra la latencia."
        ),

    new SlashCommandBuilder()
        .setName("info")
        .setDescription(
            "Información del bot."
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
                .setDescription(
                    "Usuario a consultar."
                )
        ),

    new SlashCommandBuilder()
        .setName("help")
        .setDescription(
            "Muestra la ayuda."
        ),

    new SlashCommandBuilder()
        .setName("ban")
        .setDescription(
            "Banea un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription(
                    "Usuario."
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription(
                    "Razón."
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    new SlashCommandBuilder()
        .setName("kick")
        .setDescription(
            "Expulsa un usuario."
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription(
                    "Usuario."
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("razon")
                .setDescription(
                    "Razón."
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        )

].map(command => command.toJSON());

/* =====================================================
   REGISTRAR COMANDOS
===================================================== */

async function registerCommands() {

    try {

        console.log(
            "🔄 Registrando comandos globales..."
        );

        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(
                CLIENT_ID
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

/* =====================================================
   EMBED SETUP
===================================================== */

function createSetupEmbed(guild) {

    const config =
        getGuildConfig(guild.id);

    const v =
        config.verification;

    return new EmbedBuilder()
        .setTitle(
            "🛡️ NR VERIFIQUE"
        )
        .setDescription(
            "## ⚙️ Configuración de verificación\n\n" +
            "Selecciona una opción en el menú de abajo " +
            "para configurar el sistema."
        )
        .addFields(

            {
                name: "📌 Canal",
                value:
                    v.channelId
                        ? `<#${v.channelId}>`
                        : "❌ Sin configurar",
                inline: true
            },

            {
                name: "👤 Rol",
                value:
                    v.roleId
                        ? `<@&${v.roleId}>`
                        : "❌ Sin configurar",
                inline: true
            },

            {
                name: "📋 Logs",
                value:
                    v.logsChannelId
                        ? `<#${v.logsChannelId}>`
                        : "❌ Sin configurar",
                inline: true
            },

            {
                name: "🛡️ Tipo",
                value:
                    TYPE_NAMES[v.type] ||
                    "❌ Sin configurar",
                inline: false
            },

            {
                name: "🎨 Panel",
                value:
                    "Mensaje, color e imagen configurables.",
                inline: false
            }
        )
        .setColor(
            parseColor(v.color)
        )
        .setFooter({
            text:
                "NR VERIFIQUE • Configuración"
        });
}

/* =====================================================
   MENÚ PRINCIPAL
===================================================== */

function createSetupMenu() {

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                "verification_setup_menu"
            )
            .setPlaceholder(
                "⚙️ Selecciona qué quieres configurar"
            )
            .addOptions(

                {
                    label:
                        "Canal de verificación",
                    description:
                        "Selecciona dónde enviar el panel.",
                    value:
                        "verification_channel",
                    emoji: "📌"
                },

                {
                    label:
                        "Rol verificado",
                    description:
                        "Selecciona el rol que recibirá el usuario.",
                    value:
                        "verification_role",
                    emoji: "👤"
                },

                {
                    label:
                        "Canal de logs",
                    description:
                        "Selecciona dónde enviar los registros.",
                    value:
                        "verification_logs",
                    emoji: "📋"
                },

                {
                    label:
                        "Tipo de verificación",
                    description:
                        "Código, CAPTCHA, puzle o cuestionario.",
                    value:
                        "verification_type",
                    emoji: "🛡️"
                },

                {
                    label:
                        "Personalizar panel",
                    description:
                        "Mensaje, color e imagen.",
                    value:
                        "verification_panel",
                    emoji: "🎨"
                },

                {
                    label:
                        "Enviar panel",
                    description:
                        "Envía el panel al canal configurado.",
                    value:
                        "verification_send",
                    emoji: "📨"
                }
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =====================================================
   SELECTOR CANAL
===================================================== */

function createChannelSelector(customId) {

    const menu =
        new ChannelSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(
                "📌 Selecciona un canal"
            )
            .setChannelTypes(
                ChannelType.GuildText
            )
            .setMinValues(1)
            .setMaxValues(1);

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =====================================================
   SELECTOR ROL
===================================================== */

function createRoleSelector() {

    const menu =
        new RoleSelectMenuBuilder()
            .setCustomId(
                "select_verification_role"
            )
            .setPlaceholder(
                "👤 Selecciona el rol verificado"
            )
            .setMinValues(1)
            .setMaxValues(1);

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =====================================================
   SELECTOR TIPO
===================================================== */

function createVerificationTypeMenu() {

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                "verification_type_menu"
            )
            .setPlaceholder(
                "🛡️ Selecciona el tipo"
            )
            .addOptions(

                {
                    label:
                        "Código MD",
                    description:
                        "Introducir un código generado.",
                    value:
                        "code",
                    emoji: "🔢"
                },

                {
                    label:
                        "CAPTCHA",
                    description:
                        "Resolver una operación.",
                    value:
                        "captcha",
                    emoji: "🤖"
                },

                {
                    label:
                        "Puzle",
                    description:
                        "Resolver un pequeño puzle.",
                    value:
                        "puzzle",
                    emoji: "🧩"
                },

                {
                    label:
                        "Cuestionario",
                    description:
                        "Responder correctamente una pregunta.",
                    value:
                        "quiz",
                    emoji: "📋"
                }
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =====================================================
   MODAL PANEL
===================================================== */

function createPanelModal(config) {

    const v =
        config.verification;

    const modal =
        new ModalBuilder()
            .setCustomId(
                "verification_panel_modal"
            )
            .setTitle(
                "🎨 Personalizar panel"
            );

    const message =
        new TextInputBuilder()
            .setCustomId(
                "panel_message"
            )
            .setLabel(
                "Mensaje"
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setValue(
                v.message ||
                "🛡️ Pulsa el botón para comenzar tu verificación."
            )
            .setMaxLength(2000);

    const color =
        new TextInputBuilder()
            .setCustomId(
                "panel_color"
            )
            .setLabel(
                "Color HEX"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(false)
            .setValue(
                v.color || "#5865F2"
            )
            .setMaxLength(7);

    const image =
        new TextInputBuilder()
            .setCustomId(
                "panel_image"
            )
            .setLabel(
                "URL imagen"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(false)
            .setValue(
                v.image || ""
            )
            .setMaxLength(500);

    modal.addComponents(

        new ActionRowBuilder()
            .addComponents(message),

        new ActionRowBuilder()
            .addComponents(color),

        new ActionRowBuilder()
            .addComponents(image)

    );

    return modal;
}

/* =====================================================
   PANEL VERIFICACIÓN
===================================================== */

function createVerificationPanel(config) {

    const v =
        config.verification;

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🛡️ NR VERIFIQUE"
            )
            .setDescription(
                v.message ||
                "🛡️ Pulsa el botón para comenzar."
            )
            .setColor(
                parseColor(v.color)
            )
            .setFooter({
                text:
                    "NR VERIFIQUE • Sistema de verificación"
            });

    if (v.image) {
        embed.setImage(v.image);
    }

    const button =
        new ButtonBuilder()
            .setCustomId(
                "start_verification"
            )
            .setLabel(
                "Verificarse"
            )
            .setEmoji("🛡️")
            .setStyle(
                ButtonStyle.Success
            );

    return {
        embeds: [embed],
        components: [
            new ActionRowBuilder()
                .addComponents(button)
        ]
    };
}

/* =====================================================
   GENERAR CÓDIGO
===================================================== */

function generateCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code += chars[
            Math.floor(
                Math.random() *
                chars.length
            )
        ];
    }

    return code;
}

/* =====================================================
   CAPTCHA
===================================================== */

function generateCaptcha() {

    const a =
        Math.floor(
            Math.random() * 20
        ) + 1;

    const b =
        Math.floor(
            Math.random() * 20
        ) + 1;

    return {
        question:
            `🤖 **CAPTCHA**\n\n¿Cuánto es **${a} + ${b}**?`,
        answer:
            String(a + b)
    };
}

/* =====================================================
   PUZLE
===================================================== */

function generatePuzzle() {

    const a =
        Math.floor(
            Math.random() * 9
        ) + 1;

    const b =
        Math.floor(
            Math.random() * 9
        ) + 1;

    const correct =
        a + b;

    let wrong1 =
        correct + 1;

    let wrong2 =
        correct - 1;

    if (wrong2 < 1) {
        wrong2 = correct + 2;
    }

    const answers = [
        correct,
        wrong1,
        wrong2
    ].sort(
        () => Math.random() - 0.5
    );

    return {
        question:
            `🧩 **PUZLE**\n\n¿Cuánto es **${a} + ${b}**?`,
        answer:
            String(correct),
        answers
    };
}

/* =====================================================
   CUESTIONARIO
===================================================== */

function generateQuiz() {

    const questions = [

        {
            question:
                "📋 ¿Qué debes hacer para completar la verificación?",
            correct:
                "Pulsar Verificarse y completar la prueba."
        },

        {
            question:
                "📋 ¿Qué botón debes pulsar para comenzar?",
            correct:
                "Verificarse"
        },

        {
            question:
                "📋 ¿Para qué sirve la verificación?",
            correct:
                "Confirmar que eres un usuario real."
        },

        {
            question:
                "📋 ¿Qué debes hacer si fallas la prueba?",
            correct:
                "Intentarlo nuevamente."
        }

    ];

    const selected =
        questions[
            Math.floor(
                Math.random() * questions.length
            )
        ];

    return {
        question: selected.question,
        answer: selected.correct
    };
}

/* =====================================================
   CLIENT READY
===================================================== */

const startTime = Date.now();

client.once(Events.ClientReady, async () => {

    console.log(
        `✅ Bot conectado como ${client.user.tag}`
    );

    await registerCommands();

});

/* =====================================================
   INTERACCIONES
===================================================== */

client.on(
    Events.InteractionCreate,
    async interaction => {

        try {

            /* ================= COMANDOS ================= */

            if (interaction.isChatInputCommand()) {

                if (interaction.commandName === "ping") {

                    return interaction.reply({
                        content:
                            `🏓 Pong: ${client.ws.ping}ms`,
                        ephemeral: true
                    });

                }

                if (interaction.commandName === "uptime") {

                    const seconds =
                        Math.floor(
                            (Date.now() - startTime) / 1000
                        );

                    return interaction.reply({
                        content:
                            `⏱️ Uptime: ${seconds} segundos.`,
                        ephemeral: true
                    });

                }

                if (interaction.commandName === "info") {

                    return interaction.reply({
                        content:
                            "🛡️ **NR VERIFIQUE**\n\n" +
                            "Sistema de verificación para Discord.",
                        ephemeral: true
                    });

                }

                if (interaction.commandName === "help") {

                    return interaction.reply({
                        content:
                            "🛡️ **NR VERIFIQUE — AYUDA**\n\n" +
                            "`/setup verificacion` — Configurar el sistema.\n" +
                            "`/verificar` — Abrir la verificación.\n" +
                            "`/ping` — Ver latencia.\n" +
                            "`/uptime` — Ver tiempo activo.\n" +
                            "`/info` — Información del bot.",
                        ephemeral: true
                    });

                }

                if (
                    interaction.commandName === "setup" &&
                    interaction.options.getSubcommand() ===
                    "verificacion"
                ) {

                    if (
                        !interaction.memberPermissions?.has(
                            PermissionFlagsBits.Administrator
                        )
                    ) {
                        return interaction.reply({
                            content:
                                "❌ Necesitas permisos de administrador.",
                            ephemeral: true
                        });
                    }

                    return interaction.reply({
                        embeds: [
                            setupEmbed(interaction.guild)
                        ],
                        components: [
                            setupMenu()
                        ],
                        ephemeral: true
                    });

                }

                if (
                    interaction.commandName === "verificar"
                ) {

                    const config =
                        getConfig(interaction.guild.id);

                    return interaction.reply({
                        ...createVerificationPanel(config),
                        ephemeral: true
                    });

                }

            }

            /* ================= MENÚ SETUP ================= */

            if (
                interaction.isStringSelectMenu() &&
                interaction.customId === "setup_menu"
            ) {

                const value =
                    interaction.values[0];

                if (value === "channel") {

                    return interaction.update({
                        content:
                            "📌 Selecciona el canal de verificación:",
                        embeds: [],
                        components: [
                            channelMenu(
                                "select_channel"
                            )
                        ]
                    });

                }

                if (value === "logs") {

                    return interaction.update({
                        content:
                            "📋 Selecciona el canal de logs:",
                        embeds: [],
                        components: [
                            channelMenu(
                                "select_logs"
                            )
                        ]
                    });

                }

                if (value === "role") {

                    return interaction.update({
                        content:
                            "👤 Selecciona el rol verificado:",
                        embeds: [],
                        components: [
                            roleMenu()
                        ]
                    });

                }

                if (value === "type") {

                    return interaction.update({
                        content:
                            "🛡️ Selecciona el tipo de verificación:",
                        embeds: [],
                        components: [
                            typeMenu()
                        ]
                    });

                }

                if (value === "panel") {

                    const config =
                        getConfig(
                            interaction.guild.id
                        );

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                "verification_panel_modal"
                            )
                            .setTitle(
                                "🎨 Personalizar panel"
                            );

                    const message =
                        new TextInputBuilder()
                            .setCustomId(
                                "panel_message"
                            )
                            .setLabel(
                                "Mensaje"
                            )
                            .setStyle(
                                TextInputStyle.Paragraph
                            )
                            .setRequired(true)
                            .setValue(
                                config.verification.message ||
                                "🛡️ Pulsa el botón para comenzar la verificación."
                            );

                    const panelColor =
                        new TextInputBuilder()
                            .setCustomId(
                                "panel_color"
                            )
                            .setLabel(
                                "Color HEX"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(false)
                            .setValue(
                                config.verification.color ||
                                "#5865F2"
                            );

                    const image =
                        new TextInputBuilder()
                            .setCustomId(
                                "panel_image"
                            )
                            .setLabel(
                                "URL imagen"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(false)
                            .setValue(
                                config.verification.image ||
                                ""
                            );

                    modal.addComponents(
                        new ActionRowBuilder()
                            .addComponents(message),

                        new ActionRowBuilder()
                            .addComponents(panelColor),

                        new ActionRowBuilder()
                            .addComponents(image)
                    );

                    return interaction.showModal(modal);

                }

                if (value === "send") {

                    const config =
                        getConfig(
                            interaction.guild.id
                        );

                    const channelId =
                        config.verification.channelId;

                    if (!channelId) {

                        return interaction.reply({
                            content:
                                "❌ Primero configura el canal de verificación.",
                            ephemeral: true
                        });

                    }

                    const channel =
                        interaction.guild.channels.cache.get(
                            channelId
                        );

                    if (!channel) {

                        return interaction.reply({
                            content:
                                "❌ No encuentro el canal configurado.",
                            ephemeral: true
                        });

                    }

                    await channel.send(
                        createVerificationPanel(config)
                    );

                    updateConfig(
                        interaction.guild.id,
                        {
                            verification: {
                                enabled: true
                            }
                        }
                    );

                    return interaction.reply({
                        content:
                            `✅ Panel enviado en <#${channelId}>.`,
                        ephemeral: true
                    });

                }

            }

            /* ================= SELECTOR CANAL ================= */

            if (
                interaction.isChannelSelectMenu()
            ) {

                if (
                    interaction.customId ===
                    "select_channel"
                ) {

                    updateConfig(
                        interaction.guild.id,
                        {
                            verification: {
                                channelId:
                                    interaction.values[0]
                            }
                        }
                    );

                    return interaction.update({
                        content:
                            "✅ Canal de verificación guardado.",
                        embeds: [],
                        components: [
                            setupMenu()
                        ]
                    });

                }

                if (
                    interaction.customId ===
                    "select_logs"
                ) {

                    updateConfig(
                        interaction.guild.id,
                        {
                            verification: {
                                logsChannelId:
                                    interaction.values[0]
                            }
                        }
                    );

                    return interaction.update({
                        content:
                            "✅ Canal de logs guardado.",
                        embeds: [],
                        components: [
                            setupMenu()
                        ]
                    });

                }

            }

            /* ================= SELECTOR ROL ================= */

            if (
                interaction.isRoleSelectMenu() &&
                interaction.customId === "select_role"
            ) {

                updateConfig(
                    interaction.guild.id,
                    {
                        verification: {
                            roleId:
                                interaction.values[0]
                        }
                    }
                );

                return interaction.update({
                    content:
                        "✅ Rol de verificación guardado.",
                    embeds: [],
                    components: [
                        setupMenu()
                    ]
                });

            }

            /* ================= SELECTOR TIPO ================= */

            if (
                interaction.isStringSelectMenu() &&
                interaction.customId === "select_type"
            ) {

                updateConfig(
                    interaction.guild.id,
                    {
                        verification: {
                            type:
                                interaction.values[0]
                        }
                    }
                );

                return interaction.update({
                    content:
                        `✅ Tipo seleccionado: ${
                            interaction.values[0]
                        }`,
                    embeds: [],
                    components: [
                        setupMenu()
                    ]
                });

            }

            /* ================= MODAL PANEL ================= */

            if (
                interaction.isModalSubmit() &&
                interaction.customId ===
                "verification_panel_modal"
            ) {

                const message =
                    interaction.fields.getTextInputValue(
                        "panel_message"
                    );

                const panelColor =
                    interaction.fields.getTextInputValue(
                        "panel_color"
                    ).trim();

                const image =
                    interaction.fields.getTextInputValue(
                        "panel_image"
                    ).trim();

                if (
                    panelColor &&
                    !/^#[0-9a-fA-F]{6}$/.test(panelColor)
                ) {

                    return interaction.reply({
                        content:
                            "❌ El color debe tener formato `#5865F2`.",
                        ephemeral: true
                    });

                }

                updateConfig(
                    interaction.guild.id,
                    {
                        verification: {
                            message,
                            color:
                                panelColor ||
                                "#5865F2",
                            image:
                                image || null
                        }
                    }
                );

                return interaction.reply({
                    content:
                        "✅ Panel personalizado correctamente.",
                    ephemeral: true
                });

            }

            /* ================= BOTÓN VERIFICARSE ================= */

            if (
                interaction.isButton() &&
                interaction.customId ===
                "start_verification"
            ) {

                const config =
                    getConfig(
                        interaction.guild.id
                    );

                const type =
                    config.verification.type;

                if (type === "code") {

                    const code =
                        generateCode();

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                `verify_code_${enc(code)}`
                            )
                            .setTitle(
                                "🔢 Verificación"
                            );

                    const input =
                        new TextInputBuilder()
                            .setCustomId(
                                "verification_code"
                            )
                            .setLabel(
                                `Escribe el código: ${code}`
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setRequired(true)
                            .setMaxLength(6);

                    modal.addComponents(
                        new ActionRowBuilder()
                            .addComponents(input)
                    );

                    return interaction.showModal(
                        modal
                    );

                }

                if (type === "captcha") {

                    const captcha =
                        generateCaptcha();

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                `verify_captcha_${enc(
                                    captcha.answer
                                )}`
                            )
                            .setTitle(
                                "🤖 CAPTCHA"
                            );

                    const input =
                        new TextInputBuilder()
                            .setCustomId(
                                "captcha_answer"
                            )
                            .setLabel(
                                "Respuesta"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setPlaceholder(
                                captcha.question
                            )
                            .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder()
                            .addComponents(input)
                    );

                    return interaction.showModal(
                        modal
                    );

                }

                if (type === "puzzle") {

                    const puzzle =
                        generatePuzzle();

                    const row =
                        new ActionRowBuilder();

                                        puzzle.answers.forEach(
                        ans => {

                            row.addComponents(
                                new ButtonBuilder()
                                    .setCustomId(
                                        `puzzle_${enc(
                                            String(ans)
                                        )}_${enc(
                                            String(puzzle.answer)
                                        )}`
                                    )
                                    .setLabel(
                                        String(ans)
                                    )
                                    .setStyle(
                                        ButtonStyle.Primary
                                    )
                            );

                        }
                    );

                    return interaction.reply({
                        content:
                            puzzle.question,
                        components: [
                            row
                        ],
                        ephemeral: true
                    });

                }

                if (type === "quiz") {

                    const quiz =
                        generateQuiz();

                    const modal =
                        new ModalBuilder()
                            .setCustomId(
                                `verify_quiz_${enc(
                                    quiz.answer
                                )}`
                            )
                            .setTitle(
                                "📋 Cuestionario"
                            );

                    const input =
                        new TextInputBuilder()
                            .setCustomId(
                                "quiz_answer"
                            )
                            .setLabel(
                                "Respuesta"
                            )
                            .setStyle(
                                TextInputStyle.Short
                            )
                            .setPlaceholder(
                                quiz.question
                            )
                            .setRequired(true);

                    modal.addComponents(
                        new ActionRowBuilder()
                            .addComponents(input)
                    );

                    return interaction.showModal(
                        modal
                    );
                }

            }

            /* =================
               RESPUESTAS DE MODALES
            ================= */

            if (
                interaction.isModalSubmit() &&
                interaction.customId.startsWith(
                    "verify_code_"
                )
            ) {

                const expected =
                    dec(
                        interaction.customId
                            .replace(
                                "verify_code_",
                                ""
                            )
                    );

                const answer =
                    interaction.fields
                        .getTextInputValue(
                            "verification_code"
                        )
                        .trim();

                if (
                    answer.toUpperCase() !==
                    expected.toUpperCase()
                ) {

                    return interaction.reply({
                        content:
                            "❌ Código incorrecto.",
                        ephemeral: true
                    });

                }

                return completeVerification(
                    interaction
                );
            }

            if (
                interaction.isModalSubmit() &&
                interaction.customId.startsWith(
                    "verify_captcha_"
                )
            ) {

                const expected =
                    dec(
                        interaction.customId
                            .replace(
                                "verify_captcha_",
                                ""
                            )
                    );

                const answer =
                    interaction.fields
                        .getTextInputValue(
                            "captcha_answer"
                        )
                        .trim();

                if (answer !== expected) {

                    return interaction.reply({
                        content:
                            "❌ CAPTCHA incorrecto.",
                        ephemeral: true
                    });

                }

                return completeVerification(
                    interaction
                );
            }

            if (
                interaction.isModalSubmit() &&
                interaction.customId.startsWith(
                    "verify_quiz_"
                )
            ) {

                const expected =
                    dec(
                        interaction.customId
                            .replace(
                                "verify_quiz_",
                                ""
                            )
                    );

                const answer =
                    interaction.fields
                        .getTextInputValue(
                            "quiz_answer"
                        )
                        .trim();

                if (
                    answer.toLowerCase() !==
                    expected.toLowerCase()
                ) {

                    return interaction.reply({
                        content:
                            "❌ Respuesta incorrecta.",
                        ephemeral: true
                    });

                }

                return completeVerification(
                    interaction
                );
            }

            /* =================
               RESPUESTA DEL PUZLE
            ================= */

            if (
                interaction.isButton() &&
                interaction.customId.startsWith(
                    "puzzle_"
                )
            ) {

                const parts =
                    interaction.customId
                        .split("_");

                const selected =
                    dec(parts[1]);

                const expected =
                    dec(
                        parts.slice(2).join("_")
                    );

                if (selected !== expected) {

                    return interaction.reply({
                        content:
                            "❌ Respuesta incorrecta.",
                        ephemeral: true
                    });

                }

                return completeVerification(
                    interaction
                );
            }

/* =========================
   FIN DE INTERACCIONES
========================= */

        } catch (error) {

            console.error(
                "❌ Error en interacción:",
                error
            );

            if (!interaction.replied) {

                await interaction.reply({
                    content:
                        "❌ Ocurrió un error. Inténtalo nuevamente.",
                    ephemeral: true
                });
            }
        }
    }
);

/* =====================================================
   COMPLETAR VERIFICACIÓN
===================================================== */

async function completeVerification(
    interaction
) {

    const config =
        getConfig(
            interaction.guild.id
        );

    const roleId =
        config.verification.roleId;

    if (!roleId) {

        return interaction.reply({
            content:
                "❌ No hay un rol de verificación configurado.",
            ephemeral: true
        });
    }

    try {

        const member =
            await interaction.guild.members.fetch(
                interaction.user.id
            );

        await member.roles.add(
            roleId
        );

        if (
            config.verification.logsChannelId
        ) {

            const logs =
                interaction.guild.channels.cache.get(
                    config.verification.logsChannelId
                );

            if (logs) {

                await logs.send({
                    content:
                        `🛡️ **Verificación completada**\n` +
                        `Usuario: ${interaction.user}\n` +
                        `Rol: <@&${roleId}>`
                });
            }
        }

        return interaction.reply({
            content:
                "✅ ¡Verificación completada correctamente!",
            ephemeral: true
        });

    } catch (error) {

        console.error(
            "❌ Error asignando rol:",
            error
        );

        return interaction.reply({
            content:
                "❌ No pude asignarte el rol. " +
                "Comprueba que mi rol esté por encima del rol de verificación.",
            ephemeral: true
        });
    }
}

/* =====================================================
   BOT LISTO
===================================================== */

client.once(
    Events.ClientReady,
    async readyClient => {

        console.log(
            `🤖 ${readyClient.user.tag} está conectado.`
        );

        await registerCommands();
    }
);

/* =====================================================
   ERRORES
===================================================== */

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

/* =====================================================
   LOGIN
===================================================== */

client.login(TOKEN);
