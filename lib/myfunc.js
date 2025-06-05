import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import path from 'path';
import mime from 'mime-types';
import fs from 'fs';

// Asegura que exista el directorio temporal
const ensureTempDir = () => {
  const dir = './temp';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
};

// Descargar archivos multimedia desde un mensaje
export async function getFileBuffer(message, mediaType, saveToFile = true) {
  try {
    if (!message) throw new Error('No se recibió mensaje para descargar.');

    if (!mediaType) {
      if (message.message?.imageMessage) mediaType = 'image';
      else if (message.message?.videoMessage) mediaType = 'video';
      else if (message.message?.audioMessage) mediaType = 'audio';
      else if (message.message?.stickerMessage) mediaType = 'sticker';
      else if (message.message?.documentMessage) mediaType = 'document';
      else throw new Error('Tipo de media no reconocido en el mensaje.');
    }

    const media = message.message?.[`${mediaType}Message`];
    if (!media || !media.mediaKey) {
      throw new Error(`El mensaje no contiene mediaKey para tipo "${mediaType}".`);
    }

    const stream = await downloadContentFromMessage(media, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);

    const buffer = Buffer.concat(chunks);
    const mimetype = media.mimetype || mime.lookup(mediaType) || 'application/octet-stream';
    const ext = mime.extension(mimetype) || 'bin';
    const filename = `media_${Date.now()}.${ext}`;
    const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;

    if (saveToFile) {
      ensureTempDir();
      fs.writeFileSync(`./temp/${filename}`, buffer);
    }

    return {
      buffer,
      mimetype,
      filename,
      base64,
      size: getFileSize(buffer)
    };
  } catch (err) {
    console.error('[ERROR getFileBuffer]:', err.message);
    throw new Error('No se pudo obtener el archivo del mensaje.');
  }
}

// Formato legible para el tamaño de archivo
export function getFileSize(buffer) {
  const bytes = Buffer.byteLength(buffer);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

// Elige un valor aleatorio de un array
export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Convierte milisegundos a formato hh:mm:ss
export function clockString(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor(ms / 60000) % 60;
  const s = Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// Formatea números según la región (Argentina)
export function formatNumber(number) {
  return Intl.NumberFormat('es-AR').format(number);
}

// Promesa para retraso
export function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Verifica tipo de mensaje
export function isImage(msg) {
  return !!msg?.message?.imageMessage;
}
export function isVideo(msg) {
  return !!msg?.message?.videoMessage;
}
export function isAudio(msg) {
  return !!msg?.message?.audioMessage;
}
export function isSticker(msg) {
  return !!msg?.message?.stickerMessage;
}
export function isDocument(msg) {
  return !!msg?.message?.documentMessage;
}