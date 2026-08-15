const {
    Client,
    GatewayIntentBits,
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
    ActivityType,
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
   WEB SERVER - RENDER
===================================================== */

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

/* =====================================================
   CLIENTE DISCORD
   SOLO GUILDS
   NO MESSAGE CONTENT
   NO GUILD MEMBERS
===================================================== */

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

/* =====================================================
   BASE DE DATOS JSON
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

function getGuildConfig(guildId) {

    const db = loadDatabase();

    if (!db[guildId]) {
        db[guildId] = {
            language: "es",
            verification: {
                enabled: false,
                channelId: null,
                roleId: null,
                logsChannelId: null,
                type: "code",
                message:
                    "🛡️ Pulsa el botón para verificarte.",
                color: "#5865F2",
                image: null
            }
        };

        saveDatabase(db);
    }

    return db[guildId];
}

function updateGuildConfig(guildId, changes) {

    const db = loadDatabase();

    if (!db[guildId]) {
        getGuildConfig(guildId);
    }

    const fresh = loadDatabase();

    fresh[guildId] = {
        ...fresh[guildId],
        ...changes,
        verification: {
            ...fresh[guildId].verification,
            ...(changes.verification || {})
        }
    };

    saveDatabase(fresh);

    return fresh[guildId];
}

/* =====================================================
   IDIOMAS
===================================================== */

const LANGUAGES = {

    es: {
        name: "Español",
        flag: "🇪🇸",
        configured: "Idioma configurado correctamente."
    },

    en: {
        name: "English",
        flag: "🇺🇸",
        configured: "Language configured successfully."
    },

    pt: {
        name: "Português",
        flag: "🇧🇷",
        configured: "Idioma configurado com sucesso."
    },

    fr: {
        name: "Français",
        flag: "🇫🇷",
        configured: "Langue configurée avec succès."
    },

    de: {
        name: "Deutsch",
        flag: "🇩🇪",
        configured: "Sprache erfolgreich konfiguriert."
    },

    it: {
        name: "Italiano",
        flag: "🇮🇹",
        configured: "Lingua configurata correttamente."
    }

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
        .setName("ban")
        .setDescription("Banea a un usuario.")
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
        .setDescription("Expulsa a un usuario.")
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
        .setName("help")
        .setDescription("Muestra la ayuda."),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Muestra la latencia."),

    new SlashCommandBuilder()
        .setName("info")
        .setDescription("Información del bot."),

    new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Tiempo activo."),

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
   MENÚ PRINCIPAL DE SETUP
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
                        "Seleccionar dónde se enviará el panel.",
                    value:
                        "verification_channel",
                    emoji: "📌"
                },
                {
                    label:
                        "Rol verificado",
                    description:
                        "Seleccionar el rol que recibirá el usuario.",
                    value:
                        "verification_role",
                    emoji: "👤"
                },
                {
                    label:
                        "Canal de logs",
                    description:
                        "Seleccionar dónde se enviarán los logs.",
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
                        "Enviar el panel al canal configurado.",
                    value:
                        "verification_send",
                    emoji: "📨"
                }
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =====================================================
   EMBED DE CONFIGURACIÓN
===================================================== */

function createSetupEmbed(guild) {

    const config =
        getGuildConfig(guild.id);

    const v =
        config.verification;

    const typeNames = {
        code: "🔢 Código MD",
        captcha: "🤖 CAPTCHA",
        puzzle: "🧩 Puzle",
        quiz: "📋 Cuestionario"
    };

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🛡️ NR VERIFIQUE"
            )
            .setDescription(
                "## ⚙️ Configuración de verificación\n\n" +
                "Selecciona una opción en el menú inferior " +
                "para configurar tu sistema."
            )
            .addFields(
                {
                    name: "📌 Canal",
                    value:
                        v.channelId
                            ? `<#${v.channelId}>`
                            : "Por configurar",
                    inline: true
                },
                {
                    name: "👤 Rol verificado",
                    value:
                        v.roleId
                            ? `<@&${v.roleId}>`
                            : "Por configurar",
                    inline: true
                },
                {
                    name: "📋 Canal de logs",
                    value:
                        v.logsChannelId
                            ? `<#${v.logsChannelId}>`
                            : "Por configurar",
                    inline: true
                },
                {
                    name:
                        "🛡️ Tipo de verificación",
                    value:
                        typeNames[v.type] ||
                        "Por configurar",
                    inline: false
                },
                {
                    name: "🎨 Panel",
                    value:
                        "Mensaje, color e imagen personalizables.",
                    inline: false
                }
            )
            .setColor(
                parseColor(v.color)
            )
            .setFooter({
                text:
                    "NR VERIFIQUE • Panel de configuración"
            });

    return embed;
}

/* =====================================================
   COLOR
===================================================== */

function parseColor(color) {

    if (!color) {
        return 0x5865F2;
    }

    let value =
        String(color)
            .replace("#", "");

    if (!/^[0-9a-fA-F]{6}$/.test(value)) {
        return 0x5865F2;
    }

    return parseInt(value, 16);
}

/* =====================================================
   SELECTOR DE CANAL
===================================================== */

function createChannelSelector(customId) {

    const selector =
        new ChannelSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(
                "📌 Selecciona un canal"
            )
            .setChannelTypes(
                ChannelType.GuildText
            );

    return new ActionRowBuilder()
        .addComponents(selector);
}

/* =====================================================
   SELECTOR DE ROL
===================================================== */

function createRoleSelector() {

    const selector =
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
        .addComponents(selector);
}

/* =====================================================
   TIPOS DE VERIFICACIÓN
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
                    label: "Código MD",
                    description:
                        "Código generado que el usuario deberá introducir.",
                    value: "code",
                    emoji: "🔢"
                },
                {
                    label: "CAPTCHA",
                    description:
                        "Resolver una operación de seguridad.",
                    value: "captcha",
                    emoji: "🤖"
                },
                {
                    label: "Puzle",
                    description:
                        "Repetir correctamente una secuencia.",
                    value: "puzzle",
                    emoji: "🧩"
                },
                {
                    label: "Cuestionario",
                    description:
                        "Responder una pregunta de verificación.",
                    value: "quiz",
                    emoji: "📋"
                }
            );

    return new ActionRowBuilder()
        .addComponents(menu);
}

/* =====================================================
   MODAL PERSONALIZAR PANEL
===================================================== */

function createPanelModal() {

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
                "Mensaje del panel"
            )
            .setPlaceholder(
                "Escribe el mensaje que aparecerá..."
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(2000);

    const color =
        new TextInputBuilder()
            .setCustomId(
                "panel_color"
            )
            .setLabel(
                "Color HEX"
            )
            .setPlaceholder(
                "#5865F2"
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(false)
            .setMaxLength(7);

    const image =
        new TextInputBuilder()
            .setCustomId(
                "panel_image"
            )
            .setLabel(
                "URL de imagen (opcional)"
            )
            .setPlaceholder(
                "https://..."
            )
            .setStyle(
                TextInputStyle.Short
            )
            .setRequired(false)
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
   PANEL DE VERIFICACIÓN
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
                "Pulsa el botón para comenzar la verificación."
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
   CÓDIGO MD
===================================================== */

function generateCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let result = "";

    for (let i = 0; i < 6; i++) {
        result +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];
    }

    return result;
}

/* =====================================================
   CAPTCHA
===================================================== */

function generateCaptcha() {

    const a =
        Math.floor(Math.random() * 20) + 1;

    const b =
        Math.floor(Math.random() * 20) + 1;

    return {
        question:
            `¿Cuánto es **${a} + ${b}**?`,
        answer:
            String(a + b)
    };
}

/* =====================================================
   PUZLE
===================================================== */

function generatePuzzle() {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;

    const result = a + b;

    const wrong1 = result + Math.floor(Math.random() * 3) + 1;
    const wrong2 = result - Math.floor(Math.random() * 3) - 1;

    const answers = [
        result,
        wrong1,
        wrong2
    ].sort(() => Math.random() - 0.5);

    return {
        question: `🧩 **Resuelve el puzle**\n\n¿Cuánto es **${a} + ${b}**?`,
        answer: result,
        answers
    };
}


/* =====================================================
   MOSTRAR PUZLE
===================================================== */

async function showPuzzle(interaction) {

    const puzzle = generatePuzzle();

    const row = new ActionRowBuilder();

    puzzle.answers.forEach((answer, index) => {

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `puzzle_answer_${puzzle.answer}_${answer}`
                )
                .setLabel(String(answer))
                .setStyle(
                    index === 0
                        ? ButtonStyle.Primary
                        : ButtonStyle.Secondary
                )
        );

    });

    await interaction.reply({
        content: puzzle.question,
        components: [row],
        ephemeral: true
    });
}


/* =====================================================
   COMPROBAR PUZLE
===================================================== */

async function checkPuzzle(interaction) {

    const parts = interaction.customId.split("_");

    const correctAnswer = Number(parts[2]);
    const selectedAnswer = Number(parts[3]);

    if (correctAnswer !== selectedAnswer) {

        return interaction.reply({
            content:
                "❌ **Respuesta incorrecta.**\n\n" +
                "Inténtalo nuevamente.",
            ephemeral: true
        });
    }

    await completeVerification(interaction);
}


/* =====================================================
   CACHA
===================================================== */

function generateCacha() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 5; i++) {

        code += chars[
            Math.floor(
                Math.random() * chars.length
            )
        ];
    }

    return code;
}


/* =====================================================
   MOSTRAR CACHA
===================================================== */

async function showCacha(interaction) {

    const code = generateCacha();

    const fake1 = generateCacha();
    const fake2 = generateCacha();

    const answers = [
        code,
        fake1,
        fake2
    ].sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder();

    answers.forEach(answer => {

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `cacha_${code}_${answer}`
                )
                .setLabel(answer)
                .setStyle(ButtonStyle.Secondary)
        );

    });

    await interaction.reply({
        content:
            "🤖 **Cacha**\n\n" +
            "Selecciona el código correcto:\n\n" +
            `# \`${code}\``,
        components: [row],
        ephemeral: true
    });
}


/* =====================================================
   COMPROBAR CACHA
===================================================== */

async function checkCacha(interaction) {

    const parts =
        interaction.customId.split("_");

    const correctCode = parts[1];
    const selectedCode = parts[2];

    if (correctCode !== selectedCode) {

        return interaction.reply({
            content:
                "❌ **Cacha incorrecta.**\n\n" +
                "Inténtalo nuevamente.",
            ephemeral: true
        });
    }

    await completeVerification(interaction);
}


/* =====================================================
   CÓDIGO MD
===================================================== */

function generateCodeMD() {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}


/* =====================================================
   MOSTRAR CÓDIGO MD
===================================================== */

async function showCodeMD(interaction) {

    const code = generateCodeMD();

    await interaction.reply({
        content:
            "🔢 **Código MD**\n\n" +
            "Escribe el siguiente código:\n\n" +
            `# \`${code}\``,
        components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        `code_md_${code}`
                    )
                    .setLabel("Introducir código")
                    .setStyle(ButtonStyle.Primary)
            )
        ],
        ephemeral: true
    });
}


/* =====================================================
   CUESTIONARIO
===================================================== */

function generateQuestion() {

    const questions = [
        {
            question:
                "¿Está permitido hacer spam?",
            answers: [
                "Sí",
                "No",
                "Siempre",
                "Depende"
            ],
            correct: "No"
        },
        {
            question:
                "¿Debes respetar las reglas del servidor?",
            answers: [
                "Sí",
                "No",
                "Nunca",
                "Solo algunas"
            ],
            correct: "Sí"
        },
        {
            question:
                "¿Está permitido molestar a otros usuarios?",
            answers: [
                "Sí",
                "No",
                "Siempre",
                "Nunca importa"
            ],
            correct: "No"
        }
    ];

    return questions[
        Math.floor(
            Math.random() * questions.length
        )
    ];
}


/* =====================================================
   MOSTRAR CUESTIONARIO
===================================================== */

async function showQuestionnaire(interaction) {

    const question = generateQuestion();

    const row = new ActionRowBuilder();

    question.answers.forEach(answer => {

        row.addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `question_${Buffer
                        .from(question.correct)
                        .toString("base64")
                    }_${Buffer
                        .from(answer)
                        .toString("base64")
                    }`
                )
                .setLabel(answer)
                .setStyle(ButtonStyle.Secondary)
        );

    });

    await interaction.reply({
        content:
            "📋 **Cuestionario**\n\n" +
            `**${question.question}**`,
        components: [row],
        ephemeral: true
    });
}


/* =====================================================
   COMPLETAR VERIFICACIÓN
===================================================== */

async function completeVerification(interaction) {

    const guild = interaction.guild;

    if (!guild) return;

    const config =
        getGuildConfig(guild.id);

    if (!config) {

        return interaction.reply({
            content:
                "❌ La verificación no está configurada.",
            ephemeral: true
        });
    }

    if (!config.rolVerificado) {

        return interaction.reply({
            content:
                "❌ No hay un rol verificado configurado.",
            ephemeral: true
        });
    }

    const member =
        await guild.members
            .fetch(interaction.user.id)
            .catch(() => null);

    if (!member) return;

    const role =
        guild.roles.cache.get(
            config.rolVerificado
        );

    if (!role) {

        return interaction.reply({
            content:
                "❌ No se encontró el rol verificado.",
            ephemeral: true
        });
    }

    try {

        await member.roles.add(
            role,
            "Verificación completada"
        );

        await interaction.reply({
            content:
                "✅ **¡Verificación completada!**\n\n" +
                `Ahora tienes el rol ${role}.`,
            ephemeral: true
        });

        /* =================================================
           LOGS
        ================================================= */

        if (config.canalLogs) {

            const logs =
                guild.channels.cache.get(
                    config.canalLogs
                );

            if (logs) {

                const embed =
                    new EmbedBuilder()
                        .setTitle(
                            "🛡️ Usuario verificado"
                        )
                        .setDescription(
                            `${interaction.user} completó la verificación correctamente.`
                        )
                        .addFields(
                            {
                                name: "👤 Usuario",
                                value:
                                    `${interaction.user.tag}`,
                                inline: true
                            },
                            {
                                name: "🆔 ID",
                                value:
                                    interaction.user.id,
                                inline: true
                            },
                            {
                                name: "🎭 Rol",
                                value:
                                    `${role}`,
                                inline: true
                            }
                        )
                        .setTimestamp();

                await logs.send({
                    embeds: [embed]
                }).catch(() => {});
            }
        }

    } catch (error) {

        console.error(
            "❌ Error dando el rol:",
            error
        );

        if (!interaction.replied) {

            await interaction.reply({
                content:
                    "❌ No pude asignarte el rol. " +
                    "Revisa la posición de mi rol en Discord.",
                ephemeral: true
            }).catch(() => {});
        }
    }
}


/* =====================================================
   BOTONES DE VERIFICACIÓN
===================================================== */

client.on(
    Events.InteractionCreate,
    async interaction => {

        if (!interaction.isButton())
            return;

        try {

            const id =
                interaction.customId;


            /* =============================================
               BOTÓN PRINCIPAL DE VERIFICACIÓN
            ============================================= */

            if (id === "verificar") {

                const config =
                    getGuildConfig(
                        interaction.guild.id
                    );

                if (!config) {

                    return interaction.reply({
                        content:
                            "❌ La verificación no está configurada.",
                        ephemeral: true
                    });
                }

                const type =
                    config.tipoVerificacion ||
                    "puzle";


                if (type === "puzle") {

                    return showPuzzle(
                        interaction
                    );
                }


                if (type === "captcha") {

                    return showCacha(
                        interaction
                    );
                }


                if (type === "codigo") {

                    return showCodeMD(
                        interaction
                    );
                }


                if (type === "cuestionario") {

                    return showQuestionnaire(
                        interaction
                    );
                }
            }


            /* =============================================
               PUZLE
            ============================================= */

            if (
                id.startsWith(
                    "puzzle_answer_"
                )
            ) {

                return checkPuzzle(
                    interaction
                );
            }


            /* =============================================
               CACHA
            ============================================= */

            if (
                id.startsWith("cacha_")
            ) {

                return checkCacha(
                    interaction
                );
            }


            /* =============================================
               CÓDIGO MD
            ============================================= */

            if (
                id.startsWith("code_md_")
            ) {

                return interaction.reply({
                    content:
                        "🔢 Introduce el código usando el sistema configurado.",
                    ephemeral: true
                });
            }


            /* =============================================
               CUESTIONARIO
            ============================================= */

            if (
                id.startsWith("question_")
            ) {

                const parts =
                    id.split("_");

                const correct =
                    Buffer.from(
                        parts[1],
                        "base64"
                    ).toString();

                const selected =
                    Buffer.from(
                        parts[2],
                        "base64"
                    ).toString();

                if (
                    correct !== selected
                ) {

                    return interaction.reply({
                        content:
                            "❌ **Respuesta incorrecta.**\n\n" +
                            "Inténtalo nuevamente.",
                        ephemeral: true
                    });
                }

                return completeVerification(
                    interaction
                );
            }

        } catch (error) {

            console.error(
                "❌ Error en verificación:",
                error
            );

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({
                    content:
                        "❌ Ocurrió un error durante la verificación.",
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }
);

/* =====================================================
   ERRORES GLOBALES
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
   SERVIDOR WEB PARA RENDER
===================================================== */

const http = require("http");

const PORT =
    process.env.PORT || 10000;

http.createServer(
    (req, res) => {

        res.writeHead(
            200,
            {
                "Content-Type":
                    "text/plain; charset=utf-8"
            }
        );

        res.end(
            "🛡️ NR VERIFIQUE está funcionando correctamente."
        );

    }
).listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Puerto activo: ${PORT}`
        );

    }
);


/* =====================================================
   FINAL
===================================================== */

console.log(
    "✅ Sistema de verificación cargado."
);

/* =====================================================
   INICIAR BOT
===================================================== */

client.once(Events.ClientReady, async readyClient => {

    console.log(
        `✅ NR VERIFIQUE conectado como ${readyClient.user.tag}`
    );

    // Estado DND
    readyClient.user.setPresence({
        status: "dnd",
        activities: [
            {
                name: "🛡️ Más de 10 bots en funcionamiento",
                type: ActivityType.Watching
            }
        ]
    });

    console.log("🔴 Estado DND activado.");

});


/* =====================================================
   MANEJO DE ERRORES DEL CLIENT
===================================================== */

client.on(
    Events.Error,
    error => {

        console.error(
            "❌ Error de Discord:",
            error
        );

    }
);


/* =====================================================
   UNHANDLED REJECTION
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


/* =====================================================
   UNCAUGHT EXCEPTION
===================================================== */

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
   SERVIDOR WEB PARA RENDER
===================================================== */

const http = require("http");

const PORT =
    process.env.PORT || 10000;

http.createServer(
    (req, res) => {

        res.writeHead(
            200,
            {
                "Content-Type":
                    "text/plain; charset=utf-8"
            }
        );

        res.end(
            "🛡️ NR VERIFIQUE está funcionando correctamente."
        );

    }
).listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🌐 Puerto activo: ${PORT}`
        );

    }
);


/* =====================================================
   LOGIN
===================================================== */

console.log(
    "🔄 Iniciando sesión en Discord..."
);

client.login(config.token)
    .then(() => {

        console.log(
            "✅ Login realizado correctamente."
        );

    })
    .catch(error => {

        console.error(
            "❌ No se pudo iniciar sesión en Discord:",
            error
        );

        process.exit(1);

    });
