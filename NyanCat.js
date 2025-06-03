const {
  downloadContentFromMessage,
  relayWAMessage,
  mentionedJid,
  processTime,
  MediaType,
  MessageType,
  Mimetype
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const axios = require('axios');
const {
  getFileBuffer,
  pickRandom,
  clockString,
  formatNumber,
  delay,
  isImage,
  isVideo,
  isAudio,
  isSticker,
  isDocument
} = require('./lib/myfunc.js');

const prefixes = ["/", ".", "#", "!"];
const ownerList = ["5493772455367", "5491123456789"];

function getTime() {
  return new Date().toLocaleTimeString("es-AR", { hour12: false });
}

const ZenBot = {
  key: {
    participant: "13135550002@s.whatsapp.net",
    remoteJid: "status@broadcast",
    fromMe: false
  },
  message: {
    contactMessage: {
      displayName: "Meta AI",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Meta AI;;;\nFN:Meta AI\nitem1.TEL;waid=13135550002:13135550002\nitem1.X-ABLabel:Celular\nEND:VCARD`,
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true
      }
    }
  }
};

async function NyanCat(info, axl) {
  try {
    const body = info.message?.conversation ||
      info.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
      info.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
      info.message?.imageMessage?.caption ||
      info.message?.videoMessage?.caption ||
      info.message?.extendedTextMessage?.text ||
      info.message?.viewOnceMessage?.message?.videoMessage?.caption ||
      info.message?.viewOnceMessage?.message?.imageMessage?.caption ||
      info.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      info.message?.buttonsMessage?.imageMessage?.caption ||
      info.message?.buttonsResponseMessage?.selectedButtonId ||
      info.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      info.message?.templateButtonReplyMessage?.selectedId ||
      info?.text || "";

    const Procurar_String = body;
    const isGroup = info.key.remoteJid.endsWith("@g.us");
    const sender = info.key.participant || info.key.remoteJid;
    const number = sender.split("@")[0].replace(/[^0-9]/g, "");
    const isOwner = [ownerList[0] + '@s.whatsapp.net'];
    const time = getTime();
    const budy = body.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const Procurar = Procurar_String.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const prefixUsed = prefixes.find(p => budy.startsWith(p));
    if (!prefixUsed) return;
    const command = budy.slice(prefixUsed.length).split(/ +/)[0].toLowerCase();
    const args = budy.slice(prefixUsed.length).trim().split(/ +/).slice(1);
    const q = args.join(" ");
    let groupMetadata = {};
    let participants = [];
    if (isGroup) {
      groupMetadata = await axl.groupMetadata(info.key.remoteJid);
      participants = groupMetadata.participants || [];
    }
    const from = info.key.remoteJid;
    const botNumber = axl.user?.id?.split(':')?.[0] + '@s.whatsapp.net';
    const senderParticipant = participants.find(p => p.id === sender);
    const botParticipant = participants.find(p => p.id === botNumber);
    const isAdmins = senderParticipant?.admin || false;
    const isBotAdmin = botParticipant?.admin || false;

    info.reply = info.reply || (msg => axl.sendMessage(from, { text: msg }, { quoted: ZenBot }));
    info.sendAudio = info.sendAudio || (audio => axl.sendMessage(from, { audio, mimetype: 'audio/mp4' }, { quoted: ZenBot }));
    info.sendVideo = info.sendVideo || (video => axl.sendMessage(from, { video, caption: 'Video enviado', mimetype: 'video/mp4' }, { quoted: ZenBot }));
    info.sendImage = info.sendImage || ((image, caption = '', options = {}) => axl.sendMessage(from, { image, caption, ...options }, { quoted: ZenBot }));
    info.sendDocumento = info.sendDocumento || (doc => axl.sendMessage(from, { document: doc, fileName: 'documento.pdf' }, { quoted: ZenBot }));
    info.sendSticker = info.sendSticker || (stick => axl.sendMessage(from, { sticker: stick }, { quoted: ZenBot }));
    info.sendGif = info.sendGif || (async (filePath, caption = '') => {
      try {
        const buffer = fs.readFileSync(filePath);
        return await axl.sendMessage(info.key.remoteJid, {
          video: buffer,
          caption,
          gifPlayback: true,
          mimetype: 'video/mp4'
        }, { quoted: ZenBot });
      } catch {
        return info.reply("❌ Error al enviar el gif animado.");
      }
    });

    if (isGroup) {
      console.log(`\x1b[1;34m[GRUPO]\x1b[0m 📥 Mensaje recibido:\n👤 Usuario: \x1b[1;36m${number}\x1b[0m\n📱 Número: \x1b[1;33m${sender}\x1b[0m\n👥 Grupo: \x1b[1;35m${groupMetadata.subject}\x1b[0m\n💬 Comando: \x1b[1;32m${command}\x1b[0m (Prefijo: "${prefixUsed}")\n🕒 Hora: \x1b[1;37m${time}\x1b[0m\n`);
    } else {
      console.log(`\x1b[1;34m[PRIVADO]\x1b[0m 📥 Mensaje recibido:\n👤 Usuario: \x1b[1;36m${number}\x1b[0m\n📱 Número: \x1b[1;33m${sender}\x1b[0m\n💬 Comando: \x1b[1;32m${command}\x1b[0m (Prefijo: "${prefixUsed}")\n🕒 Hora: \x1b[1;37m${time}\x1b[0m\n`);
    }

    switch (command) {
      case "hola":
        if (!isOwner) return info.reply("🚫 Este comando solo funciona en grupos.");
        return info.reply(`Hola, ${number}! 👋`);

      case "menu": {
        const videoPath = "./media/menu.mp4";
        const caption = `*🌌 Menú NyanBot*\n\n🐾 /ping\n🐾 /hola\n🐾 /grupo on|off\n🐾 /admin\n\n✨ Disfrutá el viaje espacial con NyanCat!`;

        try {
          return await axl.sendMessage(from, {
            video: fs.readFileSync(videoPath),
            mimetype: "video/mp4",
            caption,
            gifPlayback: true,
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              externalAdReply: {
                title: `ɴʏᴀɴ-ᴄᴀᴛ ᴡʜᴀᴛsᴀᴘᴘ ʙᴏᴛ 😸`,
                body: 'ˢⁱ́ᵍᵘᵉᵐᵉ ᵉⁿ ⁱⁿˢᵗᵃᵍʳᵃᵐ',
                mediaType: 1,
                renderLargerThumbnail: false,
                showAdAttribution: true,
                thumbnailUrl: 'https://i.ibb.co/zhv6ZsV4/menu.png',
                sourceUrl: "https://Instagram.com"
              }
            }
          }, { quoted: ZenBot });
        } catch {
          return info.reply("❌ No se pudo enviar el menú con video.");
        }
      }

      case "hidetag": {
        if (!isGroup) return info.reply("🚫 Este comando solo funciona en grupos.");
        if (!isAdmins) return info.reply("👮 Solo los administradores pueden usar este comando.");
        if (!isBotAdmin) return info.reply("🤖 No puedo mencionar a todos porque no soy administrador.");
        const texto = q ? q : "👋 Hola a todos!";
        return await axl.sendMessage(from, {
          text: texto,
          mentions: participants.map(p => p.id)
        }, { quoted: ZenBot });
      }

      case "grupo":
        if (!isGroup) return info.reply("🚫 Solo para grupos.");
        if (!isAdmins && !isOwner) return info.reply("👮 Solo admins pueden usar esto.");
        if (!isBotAdmin) return info.reply("🤖 No soy admin.");
        if (!q) return info.reply("✏️ Usá: /grupo on | off");
        try {
          if (q === "on") {
            await axl.groupSettingUpdate(from, "not_announcement");
            return info.reply("✅ Grupo *abierto* para todos.");
          } else if (q === "off") {
            await axl.groupSettingUpdate(from, "announcement");
            return info.reply("🔒 Grupo *cerrado* solo para admins.");
          } else {
            return info.reply("❌ Opción inválida. Usá: on u off.");
          }
        } catch (e) {
          return info.reply(e.message.includes("not-authorized") ? "🚫 No tengo permiso para eso." : "❌ Error inesperado.");
        }

      default:
        return info.reply(`Comando no reconocido: ${command}`);
    }
  } catch (error) {
    console.error("\x1b[1;31m[ERROR en NyanCat]\x1b[0m", error);
  }
}

module.exports = NyanCat;