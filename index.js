const { MessageAttachment, MessageEmbed, Client } = require('discord.js');
const { resolveImage, Canvas} = require("canvas-constructor/cairo")
const Keyv = require('keyv');
const db = new Keyv('sqlite://./storage/database.sqlite');
db.on('error', err => console.log('Connection Error', err));
const {
    token,
    prefix,
    embedColor,
    errorColor,
    welcomeColor
} = require('./config.json')
let canvax = require('canvas')
canvax.registerFont("./storage/Uni Sans Heavy.otf", { family: 'Discord' })
canvax.registerFont("./storage/DejaVuSansCondensed-Bold.ttf", { family: 'Discordx' })
const client = new Client({
    intents: ["GUILDS","GUILD_MEMBERS","GUILD_MESSAGES"]
  }) // Declare client to be a new Discord Client (bot)
  /*
  Code Below provides info about the bot 
  once it's ready
  */
  client.once("ready", () => {
    console.log(`Your EZ-Welcomer Bot Is Ready! | Please ⭐ this project on github.`)
  });
  /* Client when detects a message 
  then execute the code */
  client.on("messageCreate", async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if(command === "ping") {
      message.reply({
        embeds: [ new MessageEmbed()
          .setDescription(`Ping is ${client.ws.ping}`)
          .setColor(embedColor)
          .setTimestamp()
          .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
        ]
      }
      )
    }
    if(command === "add") {
     client.emit("guildMemberAdd", message.member)
    }
    if(command === "setchannel") {
      if(!message.member.permissions.has("MANAGE_GUILD")) return message.reply({
        embeds: [ new MessageEmbed()
          .setTitle(`Error`)
          .setDescription(`You need **MANAGE_GUILD** permission!`)
          .setColor(errorColor)
          .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
        ]
      }
      )
      let channel = message.mentions.channels.first()
      if(!channel) return message.reply({
        embeds: [ new MessageEmbed()
          .setTitle(`Wrong usage`)
          .setDescription(`Example: **setchannel #welcome**`)
          .setColor(errorColor)
          .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
        ]
      }
      )
      await db.set(`${message.guild.id}`, channel.id)
      message.reply({
        embeds: [ new MessageEmbed()
          .setTitle(`Done`)
          .setDescription(`Successfully set the welcome channel to ${channel}`)
          .setColor(embedColor)
          .setTimestamp()
          .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
        ]
      })
    }
    if(command === "channel") {
      let channel = await db.get(`${message.guild.id}`)
      if(channel) {
        message.reply({
          embeds: [ new MessageEmbed()
            .setTitle(`Welcome channel`)
            .setDescription(`Welcome channel is set to ${message.guild.channels.cache.get(channel)}`)
            .setColor(embedColor)
            .setTimestamp()
            .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
          ]
        })
      }
    }
    if(command === "setbackground"){
      if(!message.member.permissions.has("MANAGE_GUILD")) return message.reply({
        embeds: [ new MessageEmbed()
        .setTitle(`Error`)
        .setDescription(`You need **MANAGE_GUILD** permission`)]
        .setColor(errorColor)
        .setTimestamp()
        .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
      }
      )
      if(args[0] && !args[0].startsWith("http")) return message.reply({
        embeds: [new MessageEmbed()
        .setTitle(`Error`)
        .setDescription(`Please give me an image file or image url`)]
        .setColor(errorColor)
        .setTimestamp()
        .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
      }
      )
      let background = message.attachments.first() ? message.attachments.first().url : args[0]
      if(!background) return message.reply({
        embeds: [ new MessageEmbed()
        .setTitle(`Wrong usage`)
        .setDescription(`Example: **setbackground <image>** __or__ **setbackground <url>**`)
        .setColor(errorColor)
        .setTimestamp()
        .setFooter(`${message.author.tag}`, message.author.displayAvatarURL()
        )]
      }
      )
      await db.set(`bg_${message.guild.id}`, background)
      message.reply({
        embeds: [ new MessageEmbed()
          .setTitle(`Done`)
          .setDescription(`Successfully set the background`)
          .setImage(background)
          .setColor(embedColor)
          .setTimestamp()
          .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
        ]
      })
    }
      if(command === "background") {
    let background = await db.get(`bg_${message.guild.id}`)
    if(background) {
      message.reply({
        embeds: [ new MessageEmbed()
          .setDescription(`Background:`)
          .setImage(background)
          .setColor(embedColor)
          .setTimestamp()
          .setFooter(`${message.author.tag}`, message.author.displayAvatarURL())
        ]
      })
    }
  }
  });
/* Client when detects 
a new member join */

client.on('guildMemberAdd', async member => {
  let channelwelc = await db.get(`${member.guild.id}`)
  if(!channelwelc) return;
  let channel = member.guild.channels.cache.get(channelwelc)
   let buffer_attach =  await generareCanvas(member)
   const attachment = new MessageAttachment(buffer_attach, 'welcome.png')
   let embed = new MessageEmbed()
    .setTitle(`New Member! 🎉`)
    .setDescription(`Dear ${member.user} Welcome to ${member.guild.name}, We are happy to have you. We are now ${member.guild.memberCount} members!`)
    .setColor(welcomeColor)
    .setTimestamp()
    .setFooter('Thanks For Joining!')
    .setImage("attachment://welcome.png")

    channel?.send({ embeds: [embed], files: [attachment] })
})


async function generareCanvas(member) {
  const avatar = await resolveImage(member.user.displayAvatarURL({ 'size': 2048, 'format': "png" }))
  const background = await resolveImage(await db.get(`bg_${member.guild.id}`)) ?? await resolveImage("https://cdn.discordapp.com/attachments/910400703862833192/910426253947994112/121177.png")
  const { weirdToNormalChars } = require('weird-to-normal-chars')
  const name = weirdToNormalChars(member.user.username)
  let canvas = new Canvas(1024, 450)
  .printImage(background, 0, 0, 1024, 450)
  .setColor("#ffffff")
  .printCircle(512, 155, 120)
  .printCircularImage(avatar, 512, 155, 115)
  .setTextAlign('center')
  .setTextFont('70px Discord')
  .printText(`Welcome`, 512, 355)
  .setTextAlign("center")
  .setColor("#FFFFFF")
  .setTextFont('45px Discordx')
  .printText(`${name}`, 512, 395)
  .setTextAlign("center")
  .setColor("#FFFFFF")
  .setTextFont('30px Discord')
  .printText(`To ${member.guild.name}`, 512, 430)
  return canvas.toBufferAsync()
}


client.login(token)
