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

**All command options available :**
```js
/**
     * @typedef {object} Command_Options_Arguments
     * @property {string} name The name of the variable
     * @property {'normal'|'role'|'channel'|'member'|'user'|'string'|'boolean'|'number'} [type="normal"] The type of the variable (normal = string | undefined = normal)
     * @property {Array} somethingIn If the type is 'normal' or 'string' you can use this to create invalid response if the array doesn't include the argument
     * @property {boolean} [long=false] The variable is a long type of not, work only with 'normal' type
     * @property {boolean} [required=false] The variable is required or not
     * @property {boolean} [invalidReply=false] The bot mention the user or not when he answer for a invalid argument
     * @property {string} [invalidResponse="The argument is invalid"] What the bot answer if the variable type if invalid
     * @property {boolean} [missingReply=false] The bot mention the user or not when he answer for a missing argument
     * @property {string} [missingResponse="The argument is missing"] What the bot answer if the variable if missing, work only if required is enabled
     * @property {string} [boolean_true="on"] What mean true when type is boolean
     * @property {string} [boolean_false="off"] What mean false when type is boolean
     * @property {number} [min_number=0] The minimum when type is number
     * @property {number} [max_number=Infinity] The maximum when type is number
     */
    /**
     * @typedef {object} Command_Options
     * @property {string} name The name of the command
     * @property {Array<String>} aliases The aliases of the command (other names)
     * @property {string} description The description of the command
     * @property {boolean} startTyping The bot will be marked like typing in the channel, this will overwrite the manager propertie startTyping
     * @property {Array<Command_Options_Arguments>} arguments The command arguments
     * @property {Array<string>|string} permissions The permissions needed to execute the command
     * @property {string} noPermissionReply What the bot answer to a user without the required permission
     * @property {number} cooldown The cooldown of the command
     * @property {boolean} cooldownIsGeneral The cooldown is for everyone
     * @property {string} cooldownMessage The cooldown message
     * @property {Function} run The function that will be executed
     * @property {Discord.Client?} client The devland client used with the manager
     */
    /**
     *
     * @param {Command_Options} options
     */
```
