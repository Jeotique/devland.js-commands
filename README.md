# DEVLAND.JS COMMANDS FRAMEWORK

```bash
npm install devland.js-commands
npm install devland.js@latest
```

**Index file :**
```js
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
```

**Command file example 1 :**
```js
const {Command} = require('devland.js-commands')

module.exports = new Command({
    name: "addrole",
    aliases: "add_role",
    description: "Add a role to a user",
    arguments: [{
        name: "member",
        type: "member",
        invalidResponse: "Invalid member",
        missingResponse: "No member given",
        required: true
    }, {
        name: "role",
        type: "role",
        invalidResponse: "Invalid role",
        missingResponse: "No role given",
        required: true
    }],
    run: async(client, message, member, role) => {
        member.addRoles(role).then(() => {
            message.reply(`Role ${role.name} added to ${member}`)
        }).catch(e=>{
            message.reply(`I can't add the role ${role.name}`)
        })
    }
})
```

**Command file example 2 :**
```js
const {Command} = require('devland.js-commands')

module.exports = new Command({
    name: "ping",
    aliases: "speed",
    description: "Get bot speed",
    run: async(client, message) => {
        return message.reply("ping")
    }
})
```
