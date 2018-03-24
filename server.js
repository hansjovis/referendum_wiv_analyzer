
const fs = require('fs');
const request = require('request-promise-native');

const NOS_API_URL = 'https://lfverkiezingen2018rr.appspot.com/data/';
const BUILD_ID = '3i4bsa';

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
  let provence = result.provence;
  let updated = result.updated;

  let voters = result.totals.attendance.now.count;
  let eligible = result.totals.voters.now.count;
  let percVoted = result.totals.attendance.now.perc;

  let votesFor = result.parties[0].now.count;
  let votesAgainst = result.parties[1].now.count;
  let votesBlanco = voters - votesFor - votesAgainst;

  let percAgainst = result.parties[0].now.perc;
  let percFor = result.parties[1].now.perc;
  let percBlanco = (100.0 - percAgainst - percFor).toFixed(1);

  return [id, name, provence, updated, eligible, voters, percVoted, 
    votesFor, votesAgainst, votesBlanco, 
    percAgainst, percFor, percBlanco].join(',');
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

  // Gather the list of referendum results for each municipality.
  let promises = Promise.all(municipalityIDs.map(id => getReferendumResults(id)));

  // Parse each result to a line of comma-separated values.
  return promises.then(results => {
    return results.map(result => {
      return getLineFromResult(result);
    });
  }).catch(error => console.error(error));
  
  // return await municipalityIDs.map(async id => {
  //   let result = await getReferendumResults(id);
  //   return getLineFromResult(result);  
  // });
}

scrapeResults().then(
  lines => {
    lines.forEach(line => console.log(line));
  }
);


