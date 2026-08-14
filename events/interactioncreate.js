const {
    EmbedBuilder
} = require("discord.js");

const database =
    require("../database/database");

const languages = {

    es: require("../languages/es.json"),
    en: require("../languages/en.json"),
    pt: require("../languages/pt.json"),
    fr: require("../languages/fr.json"),
    de: require("../languages/de.json"),
    it: require("../languages/it.json")

};

module.exports = async interaction => {

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

        /* ================================
           💾 GUARDAR IDIOMA
        ================================= */

        database.setLanguage(
            interaction.guild.id,
            selected
        );

        /* ================================
           ✅ CONFIRMACIÓN
        ================================= */

        const embed =
            new EmbedBuilder()

                .setTitle(
                    `${language.flag} ${language.welcome}`
                )

                .setDescription(

                    `✅ **${language.language_configured}**\n\n` +

                    `🌎 **${language.name}**\n\n` +

                    "Ahora puedes comenzar a configurar " +
                    "el sistema de NR VERIFIQUE."

                )

                .setColor(0x57F287)

                .setFooter({
                    text:
                        "NR VERIFIQUE"
                })

                .setTimestamp();

        return interaction.update({

            embeds: [
                embed
            ],

            components: []

        });

    }

};
