#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import Table from 'cli-table3';
import { format, differenceInSeconds, parse, addDays, isAfter } from 'date-fns';
import logUpdate from 'log-update';

const CITY = 'İzmir';
const COUNTRY = 'Turkey';
const METHOD = 13; // Diyanet

const HIJRI_MONTHS_TR = {
    1: 'Muharrem', 2: 'Safer', 3: 'Rebiülevvel', 4: 'Rebiülahir',
    5: 'Cemaziyelevvel', 6: 'Cemaziyelahir', 7: 'Recep', 8: 'Şaban',
    9: 'Ramazan', 10: 'Şevval', 11: 'Zilkade', 12: 'Zilhicce'
};

const MOSQUE_ASCII = `
          _  _
         ( )( )     ${chalk.yellow('🌙')}
  _ _ _  | || |  _ _ _
 | | | | | || | | | | |
 |     |_|    |_|     |
 |                    |
 |____________________|
`;

async function getPrayerTimes() {
    try {
        const response = await axios.get(`https://api.aladhan.com/v1/timingsByCity`, {
            params: {
                city: 'Izmir', // API doesn't like special chars usually
                country: 'Turkey',
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

async function main() {
    let data = await getPrayerTimes();

    setInterval(async () => {
        const newData = await getPrayerTimes();
        if (newData) data = newData;
    }, 3600000);

    const loop = () => {
        if (!data) {
            console.log(chalk.yellow('Veri yükleniyor...'));
            setTimeout(loop, 1000);
            return;
        }

        const now = new Date();
        const timings = data.timings;
        const hijri = data.date.hijri;
        const isRamadan = parseInt(hijri.month.number) === 9;

        const parseTime = (t) => parse(t, 'HH:mm', now);
        const times = {
            'İmsak': parseTime(timings.Imsak),
            'Güneş': parseTime(timings.Sunrise),
            'Öğle': parseTime(timings.Dhuhr),
            'İkindi': parseTime(timings.Asr),
            'Akşam': parseTime(timings.Maghrib),
            'Yatsı': parseTime(timings.Isha),
        };

        let targetPrayer = 'Akşam';
        let countdownLabel = 'Akşama Kalan';
        let targetTime = times['Akşam'];

        if (isRamadan) {
            if (isAfter(now, times['Akşam'])) {
                targetPrayer = 'İmsak';
                countdownLabel = 'Sahura Kalan';
                targetTime = addDays(times['İmsak'], 1);
            } else if (isAfter(now, times['İmsak'])) {
                targetPrayer = 'Akşam';
                countdownLabel = 'İftara Kalan';
                targetTime = times['Akşam'];
            } else {
                targetPrayer = 'İmsak';
                countdownLabel = 'Sahura Kalan';
                targetTime = times['İmsak'];
            }
        } else {
            if (isAfter(now, times['Akşam'])) {
                targetPrayer = 'İmsak';
                countdownLabel = 'Yarın İmsaka';
                targetTime = addDays(times['İmsak'], 1);
            }
        }

        const diffSeconds = differenceInSeconds(targetTime, now);
        const countdownStr = formatDuration(diffSeconds);

        let output = '\n';
        output += chalk.bold.hex('#A0A0A0')(`${CITY} - ${targetPrayer}`) + '\n';

        const bigTime = figlet.textSync(countdownStr, { font: 'Big' });
        output += gradient(['#E0E0E0', '#B0B0B0']).multiline(bigTime) + '\n';
        output += chalk.hex('#A0A0A0')(`${countdownLabel} ${countdownStr}\n\n`);

        const hijriMonth = HIJRI_MONTHS_TR[hijri.month.number] || hijri.month.en;
        const dateStr = `${hijri.day} ${hijriMonth} ${hijri.year}`;

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
            [c('İmsak', timings.Imsak), c('Güneş', timings.Sunrise), c('Öğle', timings.Dhuhr)],
            [c('İkindi', timings.Asr), c('Akşam', timings.Maghrib), c('Yatsı', timings.Isha)]
        );

        output += table.toString() + '\n';
        output += chalk.hex('#11c41d')(`\n
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

