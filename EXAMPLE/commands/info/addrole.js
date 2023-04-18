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