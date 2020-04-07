const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const dateFormat = require('dateformat');
const XLSX = require('xlsx');
const fs = require('fs');
const http = require('http');
const BASE_REPO_PATH = `${__dirname}/../`;
const simpleGit = require('simple-git')(BASE_REPO_PATH);
const R = require('ramda');
const { spawnSync } = require( 'child_process' );

const excelFilePath = 'src/assets/table.xlsx';
const excelRelativeFilePath = `${BASE_REPO_PATH}${excelFilePath}`;
const dbPath = `${BASE_REPO_PATH}src/assets/db.json`;

/**
 * Init lowDB for saving JSON data
 * */
const adapter = new FileSync(dbPath);
const db = low(adapter);
db.defaults({coronaBWHistory: [], count: 0}).write();

class DataParser {
  constructor() {
    this.latestData = this.getCurrentData();
  }

  getCurrentData() {
    let currentDataRaw = fs.readFileSync(dbPath);
    return JSON.parse(currentDataRaw);
  }

  startPoller() {
    try {
      const oneHour = 60 * 60 * 1000;
      setInterval(() => {
        this.updateDataSource();
      }, oneHour);
    } catch (error) {
      console.log('Error when parsing xlsx', error);
    }
  }

  async updateDataSource() {
    const excelDownloadUrl = 'http://sozialministerium.baden-wuerttemberg.de/fileadmin/redaktion/m-sm/intern/downloads/Downloads_Gesundheitsschutz/Tabelle_Coronavirus-Faelle-BW.xlsx';
    const file = fs.createWriteStream(excelRelativeFilePath);

    http.get(excelDownloadUrl, (response) => {
      response.pipe(file);
      simpleGit.diff([excelFilePath], (err, fileChanged) => {
        if (fileChanged) {
          this.parseExcel();
          this.deployToGithubPage();
        }
      });
    });
  }

  deployToGithubPage() {
    const currentData = this.getCurrentData();
    if (!R.equals(this.latestData, currentData)) {
      console.log('Data changed, publish to github page.', new Date());
      this.latestData = currentData;

      const ls = spawnSync('npm.cmd', ['run', 'deploy']);

      console.log( `Deploy stderr: ${ls.stderr.toString()}` );
      console.log( `Deploy stdout: ${ls.stdout.toString()}` );
    } else {
      console.log('Data unchanged', new Date());
    }
  }

  parseExcel() {
    let regionListRaw = fs.readFileSync(`${BASE_REPO_PATH}/script/regionList.json`);
    let regionList = JSON.parse(regionListRaw);

    const date = new Date();
    const dateNow = dateFormat(date, "dd-mm-yyyy");

    const workBook = XLSX.readFile(excelRelativeFilePath);
    const regionData = workBook.Sheets[workBook.SheetNames[0]];

    const columnCombination = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
    const columnHeader = columnCombination.split('');

    let loop = 0;
    while (loop < 10) {
      loop = loop + 1;
      const baseString = columnCombination.substring(0, loop);
      columnCombination.split('').forEach(col => {
        columnHeader.push(`${baseString}${col}`);
      });
    }

    db.get('coronaBWHistory').remove().write();
    columnHeader.forEach(col => {
      let dateCol = regionData[`${col}7`];
      if (dateCol && dateCol.w) {
        const date = new Date(dateCol.w);
        for (let i = 8; i <= 51; i++) {
          const regionName = regionData[`A${i}`];
          const numberOfCases = regionData[`${col}${i}`];
          const region = regionList.find(reg => reg.name === regionName.v);
          const numberOfCasesVal = numberOfCases ? numberOfCases.v : 0;
          const data = {
            date: dateFormat(date, "dd-mm-yyyy"),
            data: {
              id: region.id,
              name: region.name,
              number_of_cases: numberOfCasesVal
            }
          };
          db.get('coronaBWHistory').push(data).write();
        }
      }
    });
  }
}

const dataParser = new DataParser();
dataParser.startPoller();
