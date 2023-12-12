const mercadopago = require('mercadopago');
const controller = require('./userController')
const { cpf } = require('cpf-cnpj-validator');
require('dotenv').config()
var valor = 0
var user, plano, dataAprov


mercadopago.configure({
  client_id: '664737206974051',
  client_secret: 'rHMGFmccM1BA4pWObUULe4QKE9Bq14Ts',
  access_token: 'APP_USR-664737206974051-111600-624f98d90b0e474583c17d68b0e08018-294483425',
});

async function PayCreate(plano, userId) {
  let dateEx = new Date(Date.now() - 3 * 60 * 60 * 1000)
  dateEx.setMinutes(dateEx.getMinutes() + 30)
  dateEx = dateEx.toISOString();
  dateEx = dateEx.replace('Z', '-04:00')
  //seta data de expiracao para 30 min da data atual


  if (plano === 'Mensal') {
    valor = parseFloat(process.env.VALORMENSAL)
  } else if (plano === 'Semestral') {
    valor = parseFloat(process.env.VALORSEMESTRAL)
  } else if (plano === 'Anual') {
    valor = parseFloat(process.env.VALORANUAL)
  }

  const num = cpf.generate();
  const formattedCpf = cpf.format(num);

  const payment_data = {
    external_reference: userId.toString(),
    transaction_amount: valor,
    description: plano,
    payment_method_id: 'pix',
    date_of_expiration: dateEx,
    payer: {
      email: 'test'+ userId +'@gmail.com',
      first_name: 'Jest',
      last_name: 'Teste',
      identification: {
        type: 'CPF',
        number: formattedCpf,
      },
    }
  };
  try {
    const pagamento = await mercadopago.payment.create(payment_data)
    const link = pagamento.body.point_of_interaction.transaction_data.ticket_url;
    return link;
  } catch (error) {
    console.log(error)
    return error
  }
}

async function PayStatus(userId, bot) {

  const searchParams = {
    external_reference: userId,
    status: 'approved'
  };

  try {
    const payments = await mercadopago.payment.search({ qs: searchParams })
    const result = payments.body.results
    if (result.length === 0) {
      bot.sendMessage(userId, 'pagamento nao encontrado')
    } else {
      var validPayment, invalidPayment = false
      var meses = 1
      var filterData = result.filter((data) => {
        dataAprov = new Date(data.money_release_date)
        plano = data.description
        user = data.external_reference

        if (plano === "Mensal") {
          meses = 1
        } else if (plano === "Semestral") {
          meses = 6
        } else if (plano === "Anual") {
          meses = 12
        }

        let dataLimit = new Date()
        dataLimit.setMonth(dataLimit.getMonth() - meses)

        if (dataAprov > dataLimit) {
          validPayment = true

        } else {
          invalidPayment = true
        }
      })
      if (validPayment && !invalidPayment) {
        controller.CreateUser(user, plano, dataAprov, bot)
      } else if (!validPayment && invalidPayment) {
        bot.sendMessage(userId, 'Pagamento inválido')
      } else if (!validPayment && !invalidPayment) {
        bot.sendMessage(userId, 'Pagamento não encontrado')
      } else {
        controller.CreateUser(user, plano, dataAprov, bot)
      }
    }

  } catch (error) {
    console.log(error);
  }
}

module.exports = { PayCreate, PayStatus }