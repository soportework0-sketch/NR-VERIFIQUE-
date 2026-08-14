const {
    ActivityType
} = require("discord.js");

module.exports = client => {

    console.log("=================================");
    console.log("🛡️ NR VERIFIQUE");
    console.log("=================================");

    console.log(
        `🤖 Bot: ${client.user.tag}`
    );

    console.log(
        `🌐 Servidores: ${client.guilds.cache.size}`
    );

    console.log(
        `📡 Ping: ${client.ws.ping}ms`
    );

    console.log("=================================");

    /* =====================================
       🔴 ESTADO DND
    ===================================== */

    client.user.setPresence({

        status: "dnd",

        activities: [
            {
                name: "⚙️ +10 bots en funcionamiento",
                type: ActivityType.Watching
            }
        ]

    });

};
