const {Command} = require('devland.js-commands')

module.exports = new Command({
    name: "delrole",
    aliases: "del_role",
    description: "Remove a role to a user",
    startTyping: true,
    permissions: ["MANAGE_ROLES"],
    noPermissionReply: "You need the permission `MANAGE_ROLES`",
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
        member.removeRoles(role).then(() => {
            message.reply(`Role ${role.name} removed to ${member}`)
        }).catch(e=>{
            message.reply(`I can't remove the role ${role.name}`)
        })
    }
})