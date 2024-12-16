import dotenv from "dotenv";

import { memeify } from "./discord-embeds/memeify.js";
import client from "./client.js";

dotenv.config();

const botToken = process.env["BOT_TOKEN"];

client.on("messageCreate", async (msg) => {
  if (msg.content.toLowerCase().startsWith("frinkiac")) {
    memeify("frinkiac", msg);
  } else if (msg.content.toLowerCase().startsWith("masterofallscience")) {
    memeify("masterofallscience", msg);
  } else if (msg.content.toLowerCase().startsWith("morbotron")) {
    memeify("morbotron", msg);
  }
});

client.login(botToken);
