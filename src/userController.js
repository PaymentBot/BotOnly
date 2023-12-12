var fs = require('fs');
require('dotenv').config()

async function CreateUser(user, plano, dataAprov, bot) {
    var DataUser = {
        user: user,
        plano: plano,
        aprovado: dataAprov
    }

    fs.readFile('controle.json', 'utf8', (err, data) => {
        if (err) throw err;

        var dados = JSON.parse(data);
        if (!Array.isArray(dados)) {
            dados = [dados];
        }

        var userString = JSON.stringify(DataUser);

        // Verifica se o objeto já existe no array
        var userExists = dados.some(function (el) {
            return JSON.stringify(el) === userString;
        });

        // Se o usuário não existir, adicione o objeto ao array
        if (!userExists) {
            dados.push(DataUser);
        }

        var jsonString = JSON.stringify(dados, null, 2);

        fs.writeFile('controle.json', jsonString, (err) => {
            if (err) throw err;
            bot.sendMessage(user, 'Pagamento APROVADO, segue o link do grupo VIP \n' + process.env.LINKVIP + '\n\n *Lembre-se que esse link só funcionará para seu usuário.')
            bot.unbanChatMember(process.env.GRUPOVIP, user);
        });
    });
}

function RemoveUser(bot) {

    let data = fs.readFileSync('controle.json', 'utf8');
    let jsonData = JSON.parse(data);

    let dataAtual = new Date();

    jsonData = jsonData.filter(item => {
        let dataItem = new Date(item.aprovado);
        let diferencaDias = Math.ceil((dataAtual - dataItem) / (1000 * 60 * 60 * 24));
        if (item.plano === 'Mensal' && diferencaDias > 30) {
            KickMember(item.user, bot)
            return false;
        } else if (item.plano === 'Semestral' && diferencaDias > 180) {
            KickMember(item.user, bot)
            return false;
        } else if (item.plano === 'Anual' && diferencaDias > 365) {
            KickMember(item.user, bot)
            return false;
        }
        return true;


    })

    fs.writeFileSync('controle.json', JSON.stringify(jsonData, null, 2));
}

function KickMember(userId, bot) {
    bot.banChatMember(process.env.GRUPOVIP, userId)
        .then(() => {
            console.log(`Usuário ${userId} expulso do grupo`);
        })
        .catch((err) => {
            console.log('Erro ao expulsar usuário:', err);
        });
}





module.exports = { CreateUser, RemoveUser }