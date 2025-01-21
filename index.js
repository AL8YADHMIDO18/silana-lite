import './config.js';
import './function/settings/settings.js';
import { fetchLatestBaileysVersion } from '@adiwajshing/baileys';
import cfont from "cfonts";
import { spawn } from 'child_process';
import { createInterface } from "readline";
import { promises as fsPromises } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sizeFormatter } from 'human-readable';

import axios from 'axios';
import cheerio from "cheerio";
import os from 'os';
import moment from 'moment-timezone';
import fs from 'fs';
import yargs from "yargs";
import express from 'express';
import chalk from 'chalk';

// Format file size
let formatSize = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: '2',
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`
});

const { say } = cfont;
const { tz } = moment;

// Express server setup
const app = express();
const port = process.env.PORT || 7860;

// Middleware for JSON parsing
app.use(express.json());

// Define an endpoint for the bot to communicate
app.post('/api/message', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }
    console.log(chalk.green(`[BOT MESSAGE RECEIVED]: ${message}`));
    // Simulate bot response
    const botResponse = `You sent: ${message}`;
    res.json({ response: botResponse });
});

// Start Express server
app.listen(port, () => {
    console.log(chalk.green(`⚡ Express server running on port ${port}`));
});

// CLI output
say('Bot Initialized', {
    font: "block",
    align: "center",
    gradient: ["yellow", "cyan", "red"],
    transitionGradient: true,
});
say('by Noureddine', {
    font: "tiny",
    align: "center",
    colors: ["white"]
});

// Initialize bot logic
const folderPath = './tmp';
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    console.log(chalk.green('tmp folder created successfully.'));
}

let isRunning = false;

const rl = createInterface(process.stdin, process.stdout);

async function start(file) {
    if (isRunning) return;
    isRunning = true;

    const currentFilePath = new URL(import.meta.url).pathname;
    const args = [join(dirname(currentFilePath), file), ...process.argv.slice(2)];
    const p = spawn(process.argv[0], args, { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });

    p.on("message", data => {
        console.log(chalk.magenta("[ ✅ Accepted  ]", data));
        switch (data) {
            case "reset":
                p.process.kill();
                isRunning = false;
                start.apply(this, arguments);
                break;
            case "uptime":
                p.send(process.uptime());
                break;
        }
    });

    p.on("exit", (_, code) => {
        isRunning = false;
        console.error("[❗] Exit with code:", code);
        if (code !== 0) return start(file);
        watchFile(args[0], () => {
            unwatchFile(args[0]);
            start(file);
        });
    });

    const opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
    if (!opts["test"] && !rl.listenerCount()) {
        rl.on("line", line => {
            p.emit("message", line.trim());
        });
    }

    const packageJsonPath = join(dirname(currentFilePath), './package.json');
    const pluginsFolder = join(dirname(currentFilePath), 'plugins');
    const totalFoldersAndFiles = await getTotalFoldersAndFiles(pluginsFolder);

    try {
        console.log(chalk.bgGreen(chalk.white(`Library Baileys Version ${(await fetchLatestBaileysVersion()).version} has been installed`)));
    } catch (e) {
        console.error(chalk.bgRed(chalk.white('Baileys library not installed')));
    }

    try {
        const packageJsonData = await fsPromises.readFile(packageJsonPath, 'utf-8');
        const packageJsonObj = JSON.parse(packageJsonData);
        const { data: ip } = await axios.get('https://api.ipify.org');
        const ramInGB = os.totalmem() / (1024 * 1024 * 1024);
        const freeRamInGB = os.freemem() / (1024 * 1024 * 1024);

        console.table({
            "⎔ Dashboard": " System ⎔",
            "Name Bot": packageJsonObj.name,
            "Version": packageJsonObj.version,
            "Description": packageJsonObj.description,
            "Os": os.type(),
            "Memory": `${freeRamInGB.toFixed(2)} / ${ramInGB.toFixed(2)} GB`,
            "IP": ip,
            "Owner": global.info.nomerown,
            "Feature": `${totalFoldersAndFiles.files} feature(s)`,
            "Creator": `NOUREDDINE`
        });
    } catch (err) {
        console.error(chalk.red(`Cannot read file package.json: ${err}`));
    }

    setInterval(() => {}, 1000);
}

function getTotalFoldersAndFiles(folderPath) {
    return new Promise((resolve, reject) => {
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                let folders = 0;
                let filesCount = 0;
                files.forEach((file) => {
                    const filePath = join(folderPath, file);
                    if (fs.statSync(filePath).isDirectory()) {
                        folders++;
                    } else {
                        filesCount++;
                    }
                });
                resolve({ folders, files: filesCount });
            }
        });
    });
}

/**
 * Starting the system
 */
start('main.js');
