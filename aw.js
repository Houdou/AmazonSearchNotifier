const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const notifier = require('node-notifier');
const opn = require('opn');

const mailConfig = require('./config');
/*
config.js // <-- Create this file first
config = {
	host: 'smtp.gmail.com',
    port: 587,
    secure: true,
    auth: {
        user: 'user@gmail.com',
        pass: 'pass'
    }
}
*/
const subscribers = require('./subscribers');
/*
subscriber = [emailA, emailB, ...];
*/

const nodemailer = require('nodemailer');

// Parameters
const url = `https://www.amazon.co.jp/s/rh=i0aps,p_n_shipping_option-bin:2493950051,k:nintendo switch`;
const itemName = `ネオンブルー`;
const searchInterval = 8; // Minutes
let FUSE = true;

// Functions
let searchAmazon = function(url, itemName, callback) {
	console.log("Searching Amazon for: ", itemName);
	request(url, (err, res, body) => {
		if(err) console.error(err);
		let [itemFound, itemUrl] = parseResult(body, itemName);

		notifyUser(itemFound, itemUrl);
		console.log("Search complete.");
		if(callback) {
			callback(itemFound);
		}
	});	
}

let parseResult = function(res, item) {
	let itemFound = false;
	let itemUrl = '';
	let $ = cheerio.load(res);
	$('.s-access-detail-page').each((i, ele) => {
		if($(ele).attr('title').indexOf(item) != -1) {
			itemFound = true;
			itemUrl = $(ele).attr('href');
		}
	});

	return [itemFound, itemUrl];
}

let notifyUser = function(itemFound, itemUrl) {
	notifier.notify({
		title: itemFound ? 'Switch 有货啦！（测试）' : "Switch 暂时没货。。。",
		message: itemFound ? '点我买买买' : '再等等？',
		sound: true, // Only Notification Center or Windows Toasters
		wait: true // Wait with callback, until user action is taken against notification
	}, function (err, response) {
		// Response is response from notification
	});

	notifier.on('click', function (notifierObject, options) {
		opn(itemUrl);
	});

	notifier.on('timeout', (notifierObject, options)=>{});	
		
	if(itemFound) {
		let sendNotificationEmail = function(itemUrl) {
			let mail = {
				from: mailConfig.auth.user,
				sender: "search.notifier@anazon.co.jp", // lol
				to: subscribers,
				subject: itemName + " is available now.",
				text: itemName + " is available now. Item url: " + itemUrl,
				html: `<a href="${itemUrl}">Item link</a>`
			}
			transporter.sendMail(mail);
			console.log("Email sent.");

			FUSE = false;
		};

		let transporter = nodemailer.createTransport(mailConfig);
		transporter.verify((err, res) => {
			if(err) {
				console.log(err);
				FUSE = false;
			} else {
				console.log("Email server connected.");
				sendNotificationEmail(itemUrl);
			}
		});
	}
};

// Main

let searchLoopInterval = -1;
searchAmazon(url, itemName);
searchLoopInterval = setInterval(() => {
	if(FUSE) {
		searchAmazon(url, itemName, (itemFound) => {
			if(!itemFound)
				console.log("Next search time: " + new Date((new Date()).getTime() + searchInterval * 60 * 1000).toString());
			else {
				FUSE = false;
				console.log("Item found. Stop searching.")
				clearInterval(searchLoopInterval);
			}
		});
	} else {
		console.log("Item found. Stop searching.")
		clearInterval(searchLoopInterval);
	}
}, searchInterval * 60 * 1000);