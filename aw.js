const path = require('path');
const request = require('request');
const cheerio = require('cheerio');
const notifier = require('node-notifier');
const opn = require('opn');

// Parameters
const url = `https://www.amazon.co.jp/s/rh=i0aps,p_n_shipping_option-bin:2493950051,k:nintendo switch`;
const itemName = `ネオンブルー`;

// Functions
let searchAmazon = function(url, itemName) {
	request(url, (err, res, body) => {
		if(err) console.error(err);
		let [itemFound, itemUrl] = parseResult(body, itemName);

		notifyUser(itemFound, itemUrl);
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
		icon: path.join(__dirname, 'coulson.jpg'), // Absolute path (doesn't work on balloons)
		sound: true, // Only Notification Center or Windows Toasters
		wait: true // Wait with callback, until user action is taken against notification
	}, function (err, response) {
		// Response is response from notification
	});

	notifier.on('click', function (notifierObject, options) {
		opn(itemUrl);
	});

	notifier.on('timeout', (notifierObject, options)=>{});	
};

// Main
searchAmazon(url, itemName);