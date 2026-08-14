const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const database =
    require("../database/database");

module.exports = async guild => {

    console.log(
        `➕ Nuevo servidor: ${guild.name}`
    );

    /* =====================================
       💾 CREAR CONFIGURACIÓN
    ===================================== */

    database.createGuild(
        guild.id
    );

    /* =====================================
       👑 OBTENER PROPIETARIO
    ===================================== */

    const owner =
        await guild.fetchOwner()
            .catch(() => null);

    if (!owner) return;

    /* =====================================
       🌎 MENÚ DE IDIOMAS
    ===================================== */

    const menu =
        new StringSelectMenuBuilder()
            .setCustomId(
                "select_language"
            )
            .setPlaceholder(
                "🌎 Selecciona un idioma"
            )
            .addOptions(

                {
                    label: "Español",
                    value: "es",
                    emoji: "🇪🇸"
                },

                {
                    label: "English",
                    value: "en",
                    emoji: "🇺🇸"
                },

                {
                    label: "Português",
                    value: "pt",
                    emoji: "🇧🇷"
                },

                {
                    label: "Français",
                    value: "fr",
                    emoji: "🇫🇷"
                },

                {
                    label: "Deutsch",
                    value: "de",
                    emoji: "🇩🇪"
                },

                {
                    label: "Italiano",
                    value: "it",
                    emoji: "🇮🇹"
                }

            );

    const row =
        new ActionRowBuilder()
            .addComponents(menu);

    /* =====================================
       🛡️ PANEL INICIAL
    ===================================== */

    const embed =
        new EmbedBuilder()

            .setTitle(
                "🛡️ NR VERIFIQUE"
            )

            .setDescription(
                "## 🌎 Configuración inicial\n\n" +

                "¡Gracias por añadir **NR VERIFIQUE**!\n\n" +

                "Antes de comenzar debes seleccionar " +
                "el idioma que utilizará el bot en este servidor.\n\n" +

                "### 🌐 Idiomas disponibles\n" +

                "🇪🇸 Español\n" +
                "🇺🇸 English\n" +
                "🇧🇷 Português\n" +
                "🇫🇷 Français\n" +
                "🇩🇪 Deutsch\n" +
                "🇮🇹 Italiano\n\n" +

                "👇 **Selecciona tu idioma en el menú.**"
            )

            .setColor(0x5865F2)

            .setFooter({
                text:
                    "NR VERIFIQUE • Configuración inicial"
            })

            .setTimestamp();

    /* =====================================
       📩 ENVIAR AL OWNER
    ===================================== */

    try {

        await owner.send({

            embeds: [
                embed
            ],

            components: [
                row
            ]

        });

        console.log(
            `📩 Configuración enviada a ${owner.user.tag}`
        );

    } catch {

        console.log(
            "⚠️ No se pudo enviar DM al propietario."
        );

        /* ================================
           📢 INTENTAR CANAL DEL SISTEMA
        ================================= */

        if (guild.systemChannel) {

            await guild.systemChannel.send({

                embeds: [
                    embed
                ],

                components: [
                    row
                ]

            }).catch(() => {});

        }

    }

};
