import moment from "moment";
import fs from "node:fs";

import sequelize from "./db.js";
import redisClient from "./redis.js";
import { avatarsPath, groupChatsPath, personalChatsPath, postsPath, privatePath, publicPath } from "./consts.js";

export function countReactions(reactions){
    let reactionsCount = {};

    reactions.forEach(r => {
        if (reactionsCount[r.reaction]) {
            reactionsCount[r.reaction] += 1;
        } else {
            reactionsCount[r.reaction] = 1;
        }
    });
    return reactionsCount;
}

export function avatarURLCol(alias, host) {
    return [sequelize.literal(`CASE WHEN "${alias}"."avatarPath" IS NULL THEN NULL ELSE CONCAT('${host}', "${alias}"."avatarPath") END`), 'avatarURL']
}

export async function convertCurrency(from, to, value){
    const fromU = from.toUpperCase();
    const toU = to.toUpperCase();
    if(fromU === toU) return value;
    
    let exchange = JSON.parse(await redisClient.get('exchange'));
    if(!exchange){
        exchange = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json').then(async (res) => await res.json());
        const endOfDay = moment().endOf('day').valueOf();
        await redisClient.set('exchange', JSON.stringify(exchange), {
            EX: Math.ceil((endOfDay - moment().valueOf()) / 1000)
        });
    }
    const noSuchCurrency = (curency) => {
        return {
            curency: curency,
            message: "No such currency"
        }
    }
    if(fromU === "UAH"){
        const curencyTo = exchange.find((v) => v.cc.toUpperCase() === toU)
        if(!curencyTo) 
            return noSuchCurrency(toU);

        return value / curencyTo.rate;
    }else if(toL === "UAH"){
        const curencyFrom = exchange.find((v) => v.cc.toUpperCase() === fromU);
        if(!curencyFrom) 
            return noSuchCurrency(fromU);
        
        return value * curencyFrom.rate;
    }else {
        const curencyFrom = exchange.find((v) => v.cc.toUpperCase() === fromU);
        if(!curencyFrom) 
            return noSuchCurrency(fromU);

        const curencyTo = exchange.find((v) => v.cc.toUpperCase() === toU)
        if(!curencyTo) 
            return noSuchCurrency(toU);

        return value * (curencyFrom.rate / curencyTo.rate);
    }
}

export function initDirectories(){
    if(!fs.existsSync(publicPath)){
        fs.mkdirSync(publicPath, (err) => {
            console.log(err);
        })
    }

    if(!fs.existsSync(postsPath)){
        fs.mkdirSync(postsPath, (err) => {
            console.log(err);
        })
    }

    if(!fs.existsSync(groupChatsPath)){
        fs.mkdirSync(groupChatsPath, (err) => {
            console.log(err);
        })
    }

    if(!fs.existsSync(avatarsPath)){
        fs.mkdirSync(avatarsPath, (err) => {
            console.log(err);
        })
    }

    if(!fs.existsSync(privatePath)){
        fs.mkdirSync(privatePath, (err) => {
            console.log(err);
        })
    }

    if(!fs.existsSync(personalChatsPath)){
        fs.mkdirSync(personalChatsPath, (err) => {
            console.log(err);
        })
    }
}