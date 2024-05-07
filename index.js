const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const sequelize = require('./db');
const UserModel = require('./models');

const token = '7017819539:AAEyixcZDD4jNq8KNjkiDOdIt3CMfu2XZS8'

const bot = new TelegramApi(token, {polling: true})

const chats = {}


const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Сейчас я загадаю цифру от 0 до 9, а ты должна ее угадать!`);
    const randomNumber = Math.floor(Math.random() * 10) 
    chats[chatId] = randomNumber;
    await bot.sendMessage(chatId, 'Отгадывай', gameOptions);
}


const start = async () => {

    try {
        await sequelize.authenticate()
        await sequelize.sync()
    } catch (e) {
        console.log('Подключение к бд сломалось', e);
    }

    bot.setMyCommands([
        {command: '/start', description: 'Hello'},
        {command: '/info', description: 'Мои данные'},
        {command: '/game', description: 'Угадать цифру'},
    ])
    
    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text && text !== '/start' && text !== '/info' && text !== '/game') {
            return bot.sendMessage(chatId, 'Не пиши, угадывай')
        } else if (msg.sticker || msg.animation) {
            return bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/50.webp')
        } 

        try {
            if (text === '/start') {

                await UserModel.upsert({ chatId });
                // try {
                //     await UserModel.create({chatId})
                // } catch (e) {
                //     console.log('Ошибка при создании пользователя:', e);
                // }
                
                await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/12.webp')
                return bot.sendMessage(chatId, 'Сколько страниц прочитала сегодня?')
            }
            if (text === '/info') {
                const user = await UserModel.findOne({chatId})
                return bot.sendMessage(chatId, ` You ${msg.from.first_name} или ${msg.from.username}, в игре у тебя правильных ответов ${user.right}, неправильных ${user.wrong}`);
            }
            if (text === '/game') {
               return startGame(chatId);
            }
            return bot.sendMessage(chatId, 'Я тебя не понимаю, попробуй еще раз')
        } catch (e) {
            return bot.sendMessage(chatId, 'Произошла какая то ошибочка)');
        }
        
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === '/again') {
            return startGame(chatId);
        }
        const user = await UserModel.findOne({chatId})

        if (data == chats[chatId]) {
            user.right += 1;
            await bot.sendMessage(chatId, `Поздравляю, ты отгадалa цифру ${chats[chatId]}`)
            await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/8.webp')
            await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/69.webp', againOptions)
        } else {
            user.wrong += 1;
            switch (user.wrong) {
                case 4: 
                    await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/41.webp');
                    await bot.sendMessage(chatId, `цифрa ${chats[chatId]}`, againOptions)
                    break;
                case 9: 
                    await bot.sendMessage(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/75.webp');
                    await bot.sendMessage(chatId, `цифрa ${chats[chatId]}`, againOptions)
                    break;
                case 12:
                    await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/76.webp');
                    await bot.sendMessage(chatId, `Цифрa ${chats[chatId]} Может почитаешь про теорию вероятности...`, againOptions)
                case 16: 
                    await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/43.webp')
                    await bot.sendMessage(chatId, `Цифрa ${chats[chatId]}`, againOptions)
                case 20: 
                    await bot.sendSticker(chatId, 'https://tlgrm.ru/_/stickers/8eb/10f/8eb10f4b-8f4f-4958-aa48-80e7af90470a/28.webp')
                    await bot.sendMessage(chatId, `Цифрa ${chats[chatId]}`, againOptions);
                default:
                    await bot.sendMessage(chatId, `К сожалению ты не угадалa, бот загадал цифру ${chats[chatId]}`, againOptions);

            }
        }
        await user.save()
    })
}

start()