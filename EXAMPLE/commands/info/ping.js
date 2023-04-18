const {Command} = require('devland.js-commands')

module.exports = new Command({
    name: "ping",
    aliases: "speed",
    description: "Get bot speed",
    run: async(client, message) => {
        return message.reply("ping")
    }
})