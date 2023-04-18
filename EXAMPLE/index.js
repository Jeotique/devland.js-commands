const Discord = require('devland.js')
const {Manager} = require('devland.js-commands')
const client = new Discord.Client({
    intents: [Discord.IntentFlags.ALL],
    guildsLifeTime: 7200000,
    membersLifeTime: 7200000,
    channelsLifeTime: 7200000,
    rolesLifeTime: 7200000,
    usersLifeTime: 7200000,
})
client.connect('YOUR TOKEN BOT')
new Manager({client: client, path: "./commands"})
client.on('ready', () => {
    console.log(`${client.user.tag} connected`)
})