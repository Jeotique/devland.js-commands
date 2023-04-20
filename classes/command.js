const Discord = require('devland.js')

module.exports = class Command {
    /**
     * @typedef {object} Command_Options_Arguments
     * @property {string} name The name of the variable
     * @property {'normal'|'role'|'channel'|'member'|'user'} [type="normal"] The type of the variable (normal = string | undefined = normal)
     * @property {Array} somethingIn If the type is 'normal' or 'string' you can use this to create invalid response if the array doesn't include the argument
     * @property {boolean} [long=false] The variable is a long type of not, work only with 'normal' type
     * @property {boolean} [required=false] The variable is required or not
     * @property {boolean} [invalidReply=false] The bot mention the user or not when he answer for a invalid argument
     * @property {string} [invalidResponse="The argument is invalid"] What the bot answer if the variable type if invalid
     * @property {boolean} [missingReply=false] The bot mention the user or not when he answer for a missing argument
     * @property {string} [missingResponse="The argument is missing"] What the bot answer if the variable if missing, work only if required is enabled
     */
    /**
     * @typedef {object} Command_Options
     * @property {string} name The name of the command
     * @property {Array<String>} aliases The aliases of the command (other names)
     * @property {string} description The description of the command
     * @property {boolean} startTyping The bot will be marked like typing in the channel, this will overwrite the manager propertie startTyping
     * @property {Array<Command_Options_Arguments>} arguments The command arguments
     * @property {string} permission The permission needed to execute the command
     * @property {string} noPermissionReply What the bot answer to a user without the required permission
     * @property {Function} run The function that will be executed
     */
    /**
     *
     * @param {Discord.Client} client
     * @param {Command_Options} options
     */
    constructor(options = {}) {
        if (typeof options !== "object") options = {}
        this.options = options
        /**
         * @private
         */
        this.client = null
        this.run = options.run
        if (!this.options.name) throw new Error("Command name must be defined")
        if (!this.options.aliases) this.options.aliases = []
        if (!this.options.arguments) this.options.arguments = []
        setTimeout(() => {
            if (typeof this.run !== "function") return console.warn(`The command ${this.options.name} doesn't have a valid run function`)
        }, 500)
        let testArgs = []
        this.options.arguments.map(arg => {
            if (testArgs.includes(arg.name)) throw new Error("You can't use the same name for two differents arguments")
            else testArgs.push(arg.name)
        })
    }
    init(client) {
        /**
         * @private
         */
        this.client = client
    }
}