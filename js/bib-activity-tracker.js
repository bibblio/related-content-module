"use strict";

(function() {
  var isNodeJS = false;
  var XMLHttpRequestNodeJS = false;

  // support for NodeJS, which doesn't support XMLHttpRequest natively
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    isNodeJS = true;
    XMLHttpRequestNodeJS = require('xmlhttprequest').XMLHttpRequest;
  }

  var BibblioActivity = {
    track: function(activityData) {
      var requestBody = BibblioActivity.constructRequestBody(activityData);
      var httpClient = BibblioActivity.constructHttpClient();
      return httpClient.send(requestBody);
    },

    constructRequestBody: function(activityData) {
      return JSON.stringify(activityData);
    },

    constructHttpClient: function() {
      var url = "https://api.bibblio.org/v1/activities";
      var httpClient = (XMLHttpRequestNodeJS) ? new XMLHttpRequestNodeJS() : new XMLHttpRequest();
      httpClient.open("POST", url, false);
      httpClient.setRequestHeader('Content-Type', 'application/json');
      return httpClient;
    },

    constructActivityData: function(type, sourceContentItemId, clickedContentItemId, catalogueIds, relatedContentItems, instrument) {
      var activityData = {
          "type": type,
          "actor": {},
          "object": BibblioActivity.constructActivityObject(clickedContentItemId),
          "context": BibblioActivity.constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems),
          "instrument": BibblioActivity.constructActivityInstrument(instrument)
      };
      return activityData;
    },

    constructActivityInstrument: function(type, version, config) {
      return {
          "type": type,
          "version": version,
          "config": config
      };
    },

    constructActivityObject: function(clickedContentItemId) {
      return [["contentItemId", clickedContentItemId]];
    },

    constructActivityContext: function(sourceContentItemId, catalogueIds, relatedContentItems) {
      var context = [];
      var href = ((typeof window !== 'undefined') && window.location && window.location.href) ? window.location.href : '';

      context.push(["sourceHref", href]);
      context.push(["sourceContentItemId", sourceContentItemId]);
      context = _.reduce(relatedContentItems, function (context, contentItem) {
          context.push(["recommendations.contentItemId", contentItem.contentItemId]);
          return context;
      }, context);
      context = _.reduce(catalogueIds, function (context, catalogueId) {
          context.push(["recommendations.catalogueId", catalogueId]);
          return context;
      }, context);
      return context;
    },
  };

  if (isNodeJS) {
    module.exports = BibblioActivity;

  } else {
    window.BibblioActivity = BibblioActivity;
    window.bib_trackActivity = window.BibblioActivity.track; // backward compatibility
  }
})();
