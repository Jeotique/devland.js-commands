const Discord = require('devland.js')
const { Collection } = require('mxtorie-utils')
const fs = require('fs')
const commandClass = require('./command')
module.exports = class Manager {
    /**
     * @typedef {object} ManagerOptions
     * @property {Discord.Client} client
     * @property {string} defaultPrefix
     * @property {string} path
     * @property {boolean} startTyping
     */
    /**
     *
     * @param {ManagerOptions} options
     */
    constructor(options) {
        if (typeof options !== "object") throw new TypeError("Options must be defined by a object")
        if (!(options.client instanceof Discord.Client)) throw new TypeError("A valid client must be provided")
        if (typeof options.defaultPrefix !== "string") options.defaultPrefix = "+"
        if (typeof options.path !== "undefined" && typeof options.path !== "string") throw new TypeError("The commands folder path must be provided as a string")
        if (typeof options.path !== "undefined" && !fs.existsSync(options.path)) throw new TypeError("Can't even find the commands folder")
        this.clientIntents = new Discord.IntentFlags(typeof options.client.options.intents === "number" ? BigInt(options.client.options.intents) : options.client.options.intents)
        if (!this.clientIntents.has("MESSAGE_CONTENT")) throw new TypeError("Message content intent must be enabled")
        this.options = options
        /**
         * @type {Collection<string, commandClass>} this.commands
         */
        this.commands = new Collection()
        this.aliases = new Collection()
        this.prefix = {}
        if (this.options.path) {
            this.init()
        }
        this.options.client.on('ready', async () => {
            this.options.client.guildsIds.map(id => this.prefix[id] = this.options.defaultPrefix)
        })
        this.options.client.on('guildAdded', guild => this.prefix[guild.id] = this.options.defaultPrefix)
        this.options.client.on('guildRemoved', guild => { delete this.prefix[guild.id] })
        this.options.client.on('message', async message => {
            const prefix = this.prefix[message.guildId] || this.options.defaultPrefix
            if (!prefix) return
            if (message.webhookId) return
            if (!message.guildId) return
            if (message.author.bot) return
            if (!message.content.startsWith(prefix)) return
            const args = message.content.slice(prefix.length).trim().split(/ +/g)
            let cmd = this.commands.get(args[0]?.toLowerCase()) || this.aliases.get(args[0]?.toLowerCase())
            if (!cmd) return
            args.shift()
            if (!cmd.run) return console.warn(`The command ${cmd.name} doesn't have a valid run function`)
            if (typeof cmd.options.startTyping === "undefined" && this.options.startTyping) await message.channel.startTyping().catch(e => { })
            else if (cmd.options.startTyping) await message.channel.startTyping().catch(e => { })
            let canAccess = await this.checkPermissions(message, cmd)
            if (!canAccess) return cmd.options.noPermissionReply ? message.reply(cmd.options.noPermissionReply).catch(e => { }) : undefined
            if(typeof cmd.options.cooldown === "number" && cmd.options.cooldown > 0) if(cmd.cooldownCache.has(`${cmd.options.cooldownIsGeneral?"_":message.authorId}`)) return cmd.options.cooldownMessage ? message.reply(cmd.options.cooldownMessage).catch(()=>{}) : undefined
            if(typeof cmd.options.cooldown === "number" && cmd.options.cooldown > 0 && !cmd.cooldownCache.has(`${cmd.options.cooldownIsGeneral?"_":message.authorId}`)){
                cmd.cooldownCache.set(`${cmd.options.cooldownIsGeneral?"_":message.authorId}`, true)
                setTimeout(() => cmd.cooldownCache.delete(`${cmd.options.cooldownIsGeneral?"_":message.authorId}`), cmd.options.cooldown)
            }
            let finalArgs = [this.options.client, message]
            if (cmd.options.arguments.length < 1) return cmd.run(...finalArgs)
            var gotError = false
            let index = 0
            let guildRoles = message.guild.roles.size < 1 ? (cmd.options.arguments && cmd.options.arguments.filter(ag => ag.type === "role").length > 0) ? await message.guild.fetchRoles().catch(e => { }) : new Discord.Store() : message.guild.roles
            let allChannels = new Discord.Store()
            if (cmd.options.arguments && cmd.options.arguments.filter(ag => ag.type === "channel").length > 0 && this.options.client.options.channelsLifeTime > 0) {
                this.options.client.textChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
                this.options.client.announcementChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
                this.options.client.voiceChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
                this.options.client.threadChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
                this.options.client.categoryChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
                this.options.client.stageChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
                this.options.client.forumChannels.filter(c => c.guildId === message.guildId).map(c => allChannels.set(c.id, c))
            } else if (cmd.options.arguments && cmd.options.arguments.filter(ag => ag.type === "channel").length > 0) await message.guild.fetchChannels().then(all => {
                all.text.map(c => allChannels.set(c.id, c))
                all.announcement.map(c => allChannels.set(c.id, c))
                all.voice.map(c => allChannels.set(c.id, c))
                all.category.map(c => allChannels.set(c.id, c))
                all.stage.map(c => allChannels.set(c.id, c))
                all.forum.map(c => allChannels.set(c.id, c))
            }).catch(e => { })
            let allMembers = message.guild.members.size < 1 ? this.clientIntents.has('GUILD_MEMBERS') ? cmd.options.arguments && cmd.options.arguments.filter(ag => ag.type === "member" || ag.type === "user").length > 0 ? await message.guild.fetchMembers().catch(e => { }) : new Discord.Store() : new Discord.Store() : message.guild.members
            let allUsers = new Discord.Store()
            if (this.options.client.users.size < 1) allMembers.map(member => allUsers.set(member.id, member.user))
            else allUsers = this.options.client.users
            //setTimeout(async () => {
            cmd.options.arguments.map(arg => {
                if (gotError) return
                if (arg.type === '') return
                if (arg.type) arg.type = arg.type.toLowerCase()
                if (arg.type === "role") {
                    let toTest = args[index]
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (!guildRoles.has(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('@', '').replaceAll('&', ''))) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    finalArgs.push(guildRoles.get(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('@', '').replaceAll('&', '')))
                    index++
                    checkEnd(index, cmd)
                } else if (arg.type === "channel") {
                    let toTest = args[index]
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (!allChannels.has(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('#', '').replaceAll('&', ''))) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    finalArgs.push(allChannels.get(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('#', '').replaceAll('&', '')))
                    index++
                    checkEnd(index, cmd)
                } else if (arg.type === "member") {
                    let toTest = args[index]
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (!allMembers.has(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('@', '').replaceAll('!', ''))) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    finalArgs.push(allMembers.get(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('@', '').replaceAll('!', '')))
                    index++
                    checkEnd(index, cmd)
                } else if (arg.type === "user") {
                    let toTest = args[index]
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (!allUsers.has(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('@', '').replaceAll('!', ''))) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    finalArgs.push(allUsers.get(toTest.replaceAll('<', '').replaceAll('>', '').replaceAll('@', '').replaceAll('!', '')))
                    index++
                    checkEnd(index, cmd)
                } else if (arg.type === "boolean") {
                    let toTest = args[index]?.toLowerCase()
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (![(arg.boolean_true?.toLowerCase() || 'on'), (arg.boolean_false?.toLowerCase() || 'fase')].includes(toTest)) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    if (toTest === (arg.boolean_true?.toLowerCase() || 'on')) finalArgs.push(true)
                    else if (toTest === (arg.boolean_false?.toLowerCase() || 'false')) finalArgs.push(false)
                    index++
                    checkEnd(index, cmd)
                } else if (arg.type === "number") {
                    let toTest = args[index]
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (isNaN(toTest)) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    toTest = parseInt(toTest)
                    if (toTest < (arg.min_number || 0) || toTest > (arg.max_number || Infinity)) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    finalArgs.push(toTest)
                    index++
                    checkEnd(index, cmd)
                } else if (!arg.type || arg.type === "normal" || arg.type === "string") {
                    let toTest = arg.long ? args.slice(index).join(' ') : args[index]
                    if (!toTest) return !arg.required ? [finalArgs.push(null), index++, checkEnd(index, cmd)] : arg.missingReply ? [message.reply(arg.missingResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.missingResponse).catch(e => { }), gotError = true]
                    if (arg.somethingIn && arg.somethingIn.length > 0) if (!arg.somethingIn.includes(toTest)) return arg.invalidReply ? [message.reply(arg.invalidResponse).catch(e => { }), gotError = true] : [message.channel.send(arg.invalidResponse).catch(e => { }), gotError = true]
                    finalArgs.push(toTest)
                    index++
                    checkEnd(index, cmd)
                }
                async function checkEnd(index, cmd) {
                    if (index === cmd.options.arguments.length) cmd.run(...finalArgs)
                }
            })
            //}, 200)
        })
    }
    /**
     * @private
     */
    init() {
        const subFolders = fs.readdirSync(this.options.path)
        for (const folder of subFolders) {
            const files = fs.readdirSync(`${this.options.path}${this.options.path.endsWith('/') ? '' : '/'}${folder}`)
            for (const file of files) {
                const cmd = require(`../../../${this.options.path}${this.options.path.endsWith('/') ? '' : '/'}${folder}/${file}`)
                cmd.init(this.options.client)
                this.commands.set(cmd.options.name, cmd)
                if (cmd.options.aliases && cmd.options.aliases.length < 0) {
                    cmd.options.aliases.map(alias => this.aliases.set(alias, cmd))
                }
            }
        }
    }

    /**
     *
     * @param {Discord.Message} message
     * @param {commandClass} command
     * @returns {boolean}
     */
    async checkPermissions(message, command) {
        return new Promise(resolve => {
            if (!command.options.permissions) return resolve(true)
            if (typeof command.options.permissions === "string") {
                if (message.member.permissions && message.member.permissions.has(command.options.permissions, true)) return resolve(true)
                else return resolve(false)
            } else if(Array.isArray(command.options.permissions)){
                if(message.member.permissions && command.options.permissions.filter(p => message.member.permissions.has(p, true)).length === command.options.permissions.length) return resolve(true)
                else return resolve(false)
            } else return resolve(false)
        })
    }
}