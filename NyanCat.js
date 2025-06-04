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

async function NyanCat(info, axl) {
  try {
    const body =
      info.message?.conversation ||
      info.message?.extendedTextMessage?.text ||
      info.message?.imageMessage?.caption ||
      info.message?.videoMessage?.caption ||
      info.message?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
      info.message?.buttonsMessage?.imageMessage?.caption ||
      info.message?.buttonsResponseMessage?.selectedButtonId ||
      info.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      info.message?.templateButtonReplyMessage?.selectedId ||
      info.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
      info.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
      info?.text || "";

    const from = info.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const senderJid = info.key.participant || from;
    const sender = normalizeNumber(senderJid);

    const isOwner = global.owner.some(([num]) => normalizeNumber(num) === sender);
    const time = getTime();
    const budy = body.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const prefixUsed = prefixes.find(p => budy.startsWith(p));
    if (!prefixUsed) return;

    const command = budy.slice(prefixUsed.length).split(/\s+/)[0].toLowerCase();
    const args = budy.slice(prefixUsed.length).trim().split(/\s+/).slice(1);
    const q = args.join(" ");

    let groupMetadata = {}, participants = [];
    if (isGroup) {
      groupMetadata = await axl.groupMetadata(from);
      participants = groupMetadata.participants || [];
    }

    const botNumber = axl.user?.id?.split(':')[0] + '@s.whatsapp.net';
    const senderParticipant = participants.find(p => p.id === sender);
    const botParticipant = participants.find(p => p.id === botNumber);
    const isAdmins = senderParticipant?.admin || false;
    const isBotAdmin = botParticipant?.admin || false;

    // Métodos rápidos
    info.reply = msg => axl.sendMessage(from, { text: msg }, { quoted: QuotedText });
    info.sendAudio = audio => axl.sendMessage(from, { audio, mimetype: 'audio/mp4' }, { quoted: quoted });
    info.sendVideo = video => axl.sendMessage(from, { video, caption: 'Video enviado', mimetype: 'video/mp4' }, { quoted: quoted });
    info.sendImage = (image, caption = '', options = {}) => axl.sendMessage(from, { image, caption, ...options }, { quoted: quoted });
    info.sendDocumento = doc => axl.sendMessage(from, { document: doc, fileName: 'documento.pdf' }, { quoted: quoted });
    info.sendSticker = stick => axl.sendMessage(from, { sticker: stick }, { quoted: quoted });
    info.sendGif = async (filePath, caption = '') => {
      try {
        const buffer = fs.readFileSync(filePath);
        return await axl.sendMessage(from, {
          video: buffer,
          caption,
          gifPlayback: true,
          mimetype: 'video/mp4'
        }, { quoted: quoted });
      } catch {
        return info.reply("❌ Error al enviar el gif.");
      }
    };

    // Logs
    console.log(`\x1b[1;34m[${isGroup ? "GRUPO" : "PRIVADO"}]\x1b[0m 📥 Comando recibido:
👤 Usuario: \x1b[1;36m${sender}\x1b[0m
💬 Comando: \x1b[1;32m${command}\x1b[0m
📅 Hora: \x1b[1;37m${time}\x1b[0m
${isGroup ? `👥 Grupo: \x1b[1;35m${groupMetadata.subject}\x1b[0m` : ""}`);

    // Comandos
    switch (command) {
// PRÓXIMAMENTE
      default:
        return info.reply(`❌ Comando no reconocido: *${command}*`);
    }

  } catch (err) {
    console.error("\x1b[1;31m[ERROR en NyanCat]\x1b[0m", err);
  }
}

module.exports = NyanCat;