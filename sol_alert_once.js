// Revisa el precio de SOL una vez; si llego al objetivo, avisa por WhatsApp (CallMeBot).
// Env: WA_PHONE, WA_APIKEY, TARGET_USD (default 120). Escribe triggered=true en GITHUB_OUTPUT si avisó.
const fs = require("fs");
const TARGET = parseFloat(process.env.TARGET_USD || "120");
const PHONE = process.env.WA_PHONE || "";
const APIKEY = process.env.WA_APIKEY || "";
const SOL_MINT = "So11111111111111111111111111111111111111112";

async function getPrice() {
  try {
    const r = await fetch(`https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`);
    if (!r.ok) throw new Error(`Jupiter HTTP ${r.status}`);
    return (await r.json())[SOL_MINT].usdPrice;
  } catch (e) {
    console.error("Jupiter fallo, uso CoinGecko:", e.message);
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
    if (!r.ok) throw new Error(`CoinGecko HTTP ${r.status}`);
    return (await r.json()).solana.usd;
  }
}

async function main() {
  if (!PHONE || !APIKEY) throw new Error("Faltan WA_PHONE y/o WA_APIKEY");
  const price = await getPrice();
  console.log(`SOL = $${price} (objetivo $${TARGET})`);
  if (price < TARGET) return;
  const qs = new URLSearchParams({
    phone: PHONE,
    text: `SOL llego a ${price.toFixed(2)} USD (objetivo ${TARGET} USD). Hora de vender!`,
    apikey: APIKEY,
  });
  const r = await fetch(`https://api.callmebot.com/whatsapp.php?${qs}`);
  console.log("WhatsApp HTTP", r.status);
  if (!r.ok) throw new Error("CallMeBot fallo");
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, "triggered=true\n");
}

main().catch((e) => { console.error(e.message); process.exit(1); });
