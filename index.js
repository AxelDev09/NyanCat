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

const nyanCatPath = path.resolve(__dirname, "./NyanCat.js");
let NyanCat = require(nyanCatPath);

const question = (string) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\x1b[1m${string}\x1b[0m`, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

fs.watch(nyanCatPath, (eventType) => {
  if (eventType === "change") {
    console.log("\x1b[1;33m[INFO] NyanCat.js modificado, recargando módulo...\x1b[0m");
    delete require.cache[require.resolve(nyanCatPath)];
    try {
      NyanCat = require(nyanCatPath);
      console.log("\x1b[1;32m[INFO] NyanCat.js recargado correctamente.\x1b[0m\n");
    } catch (error) {
      console.error("\x1b[1;31m[ERROR] Falló al recargar NyanCat.js:\x1b[0m", error);
    }
  }
});

async function nyanCat() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.resolve(__dirname, "Basura-QR", "qr-código")
  );

  const { version } = await fetchLatestBaileysVersion();

  const conectar = async () => {
    const axl = makeWASocket({
      printQRInTerminal: false,
      version,
      logger: pino({ level: "silent" }),
      auth: state,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      markOnlineOnConnect: true,
    });

    if (!axl.authState.creds.registered) {
      let numeroTelefono = await question("\x1b[1;34m📱 INGRESA TU NÚMERO DE TELÉFONO: \x1b[0m");
      numeroTelefono = numeroTelefono.replace(/[^0-9]/g, "");

      if (!numeroTelefono) {
        console.error("\x1b[1;31m⚠️ ¡NÚMERO DE TELÉFONO INVÁLIDO!\x1b[0m");
        process.exit(1);
      }

      const codigo = await axl.requestPairingCode(numeroTelefono);
      console.log(`\x1b[1;34m🔗 CÓDIGO DE EMPAREJAMIENTO:\x1b[0m \x1b[1;36m${codigo}\x1b[0m`);
    }

    axl.ev.on("messages.upsert", async ({ messages }) => {
      const m = messages[0];
      if (!m.message || m.key.fromMe) return;
      await NyanCat(m, axl);
    });

    axl.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const debeReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log("\x1b[1;31m🔴 ¡CONEXIÓN PERDIDA! INTENTANDO RECONEXIÓN...\x1b[0m");

        if (debeReconectar) {
          setTimeout(() => {
            console.log("\x1b[1;33m🔄 REINICIANDO CONEXIÓN...\x1b[0m");
            conectar();
          }, 5000);
        }
      } else if (connection === "open") {
        console.log("\x1b[1;32m🟢 ¡CONECTADO CON ÉXITO!\x1b[0m\n");
      }
    });

    axl.ev.on("creds.update", saveCreds);
  };

  await conectar();
}

nyanCat();