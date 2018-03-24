
const fs = require('fs');
const request = require('request-promise-native');

const NOS_API_URL = 'https://lfverkiezingen2018rr.appspot.com/data/';
const BUILD_ID = '3i4bsa';

const SAVE_PATH = './raw_data/referendum_results.csv';

const MAX_NR = 100;

// let numbers = new Array(MAX_NR).fill(1).map((v, i) => i);

getReferendumResults = municipalityID => {

  let options = {
    uri: NOS_API_URL,
    qs: {
      code: municipalityID,
      config: BUILD_ID
    },
    json: true
  };

  return request(options);
}

getLineFromResult = result => {
  let id = result.cbs;
  let name = result.title;
  let province = result.provence;
  let updated = result.updated;

  let turnout = result.totals.attendance.now.count;
  let eligible = result.totals.voters.now.count;
  let percVoted = result.totals.attendance.now.perc;

  let votesFor = result.parties[0].now.count;
  let votesAgainst = result.parties[1].now.count;
  let votesBlanco = turnout - votesFor - votesAgainst;

  let percAgainst = result.parties[0].now.perc;
  let percFor = result.parties[1].now.perc;
  let percBlanco = (100.0 - percAgainst - percFor).toFixed(1);

  return [id, name, province, updated, eligible, turnout, percVoted, 
    votesFor, votesAgainst, votesBlanco, 
    percFor, percAgainst, percBlanco].join(';') + '\n';
}

scrapeResults = async () => {

  console.log("Scraping results of the referendum from the NOS...");

  // Get the IDs of the municipalities, as appointed by the CBS,
  // from the NOS API.
  let municipalityIDs = await getReferendumResults('local').then(
    results => results.map(result => result.cbs).filter(cbs => cbs)
  ).catch(error => {
    console.log(error);
  }); 

  // Make a new file stream to write to.
  let outputStream = fs.createWriteStream(SAVE_PATH);

  // Write CSV header.
  outputStream.write(['id','name','province','updated','eligible','turnout','turnout percentage',
    'votes for', 'votes against', 'none of the above', 
    'percentage for', 'percentage against', 'percentage NOTA'].join(';') + '\n');

  // Retrieve the results for each municipality and write
  // them to the stream.
  municipalityIDs.forEach(
    id => {
      getReferendumResults(id).then(
        result => {
          console.log(`- Retrieved results from ${result.title} (${result.cbs})`);
          let line = getLineFromResult(result);
          outputStream.write(line);
        }
      ).catch(
        error => console.log(error)
      );
    }
  )
}

scrapeResults();


