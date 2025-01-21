import './config.js';
import './function/settings/settings.js';
import { fetchLatestBaileysVersion } from '@adiwajshing/baileys';
import cfont from 'cfonts';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { promises as fsPromises } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sizeFormatter } from 'human-readable';

import axios from 'axios';
import cheerio from 'cheerio';
import os from 'os';
import path from 'path';
import moment from 'moment-timezone';
import fs from 'fs';
import yargs from 'yargs';
import express from 'express'; // Import express
import chalk from 'chalk';

let formatSize = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: '2',
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
});

const { say } = cfont;
const { tz } = moment;
const port = process.env.PORT || 7860; // Set the port
const app = express(); // Initialize express app
const time = tz('Africa/Casablanca').format('HH:mm:ss');
const currentFilePath = new URL(import.meta.url).pathname;

// Add the new route
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const data = {
    status: 'true min',
    message: 'Kaoo is now running',
    author: 'ywxzyy',
  };
  const result = {
    response: data,
  };
  res.send(JSON.stringify(result, null, 2));
});

// Start the Express server
app.listen(port, '0.0.0.0', () => {
  console.log(chalk.green(`⚡ Port ${port} has opened`));
  console.log(`KONEKTED(\nListening on port ${port}`);
});

// Create the tmp folder if it doesn't exist
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
  const args = [join(dirname(currentFilePath), file), ...process.argv.slice(2)];
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });
  p.on('message', (data) => {
    console.log(chalk.magenta('[ ✅ Accepted  ]', data));
    switch (data) {
      case 'reset':
        p.process.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
    }
  });
  p.on('exit', (_, code) => {
    isRunning = false;
    console.error('[❗] Exit with code :', code);
    if (code !== 0) return start(file);
    watchFile(args[0], () => {
      unwatchFile(args[0]);
      start(file);
    });
  });

  let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
  if (!opts['test'])
    if (!rl.listenerCount())
      rl.on('line', (line) => {
        p.emit('message', line.trim());
      });

  const packageJsonPath = join(dirname(currentFilePath), './package.json');
  const pluginsFolder = join(dirname(currentFilePath), 'plugins');
  const totalFoldersAndFiles = await getTotalFoldersAndFiles(pluginsFolder);
  fs.readdir(pluginsFolder, async (err, files) => {
    if (err) {
      console.error(chalk.red(`Folder Plugins Error: ${err}`));
      return;
    }

    try {
      console.log(
        chalk.bgGreen(
          chalk.white(
            `Library Baileys Versi ${
              (await fetchLatestBaileysVersion()).version
            } Has been installed`
          )
        )
      );
    } catch (e) {
      console.error(chalk.bgRed(chalk.white('Baileys Library Not Installed')));
    }
  });

  try {
    const packageJsonData = await fsPromises.readFile(packageJsonPath, 'utf-8');
    const packageJsonObj = JSON.parse(packageJsonData);
    const { data } = await axios.get('https://api.ipify.org');
    const ramInGB = os.totalmem() / (1024 * 1024 * 1024);
    const freeRamInGB = os.freemem() / (1024 * 1024 * 1024);

    console.table({
      '⎔ Dashboard': ' System ⎔',
      'Name Bot': packageJsonObj.name,
      Version: packageJsonObj.version,
      Description: packageJsonObj.description,
      Os: os.type(),
      Memory: freeRamInGB.toFixed(2) + ' / ' + ramInGB.toFixed(2),
      IP: data,
      Owner: global.info.nomerown,
      feature: `${totalFoldersAndFiles.files} feature`,
      Creator: `NOUREDDINE`,
    });
  } catch (err) {
    console.error(chalk.red(`Cannot Read File package.json: ${err}`));
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
Starting the system
**/
start('main.js');
