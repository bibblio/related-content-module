"use strict";

var Bibblio = require('./js/bib-related-content.js');
var BibblioActivity = require('./js/bib-activity-tracker.js');

var accessToken = 'YOUR_ACCESS_TOKEN_HERE';
var contentItemId = '028db549-2f37-3113-bfa5-96faac152a03';
var catalogues = [];
var subtitleField = 'name';

Bibblio.getRelatedContentItems(accessToken, contentItemId, catalogues, subtitleField, function(results) {
  if (results instanceof Error) {
    console.error('Failed to retrieve recommendations, HTTP status code: ' + results.message);
  } else {
    console.log('Results:', results);
  }
});
