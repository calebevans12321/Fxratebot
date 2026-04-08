const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const FX_REGEX = /(\d+(?:\.\d+)?)\s*([a-zA-Z]{3})\s*(?:in|to|into|as|->)?\s*([a-zA-Z]{3})/i;

async function getRate(from, to) {
  const url = `https://api.frankfurter.app/latest?from=${from}&to=${to}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  if (!data.rates || !data.rates[to]) throw new Error("Currency not found");
  return data.rates[to];
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const match = text.match(FX_REGEX);

  if (!match) return;

  const amount = parseFloat(match[1]);
  const from = match[2].toUpperCase();
  const to = match[3].toUpperCase();

  if (from === to) {
    return bot.sendMessage(chatId, `That's the same currency — the rate is 1.00!`);
  }

  try {
    const rate = await getRate(from, to);
    const converted = (amount * rate).toFixed(2);
    const reply =
      `💱 *${amount} ${from} = ${converted} ${to}*\n` +
      `Rate: 1 ${from} = ${rate} ${to}\n` +
      `_Powered by frankfurter.app_`;
    bot.sendMessage(chatId, reply, { parse_mode: "Markdown" });
  } catch (e) {
    bot.sendMessage(chatId, `⚠️ Couldn't fetch that rate. Check the currency codes and try again.\nExample: _10 GBP to NZD_`, { parse_mode: "Markdown" });
  }
});

console.log("FX Bot is running...");
