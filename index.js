const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const controller = require('./src/paymentController')
const userController = require('./src/userController')
const cron = require('node-cron');
require('dotenv').config()
const fs = require('fs');

const app = express();
const token = process.env.TOKENBOT;
const bot = new TelegramBot(token, { polling: true });
let plano = 'vazio'
let userId

bot.on('new_chat_members', (msg) => {
  if(msg.chat.id == process.env.GRUPOVIP) {
    console.log(process.env.GRUPOVIP)
    fs.readFile('controle.json', 'utf8', (err, data) => {
      if (err) throw err;
      let allowedMembers = JSON.parse(data);
      msg.new_chat_members.forEach((member) => {
        let foundUser = allowedMembers.find(m => m.user === member.id.toString());
        if (!foundUser) {
          bot.banChatMember(process.env.GRUPOVIP, member.id);
        }
      });
    });
  } else if (msg.chat.id == process.env.GRUPOFREE) {

  }
})

bot.onText(/\/start/, (msg) => {
  console.log(msg.from.id)
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ['👑 Planos Vip 👑'],
        ['🎞 Previa do Grupo 🎞'],
        ['🔍 Consultar Pagamento 🔍'],
        ['🧑‍💻 Suporte 🧑‍💻'],
      ]
    })
  };
  const messageId = msg.message_id;
  try {
  bot.deleteMessage(msg.chat.id, messageId);
} catch (err) {}
  
  bot.sendMessage(msg.chat.id, 'Seja Bem Vindo ao Only Packs 🔥, \n' +
    'em que posso lhe ajudar?', opts);
  userId = msg.from.id
});
bot.on('message', async function on(msg) {
  userId = msg.from.id
  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        ['🔥 Assinar Plano Mensal 🔥'],
        ['💎 Assinar Plano Semestral 💎'],
        ['🎩 Assinar Plano Anual 🎩'],
        ['MENU 👉 /start'],
      ]
    })
  };
  if (msg.text === '👑 Planos Vip 👑') {
    const messageId = msg.message_id;
    try {
      bot.deleteMessage(msg.chat.id, messageId );
      bot.deleteMessage(msg.chat.id, messageId - 1);
  } catch (err) {}
    bot.sendMessage(userId, '👑 Planos Vip 👑\n\n' +
      '\n🔥 Plano Mensal - R$ 0,99 ' +
      '  \n\n' +
      '💎 Plano Semestral - R$ 1,99 ' +
      '   \n\n' +
      '🎩 Plano Anual - R$ 2,99 ' +
      '  \n\n\n' +
      'Vantagens:\n' +
      '*Conteúdos Atualizados todos os dias. \n' +
      '*Pagamento facilitado pelo Pix. \n' +
      '*Entrada Imediata após o pagamento. \n' +
      '*Processo 100% Seguro e Automático. \n' +
      '*Serviço disponível 24H. ', opts)

  } else if (msg.text === '🎞 Previa do Grupo 🎞') {
    bot.sendMessage(userId, 'Segue o nosso link do Grupo FREE ' + process.env.LINKFREE)
  } else if (msg.text === '🔍 Consultar Pagamento 🔍') {
    try {
      controller.PayStatus(userId, bot)
    } catch {
      bot.sendMessage(userId, 'Pagamento não encontrado')
    }
  } else if (msg.text === '🧑‍💻 Suporte 🧑‍💻') {
    const messageId = msg.message_id;
    try {
      bot.deleteMessage(msg.chat.id, messageId );
      bot.deleteMessage(msg.chat.id, messageId - 1);
  } catch (err) {}
    bot.sendMessage(userId, '🤖 Bem Vindo ao Suporte 🤖\n\n\n' +
      'Entre em contato com\n 👉 @SuportOnlyPack👈 \n e deixe sua mensagem para obter suporte. \n' +
      'Responderemos em breve!')
  } else if (msg.text === '🔥 Assinar Plano Mensal 🔥') {
    plano = 'Mensal'
    const result = await controller.PayCreate(plano, userId);
    bot.sendMessage(userId, 'Link de Pagamento: ' + result)
  } else if (msg.text === '💎 Assinar Plano Semestral 💎') {
    plano = 'Semestral'
    const result = await controller.PayCreate(plano, userId);
    bot.sendMessage(userId, 'Link de Pagamento: ' + result)
  } else if (msg.text === '🎩 Assinar Plano Anual 🎩') {
    plano = 'Anual'
    const result = await controller.PayCreate(plano, userId);
    bot.sendMessage(userId, 'Link de Pagamento: ' + result)
  }
})

cron.schedule('0 0 * * *', () => {
  userController.RemoveUser(bot)
})


app.listen(process.env.HOSTPORT || 3000, () => {
  console.log('Bot ON');
});

