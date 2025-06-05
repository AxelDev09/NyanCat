const path = require("path");
const fs = require("fs");
const readline = require("readline");
const pino = require("pino");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const NyanCatPath = path.resolve(__dirname, "./NyanCat.js");
let NyanCat = require(NyanCatPath);

const question = (string, timeout = 60000) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      rl.close();
      reject(new Error("\n\x1b[1;31m⏰ TIEMPO AGOTADO PARA INGRESAR EL NÚMERO. REINICIANDO...\x1b[0m"));
    }, timeout);
    rl.question(`\x1b[1m${string}\x1b[0m`, (answer) => {
      clearTimeout(timer);
      rl.close();
      resolve(answer);
    });
  });
};

let reloadTimeout = null;
let reiniciando = false;
let sesionInterval;

fs.watchFile(NyanCatPath, { interval: 100 }, (curr, prev) => {
  if (curr.mtime > prev.mtime) {
    if (reloadTimeout) clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      console.log("\x1b[1;33m[INFO] NYANCAT.JS MODIFICADO, RECARGANDO MÓDULO...\x1b[0m");
      delete require.cache[require.resolve(NyanCatPath)];
      try {
        NyanCat = require(NyanCatPath);
        console.log("\x1b[1;32m[INFO] NYANCAT.JS RECARGADO CORRECTAMENTE.\x1b[0m\n");
      } catch (error) {
        console.error("\x1b[1;31m[ERROR] FALLÓ AL RECARGAR NYANCAT.JS:\x1b[0m", error);
      }
    }, 200);
  }
});

const sessionPath = path.resolve(__dirname, "Basura-QR", "qr-código");

async function iniciarBot() {
  if (reiniciando) return;
  reiniciando = true;

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  const conectar = async () => {
    const axl = makeWASocket({
      printQRInTerminal: false,
      version,
      logger: pino({ level: "silent" }),
      auth: state,
      browser: ["UBUNTU", "CHROME", "20.0.04"],
      markOnlineOnConnect: true,
    });

    if (!axl.authState.creds.registered) {
      let numeroTelefono;
      try {
        numeroTelefono = await question("\x1b[1;34m📱 INGRESÁ TU NÚMERO DE TELÉFONO (1M): \x1b[0m", 60000);
      } catch (e) {
        console.error(e.message);
        setTimeout(() => {
          reiniciando = false;
          iniciarBot();
        }, 1000);
        return;
      }

      numeroTelefono = numeroTelefono.replace(/[^0-9]/g, "");

      if (!numeroTelefono) {
        console.error("\x1b[1;31m⚠️ NÚMERO DE TELÉFONO INVÁLIDO.\x1b[0m");
        process.exit(1);
      }

      try {
        const codigo = await axl.requestPairingCode(numeroTelefono);
        console.log("\x1b[1;34m🔗 CÓDIGO DE EMPAREJAMIENTO:\x1b[0m \x1b[1;36m" + codigo + "\x1b[0m");
      } catch (error) {
        console.error("\x1b[1;31m❌ ERROR AL GENERAR EL CÓDIGO DE EMPAREJAMIENTO:\x1b[0m", error.message);
        reiniciando = false;
        iniciarBot();
        return;
      }
    }

    axl.ev.on("messages.upsert", async ({ messages }) => {
      const m = messages[0];
      if (!m.message || m.key.fromMe) return;
      await NyanCat(m, axl);
    });

    axl.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log("\x1b[1;31m🔒 SESIÓN CERRADA DESDE WHATSAPP WEB. BORRANDO DATOS...\x1b[0m");
          fs.rmSync(sessionPath, { recursive: true, force: true });
          setTimeout(() => {
            console.log("\x1b[1;33m🔄 REINICIANDO DESDE CERO...\x1b[0m\n");
            reiniciando = false;
            iniciarBot();
          }, 2000);
        } else {
          console.log("\x1b[1;31m🔴 CONEXIÓN PERDIDA. REINTENTANDO...\x1b[0m");
          setTimeout(() => conectar(), 5000);
        }
      } else if (connection === "open") {
        console.log("\x1b[1;32m🟢 ¡CONECTADO CON ÉXITO!\x1b[0m\n");
      }
    });

    axl.ev.on("creds.update", saveCreds);
  };

  await conectar();
  vigilarSesion();
}

function vigilarSesion() {
  const archivoCredenciales = path.join(sessionPath, "creds.json");

  if (sesionInterval) clearInterval(sesionInterval);

  sesionInterval = setInterval(() => {
    if (!fs.existsSync(sessionPath) || !fs.existsSync(archivoCredenciales)) {
      if (!reiniciando) {
        console.log("\x1b[1;33m⚠️ CARPETA DE SESIÓN ELIMINADA. REINICIANDO...\x1b[0m");
        clearInterval(sesionInterval);
        reiniciando = true;
        iniciarBot();
      }
    }
  }, 3000);
}

iniciarBot();