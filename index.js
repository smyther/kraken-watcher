import KrakenClient from 'kraken-api';
import fs from 'fs';
import util from 'util';
import c from 'colors/safe';
import Table from 'cli-table';
import clear from 'clear';
import sleep from 'sleep';
let btcVal, gbpVal;

const key = 'YOURS';
const secret = 'YOURS';
const kraken = new KrakenClient(key, secret);

function krakenWatch(){

	this.previousPrices = {};
	this.tick = 5;

	this.init = () => {
		this.getData();
		setInterval(this.getData, this.tick * 1000);
	}

	this.getData = () => {
		this.getBalance()
		.then((owned) => this.getTicker(owned))
		.catch((err) => {
			console.log('retrying soon');
		});
	}

	this.getBalance = () => {
		return new Promise((resolve, reject) => {
			kraken.api('Balance', null, (err, data) => {

				if (err){
					console.log(err);
					reject(err);
				}
				let owned = [];

				Object.keys(data.result).forEach((e) => {

					if (data.result[e] > 0){

						if (!this.previousPrices[e]){
							this.previousPrices[e] = 0;
						}

						if (e === 'XXBT'){
							owned[e] = {
									key: e + 'ZGBP',
									owned: data.result[e]
							};
						} else {
							owned[e] = {
									key: e + 'XXBT',
									owned: data.result[e]
							};
						}
					}
				});

				resolve(owned);
			});
		});
	};

	this.getTicker = (owned) => {

			return new Promise((resolve, reject) => {
				sleep.sleep(1);

				let currencies = [];

				Object.keys(owned).forEach((e) => {
					currencies.push(owned[e].key);
				});

				kraken.api('Ticker', {"pair": currencies.join(',')}, (err, data) => {

						let table = new Table({
							head: ['Currency', 'Last Price', 'Todays High', 'Owned', 'BTC Value', 'GBP Value'],
							colWidths: [10, 15, 15, 15, 15, 15]
						});

						const btcValue = data.result.XXBTZGBP.c[0];


						// a = ask array(<price>, <whole lot volume>, <lot volume>),
						//  b = bid array(<price>, <whole lot volume>, <lot volume>),
						//  c = last trade closed array(<price>, <lot volume>),
						//  v = volume array(<today>, <last 24 hours>),
						//  p = volume weighted average price array(<today>, <last 24 hours>),
						//  t = number of trades array(<today>, <last 24 hours>),
						//  l = low array(<today>, <last 24 hours>),
						//  h = high array(<today>, <last 24 hours>),
						//  o = today's opening price

						let gbpTotal = 0, btcTotal = 0;

						Object.keys(owned).forEach((e) => {
							let res = [];
							let curr = data.result[owned[e].key];

							// currency name
							res.push(c.blue(e));

							// last price
							let color = 'white';

							if (parseFloat(this.previousPrices[e]) < parseFloat(curr.c[0])){
								color = 'bgGreen';
							} else if (parseFloat(this.previousPrices[e]) > parseFloat(curr.c[0])){
								color = 'bgRed';
							}

							res.push(c[color](curr.c[0]));

							this.previousPrices[e] = parseFloat(curr.c[0]);

							res.push(curr.h[0]);
							// owned
							res.push(parseFloat(owned[e].owned).toFixed(4));

							const value = e !== 'XXBT' ? parseFloat(owned[e].owned * curr.c[0]) : parseFloat(owned[e].owned);

							// BTC Value
							res.push('₿' + value.toFixed(4));
							btcTotal += value;

							// GBP Value
							const gbp = parseFloat(btcValue * value);
							res.push(`£${gbp.toFixed(2)}`);

							gbpTotal += gbp;

							table.push(res);
						});

						table.push([c.blue('Totals'),'','','', c.yellow('₿'+btcTotal.toFixed(3)), c.yellow(`£${gbpTotal.toFixed(2)}`)]);

						clear();

						// console.log('Last Update: ' + new Date());
						console.log(table.toString());

						resolve();
				});
			});
		};

}

const k = new krakenWatch();
k.init();
