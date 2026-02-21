#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import Table from 'cli-table3';
import { differenceInSeconds, parse, addDays, isAfter } from 'date-fns';
import logUpdate from 'log-update';
import Conf from 'conf';
import prompts from 'prompts';
import readline from 'readline';

const FONTS = [
    'Modular', 'Big', 'Shadow', 'Tmplr', 'Cricket', 'Graceful', 'Shimrod', 'Mono 9', 'Graffiti', 'Morse', 'Slant', 'Banner3', 'Banner4', 'Henry 3D', 'Basic', 'Small Block', 'Nancyj-Fancy', 'Small Mono 9', 'Invita'
];

let currentFontIndex = FONTS.indexOf('Big');
if (currentFontIndex === -1) currentFontIndex = 0;

const METHOD = 13; // Diyanet

const config = new Conf({ projectName: 'namaz-cli' });


async function getPrayerTimes(city, country) {
    try {
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity`, {
            params: {
                city: city,
                country: country,
                method: METHOD
            }
        });
        return response.data.data;
    } catch (error) {
        return null;
    }
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function setupConfig() {
    let savedCity = config.get('city');
    let savedCountry = config.get('country');

    if (process.argv.includes('--reset')) {
        config.clear();
        savedCity = null;
        savedCountry = null;
    }

    if (!savedCity || !savedCountry) {
        console.log(chalk.green('Namaz CLI İlk Kurulum\n'));
        const response = await prompts([
            {
                type: 'text',
                name: 'country',
                message: 'Hangi ülkede yaşıyorsunuz? (Örn: Turkey, Germany)',
                initial: 'Turkey'
            },
            {
                type: 'text',
                name: 'city',
                message: 'Hangi şehirde yaşıyorsunuz? (İngilizce karakter, örn: Izmir, Istanbul, Berlin)',
                initial: 'Istanbul'
            }
        ]);

        if (!response.city || !response.country) {
            console.log(chalk.red('Kurulum iptal edildi.'));
            process.exit(1);
        }

        config.set('city', response.city);
        config.set('country', response.country);

        savedCity = response.city;
        savedCountry = response.country;
        console.log('\n');
    }

    return { city: savedCity, country: savedCountry };
}

async function main() {
    const { city, country } = await setupConfig();

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        }
        if (str && str.toLowerCase() === 'f') {
            currentFontIndex = (currentFontIndex + 1) % FONTS.length;
            // Immediate re-render isn't strictly necessary as the interval runs every second,
            // but logUpdate will refresh naturally within <= 1000ms.
        }
    });

    let data = await getPrayerTimes(city, country);

    setInterval(async () => {
        const newData = await getPrayerTimes(city, country);
        if (newData) data = newData;
    }, 3600000);

    const loop = () => {
        if (!data) {
            logUpdate(chalk.yellow('Veri yükleniyor veya ağ hatası. Lütfen bekleyin...'));
            setTimeout(loop, 1000);
            return;
        }

        const now = new Date();
        const timings = data.timings;
        const hijri = data.date.hijri;
        const isRamadan = parseInt(hijri.month.number) === 9;

        const parseTime = (t) => parse(t, 'HH:mm', now);
        const times = {
            'İmsak': parseTime(timings.Fajr),
            'Güneş': parseTime(timings.Sunrise),
            'Öğle': parseTime(timings.Dhuhr),
            'İkindi': parseTime(timings.Asr),
            'Akşam': parseTime(timings.Maghrib),
            'Yatsı': parseTime(timings.Isha),
        };

        let nextPrayerName = 'İmsak';
        let nextPrayerTime = addDays(times['İmsak'], 1);

        const prayerNames = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
        for (const name of prayerNames) {
            if (isAfter(times[name], now)) {
                nextPrayerName = name;
                nextPrayerTime = times[name];
                break;
            }
        }

        let ramadanLabel = null;
        let ramadanTime = null;

        if (isRamadan) {
            if (isAfter(now, times['Akşam'])) {
                ramadanLabel = 'Sahura Kalan';
                ramadanTime = addDays(times['İmsak'], 1);
            } else if (isAfter(now, times['İmsak'])) {
                ramadanLabel = 'İftara Kalan';
                ramadanTime = times['Akşam'];
            } else {
                ramadanLabel = 'Sahura Kalan';
                ramadanTime = times['İmsak'];
            }
        }

        const nextPrayerDiff = differenceInSeconds(nextPrayerTime, now);
        const nextPrayerCountdownStr = formatDuration(nextPrayerDiff);

        let output = '\n';

        // Capitalize for display
        const displayCity = city.charAt(0).toUpperCase() + city.slice(1);
        output += chalk.bold.hex('#A0A0A0')(`${displayCity} - ${nextPrayerName}`) + chalk.dim(` [Font: ${FONTS[currentFontIndex]}]`) + '\n';

        let bigTimeText = '';
        try {
            bigTimeText = figlet.textSync(nextPrayerCountdownStr, { font: FONTS[currentFontIndex] });
        } catch (err) {
            bigTimeText = figlet.textSync(nextPrayerCountdownStr, { font: 'Big' }); // fallback
        }
        const bigTime = bigTimeText;
        output += gradient(['#1980A9', '#F38B94']).multiline(bigTime) + '\n';

        if (isRamadan) {
            const ramadanDiff = differenceInSeconds(ramadanTime, now);
            const ramadanCountdownStr = formatDuration(ramadanDiff);
            output += chalk.hex('#A0A0A0')(`${ramadanLabel} ${ramadanCountdownStr}\n\n`);
        } else {
            output += '\n\n';
        }

        const table = new Table({
            colWidths: [18, 18, 18],
            chars: {
                'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐'
                , 'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘'
                , 'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼'
                , 'right': '│', 'right-mid': '┤', 'middle': '│'
            },
            style: { 'padding-left': 1, 'padding-right': 1 }
        });

        const c = (name, time) => `${chalk.gray(name.padEnd(7))} ${chalk.white.bold(time)}`;

        table.push(
            [c('İmsak', timings.Fajr), c('Güneş', timings.Sunrise), c('Öğle', timings.Dhuhr)],
            [c('İkindi', timings.Asr), c('Akşam', timings.Maghrib), c('Yatsı', timings.Isha)]
        );

        output += table.toString() + '\n';
        output += gradient(['#E0E0E0', '#1980A9', '#F38B94']).multiline(`\n
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⠿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟⠛⢻⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡟⠛⢻⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⡀⠀⠀⠀⠀⠀⠀⡇⠉⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡏⠉⢹⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⣰⣧⠀⠀⠀⠀⠀⢀⣇⣀⣸⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣇⣀⣸⡀⠀⠀⠀⠀⠀⣴⣦⠀
⠈⣿⣾⠇⠀⠀⠀⠀⠈⡟⠛⠛⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣶⣿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠛⠛⢻⠁⠀⠀⠀⠀⠠⣷⣾⠃
⠀⡿⠿⠀⠀⠀⠀⠀⠀⣇⠶⡄⡇⠀⠀⠀⠀⡧⠀⠀⠀⠀⠀⣠⠚⢡⠃⠀⠘⡌⠓⢄⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⢸⢠⣶⣼⠀⠀⠀⠀⠀⠀⡿⢿⠀
⠀⣧⣴⠀⠀⠀⠀⠀⠀⡇⠓⠃⡇⠀⠀⠀⣰⣿⡄⠀⠀⢠⡏⠀⡰⠃⠀⠀⠀⠘⢆⠀⠱⡄⠀⠀⢠⣞⣆⠀⠀⠀⢸⠘⠚⢻⠀⠀⠀⠀⠀⠀⣧⣼⠀
⠀⡿⠿⠀⠀⠀⠀⠀⢀⣇⣀⣀⣇⢀⡠⢚⡝⠉⢯⡢⣄⢈⠀⠀⡇⠀⠀⠀⠀⠀⢸⠀⠀⡱⣀⠔⡿⠉⠹⡑⢄⡀⣸⣀⣀⣸⡀⠀⠀⠀⠀⠀⡿⢿⠀
⢀⣇⣠⡀⠀⠀⡄⠀⠘⠿⠿⠿⠟⡌⠀⡏⠀⠀⠀⢡⠈⣿⣖⣒⣛⣒⣒⣒⣒⣒⣛⣒⣲⣿⠃⠈⠀⠀⠀⢹⠀⢱⢻⠿⠿⠿⡏⠀⠀⠀⠀⢀⣇⣸⡀
⠀⡿⢿⠀⣸⠿⡿⢿⠀⣸⣙⣿⠁⡏⠉⠉⠉⠉⠉⠉⠉⢹⠾⠗⠛⠻⠛⠗⠻⠿⠾⠗⠷⡏⠉⠉⠉⠉⠉⠉⠉⢹⢸⣳⣿⡟⡇⣿⠿⠿⣷⠀⠻⠿⠀
⢠⣧⣤⣄⣼⣾⣿⢸⠀⢸⠛⠛⡀⡇⠀⢀⣴⣶⣤⡀⠀⢸⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⢀⣠⡾⣦⡀⠀⢸⢸⠘⠛⠃⡇⡷⣿⣷⢻⢠⣦⣴⡄
⠀⠿⠼⠿⠤⠤⠤⠤⠤⠤⠤⠤⠤⠧⠤⠤⠤⠤⠤⠧⠤⠼⠼⠤⠤⠧⠧⠤⠼⠼⠤⠤⠷⠧⠤⠼⠤⠤⠤⠼⠤⠼⠤⠤⠤⠤⠤⠤⠤⠤⠤⠿⠧⠼⠇`);

        logUpdate(output);

        setTimeout(loop, 1000);
    };

    loop();
}

main();

