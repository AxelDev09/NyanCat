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
const myfunc = require('./lib/myfunc.js');

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
  isDocument,
  getExtension,
  getMimeType,
  isUrl,
  getRandomFileName
} = myfunc;

const prefixes = ["/", ".", "#", "!", "*", "&", "+", "%", "@"];

global.owner = [
  ['5493772576062', 'Leo', true]
];

const QuotedText = {
  key: {
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast",
    fromMe: false,
    id: "SUPER_QUOTED_TEXT"
  },
  message: {
    extendedTextMessage: {
      text: "✨ NyanBot - WhatsApp Bot 🌌"
    }
  }
};

const quoted = {
  key: {
    participant: "13135550002@s.whatsapp.net",
    remoteJid: "status@broadcast",
    fromMe: false
  },
  message: {
    contactMessage: {
      displayName: "NyanCat",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Meta AI;;;\nFN:Meta AI\nitem1.TEL;waid=13135550002:13135550002\nitem1.X-ABLabel:Celular\nEND:VCARD`,
      contextInfo: {
        forwardingScore: 1,
        isForwarded: true
      }
    }
  }
};

function normalizeNumber(jid = '') {
  return jid.toString().replace(/[^0-9]/g, "");
}

function getTime() {
  return new Date().toLocaleTimeString("es-AR", { hour12: false });
}

async function NyanCat(m, axl) {
  try {
    const body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      m.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      m.message?.buttonsMessage?.imageMessage?.caption ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.message?.templateButtonReplyMessage?.selectedId ||
      m.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
      m.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
      m?.text || "";

    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = m.key.participant || m.key.remoteJid;

    const isOwner = global.owner.includes(sender.split('@')[0]);
    const time = getTime();
    const budy = body.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const prefixUsed = prefixes.find(p => budy.startsWith(p));
    if (!prefixUsed) return;

    const command = budy.slice(prefixUsed.length).split(/\s+/)[0].toLowerCase();
    const args = budy.slice(prefixUsed.length).trim().split(/\s+/).slice(1);
    const q = args.join(" ");
    const userName = m.pushName || 'Desconocido';
    
    let groupMetadata = {}, participants = [];
    if (isGroup) {
      groupMetadata = await axl.groupMetadata(from);
      participants = groupMetadata.participants || [];
    }
    
    const senderId = sender.endsWith('@s.whatsapp.net') ? sender : sender + '@s.whatsapp.net';
    const botNumber = axl.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const senderParticipant = participants.find(p => p.id === sender);
    const botParticipant = participants.find(p => p.id === botNumber);
    const isAdmin = participants.find(p => p.id === senderId)?.admin || false;
    const isBotAdmin = botParticipant?.admin || false;
    // Métodos rápidos
    m.reply = msg => axl.sendMessage(from, { text: msg }, { quoted: QuotedText });
    m.sendAudio = audio => axl.sendMessage(from, { audio, mimetype: 'audio/mp4' }, { quoted: quoted });
    m.sendVideo = video => axl.sendMessage(from, { video, caption: 'Video enviado', mimetype: 'video/mp4' }, { quoted: quoted });
    m.sendImage = (image, caption = '', options = {}) => axl.sendMessage(from, { image, caption, ...options }, { quoted: quoted });
    m.sendDocumento = doc => axl.sendMessage(from, { document: doc, fileName: 'documento.pdf' }, { quoted: quoted });
    m.sendSticker = stick => axl.sendMessage(from, { sticker: stick }, { quoted: quoted });
    m.sendGif = async (filePath, caption = '') => {
      try {
        const buffer = fs.readFileSync(filePath);
        return await axl.sendMessage(from, {
          video: buffer,
          caption,
          gifPlayback: true,
          mimetype: 'video/mp4'
        }, { quoted: quoted });
      } catch {
        return m.reply("❌ Error al enviar el gif.");
      }
    };

    // Logs
    console.log(`\x1b[1;34m[${isGroup ? "GRUPO" : "PRIVADO"}]\x1b[0m 📥 Comando recibido:
👤 Usuario: \x1b[1;36m${userName}\x1b[0m
💬 Comando: \x1b[1;32m${command}\x1b[0m
📅 Hora: \x1b[1;37m${time}\x1b[0m
${isGroup ? `👥 Grupo: \x1b[1;35m${groupMetadata.subject}\x1b[0m` : ""}`);

    // Comandos
    switch (command) {

      case "hola":
        return m.reply(`Hola, ${userName}! 👋`);
      
      case "menu": {
        const videoPath = "./media/menu.mp4";
        const caption = `*🌌 Menú NyanBot*
┌────────── 
└┐    PRINCIPAL
┌┤|
││|
││|
││|
│└──⊷
└┬────────── 
┌┤    GRUPO
││|
││|
││|
││|
││|
│└──⊷
└┬────────── 
┌┤    DESCARGAS
││|
││|
││|
││|
││|
│└──⊷
└─────────── 
*PRÓXIMAMENTE...*`;

        if (!fs.existsSync(videoPath)) {
          return m.reply("❌ No se encontró el video del menú. Asegurate de que exista `./media/menu.mp4`.");
        }

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
                thumbnailUrl: 'https://i.ibb.co/zhv6ZsV4/menu.png',
                sourceUrl: "https://Instagram.com"
              }
            }
          }, { quoted: quoted });
        } catch (e) {
          return m.reply("❌ Error al enviar el menú.");
        }
      }
      default:
        
    }

  } catch (err) {
    console.error("\x1b[1;31m[ERROR en NyanCat]\x1b[0m", err);
  }
}

module.exports = NyanCat;