
var rp      = require('request-promise'),
    fs      = require('fs'),
    cheerio = require('cheerio');

var json_data = {};

var state_abbrs = ['al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'kn', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy'];
var remaining = state_abbrs.length;

state_abbrs.forEach(function (state) {
  rp(generate_url(state))
    .then(function (data) {
      remaining--;

      var headings = [];
      json_data[state] = {};

      $ = cheerio.load(data);
      $('table table tr:nth-child(2) table tr').each(function () {
        var cells = $(this).find('td');

        // Ignore empty rows
        if (cells.first().text().trim() === '')     return;

        // Heading rows
        if (cells.first().text().trim() === 'Year') {
          headings = cells.map(function () {
            return $(this).text().trim();
          }).get();

          return;
        }

        // Create datapoint
        var year = cells.first().text().trim();
        json_data[state][year] = {};
        for (var i = 1; i < headings.length; i++) {
          json_data[state][year][headings[i]] = cells.eq(i).text().trim().replace(/,/g, '');
          if (i == 1 && json_data[state][year][headings[i]] < 10000) console.log(headings[i], state, year, json_data[state][year][headings[i]]);
        }
      });

      if (remaining == 0) {
        var data_filename = process.argv[2] || 'data.json';
        fs.writeFile(data_filename, JSON.stringify(json_data), function (err) {
          if (err) return console.log(err);
          console.log('Data saved in', data_filename);
        }); 
      }
    })
    .catch(function (e) {
      console.log('Error scraping', state, 'code', e.statusCode);
    })
});

function generate_url(a) {
  // The filename and data are different for these states
  var exceptions = ['nd', 'nm', 'ok', 'nj', 'ne', 'ms', 'nc', 'ks', 'mt', 'mo'];

  return (exceptions.indexOf(a) >= 0)
    ? 'http://www.disastercenter.com/crime/' + a + 'crimn.htm'
    : 'http://www.disastercenter.com/crime/' + a + 'crime.htm';
}
