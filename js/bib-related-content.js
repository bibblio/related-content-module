"use strict";

(function() {
  var isNodeJS = false;

  // support for NodeJS, which doesn't support XMLHttpRequest natively
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    isNodeJS = true;
  }

  // Bibblio module
  var Bibblio = {
    moduleVersion: "4.0.1",
    moduleTracking: {},
    isAmp: false,

    showModules: function() {
      var modules = document.getElementsByClassName("bib__module");
      [].forEach.call(modules, function(element) {
        element.classList.remove("bib--hide");
      });
    },

    initRelatedContent: function(options, callbacks) {
      var callbacks = callbacks || {};
      // Validate the values of the related content module options
      if (!BibblioUtils.validateModuleOptions(options)) return;
      var moduleOptions = BibblioUtils.prepareModuleOptions(options)
      Bibblio.getRelatedContentItems(moduleOptions, callbacks);
    },

    getRelatedContentItems: function(options, callbacks) {
      var moduleSettings = BibblioUtils.getModuleSettings(options);
      var subtitleField = moduleSettings.subtitleField;
      var accessToken = options.recommendationKey;
      // URL arguments should be injected but the module only supports these settings now anyway.
      var fields = BibblioUtils.getRecommendationFields(subtitleField);
      var url = BibblioUtils.getRecommendationUrl(options, 6, 1, fields);
      BibblioUtils.bibblioHttpGetRequest(url, accessToken, true, function(response, status) {
        Bibblio.handleRecsResponse(options, callbacks, response, status);
      });
    },

    handleRecsResponse: function(options, callbacks, recommendationsResponse, status) {
      if(options.autoIngestion) {
        if(status === 404) { // this will always be returned before a 402 (if the item doesn to exist)
          // content item has not been ingested yet
          Bibblio.createScrapeRequest(options);
        }
      }

      if(status === 200) {
        // recommendations have been returned
        Bibblio.renderModule(options, callbacks, recommendationsResponse);
      }
      else if(status === 412) {
        // content item does not have recommendations yet
        console.info("Bibblio: Awaiting indexing. This delay will only occur until some click events have been processed. Recommendations will thereafter be available immediately on ingestion.");
      }
    },

    createScrapeRequest: function(options) {
      var href;

      if(options.autoIngestionUrl) {
        href = options.autoIngestionUrl;
      } else {
        href = ((typeof window !== 'undefined') && window.location && window.location.href) ? window.location.href : '';
      }

      if(!options.customUniqueIdentifier) {
        return;
      }

      if (!href) {
        console.error("Bibblio: Cannot determine url to scrape.");
        return false;
      } else {
        href = BibblioUtils.stripUrlTrackingParameters(href);
      }

      var accessToken = options.recommendationKey;
      var scrapeRequest = {
        customUniqueIdentifier: options.customUniqueIdentifier,
        url: href
      };

      if (options.autoIngestionCatalogueId) {
        scrapeRequest.catalogueId = options.autoIngestionCatalogueId;
      }

      if (options.autoIngestionCustomCatalogueId) {
        scrapeRequest.customCatalogueId = options.autoIngestionCustomCatalogueId;
      }

      var url = "https://api.bibblio.org/v1/content-item-url-ingestions/";

      BibblioUtils.bibblioHttpPostRequest(url, accessToken, scrapeRequest, true, function(response, status) {
        Bibblio.handleCreatedScrapeRequest(response, status, options);
      });
    },

    handleCreatedScrapeRequest: function(response, status, options) {
      if (status == 422 && response.errors.url == "domain is not whitelisted") {
        console.error("Bibblio: This page could not be ingested because the domain has not been whitelisted for auto ingestion.");
      }
      else if (status == 422 && response.errors.customUniqueIdentifier == "customUniqueIdentifier must be unique or null") {
        console.info("Bibblio: This page has been queued for ingestion. Please note that a 404 response to GET /recommendations is normal. This tells us that the item does not exist and should be ingested. The 422 on POST /url-ingestions is also normal. It tells us that the item has already been queued for ingestion by a prior page load.");
      }
      else if (status == 201) {
        console.info("Bibblio: This page has been queued for ingestion. Please note that a 404 response to GET /recommendations is normal. This tells us that the item does not exist and should be ingested.");
      }
    },

    renderModule: function(options, callbacks, recommendationsResponse) {
      var relatedContentItems = recommendationsResponse.results;
      var moduleSettings = BibblioUtils.getModuleSettings(options);
      var relatedContentItemContainer = options.targetElement;
      var moduleHTML = BibblioTemplates.getModuleHTML(relatedContentItems, options, moduleSettings);
      relatedContentItemContainer.innerHTML = moduleHTML;

      if(callbacks.onRecommendationsRendered) {
        try {
          callbacks.onRecommendationsRendered(relatedContentItems);
        }
        catch(err) {
          console.error(err);
        }
      }

      Bibblio.initTracking(options, callbacks, recommendationsResponse);
    },

    initTracking: function(options, callbacks, recommendationsResponse) {
      var trackingLink = recommendationsResponse._links.tracking.href;
      var activityId = BibblioUtils.getActivityId(trackingLink);
      BibblioUtils.createModuleTrackingEntry(activityId);
      BibblioUtils.bindContentItemsClickEvents(options, callbacks, recommendationsResponse);
      BibblioUtils.setOnViewedListeners(options, callbacks, recommendationsResponse);
    }
  };

  // Bibblio utility module
  var BibblioUtils = {
    /// Init module functions
    validateModuleOptions: function(options) {

      if(!options.recommendationKey) {
        console.error("Bibblio: Please provide a recommendation key for the recommendationKey value in the options parameter.");
        return false;
      }

       if(options.autoIngestion && options.recommendationType === "popular") {
        console.error("Bibblio: auto-ingestion cannot be enabled on a module serving popular recommendations. Please auto-ingest with a module serving 'optimised' or 'related' recommendations instead.");
        return false;
       }

      if(!options.contentItemId && !options.customUniqueIdentifier && !options.autoIngestion  && options.recommendationType != "popular") {
        console.error("Bibblio: Please provide a contentItemId or a customUniqueIdentifier in the options parameter.");
        return false;
      }

      if(options.contentItemId && options.customUniqueIdentifier) {
        console.error("Bibblio: Cannot supply both contentItemId and customUniqueIdentifier.");
        return false;
      }

      if(options.customUniqueIdentifier && !BibblioUtils.validateCustomUniqueIdentifier(options.customUniqueIdentifier)){
        console.error("Exception: Cannot supply a URL as a customUniqueIdentifier. Please see https://github.com/bibblio/related-content-module#customuniqueidentifier-required-if-no-contentitemid-is-provided on how to specify a customUniqueIdentifier, or see https://support.google.com/webmasters/answer/139066?hl=en to add a canonical URL tag.");
        return false;
      }

      if(!options.targetElementId && !options.targetElement) {
        console.error("Bibblio: Please provide a value for targetElementId in the options parameter.");
        return false;
      }

      if((options.recommendationType === "popular") && (options.contentItemId || options.customUniqueIdentifier)) {
        console.error("Bibblio: Cannot supply a contentItemId or customUniqueIdentifier when specifying a recommendationType of 'popular'.");
        return false;
      }

      if(options.catalogueIds && options.customCatalogueIds) {
        console.error("Bibblio: Cannot supply both catalogueIds and customCatalogueIds.");
        return false;
      }

      if(options.autoIngestionCatalogueId && options.autoIngestionCustomCatalogueId) {
        console.error("Bibblio: Cannot supply both autoIngestionCatalogueId and autoIngestionCustomCatalogueId.");
        return false;
      }

      return true;
    },

    getParameterByName: function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

    convertCommasToSpaces: function(str) {
      if (!str) return null;
      var styleClasses = str.replace(/,/g, " ");
      return styleClasses;
    },

    createParamsObj: function(url) {
      var queryStringParams = url.split('?')[1];
      var cleanParams = queryStringParams.split(/&/g);
      var params = {};

      for(param in cleanParams) {
        var param = cleanParams[param];
        var key = param.split('=')[0];
        var value = param.split('=')[1];

        if(value.indexOf('#') > -1){
          var cleanedValue = value.split('#')[0];
          params[key] = cleanedValue;
        }else{
          params[key] = value;
        };
      };

      return params;
    },

    createQueryStringObj: function(params, options) {
      var diffArray = Object.keys(params).filter(function (k) {
        return params[k] !== options[k]
      });

      var diffObject = Object.assign({}, diffArray);

      var queryStringObj = {};
      if(Object.keys(diffObject).length > -1) {
        for(var key = 0; key < Object.keys(diffObject).length; key++) {
          var param = diffObject[key];
          queryStringObj[param] = params[param];
        }
      };
      return queryStringObj;
    },

    prepareModuleOptions: function(options) {
      if (options && !options.contentItemId && !options.customUniqueIdentifier && options.autoIngestion && options.recommendationType !== "popular")
        options.customUniqueIdentifier = BibblioUtils.getCustomUniqueIdentifierFromUrl(options);

      if (options && options.targetElementId && !options.targetElement)
        options.targetElement = document.getElementById(options.targetElementId);

      return options;
    },

    /// Auto initialise params functions

    getAllowedKeys: function() {
      return [
        "amp",
        "autoIngestion",
        "autoIngestionCatalogueId",
        "autoIngestionCustomCatalogueId",
        "catalogueIds",
        "customCatalogueIds",
        "contentItemId",
        "customUniqueIdentifier",
        "dateFormat",
        "hidden",
        "queryStringParams",
        "recommendationKey",
        "recommendationType",
        "styleClasses",
        "stylePreset",
        "subtitleField",
        "targetElementId",
        "truncateTitle",
        "userId"
      ];
    },

    autoInit: function() {
      var url = window.location.href;
      Bibblio.isAmp = BibblioUtils.isInUrl(url, '#amp=1');
      var params = [];
      var callbacks = {};
    
      if(Bibblio.isAmp) {
        params = BibblioUtils.getAmpAutoInitParams(url)
        callbacks = BibblioUtils.getAmpCallbacks();
      } else {
        params = BibblioUtils.getParams();
      }
      
      params.forEach(function(options) {
        Bibblio.initRelatedContent(options, callbacks);
      });
    },

    getAmpAutoInitParams: function(url) {
      var params = [];
      var targetElement = BibblioUtils.findInitElements()[0];
      if (targetElement) {
        var ampOptions = BibblioUtils.getAmpOptions(url);
        ampOptions.autoIngestionUrl = document.referrer;
        ampOptions.targetElement = targetElement;
        params.push(ampOptions);
      }
      return params;
    },

    getParams: function() {
      var elements = BibblioUtils.findInitElements();
      var params = BibblioUtils.elementsToInitParams(elements);
      return params;
    },

    findInitElements: function() {
      return document.getElementsByClassName("bib--rcm-init");
    },

    handleNodeData: function(key, value) {
      // Transform queryStringParameters into object
      if(key == "queryStringParams") {
        var queryStringParameters = {};
        var pairs = value.split("&");

        // Append each key value pair to queryStringParameters object
        pairs.forEach(function(pair) {
          var keyValueTuple = pair.split("=");
          queryStringParameters[keyValueTuple[0]] = keyValueTuple[1];
        })

        // Return custom object value for query string parameters
        return queryStringParameters;
      }

      // Handle booleans
      if(value === "true")  return true;
      if(value === "false") return false;

      return value;
    },

    elementsToInitParams: function(nodeList) {
      var allowedKeys = BibblioUtils.getAllowedKeys();

      // Construct new objects with only the allowed keys from each node's dataset
      var initParams = [];
      for (var i = 0, len = nodeList.length; i < len; i++) {
        var node = nodeList[i];
        var dataset = node.dataset;
        initParams.push(
          allowedKeys.reduce(function(acc, key) {
            if (dataset[key]) {
              acc[key] = BibblioUtils.handleNodeData(key, dataset[key]);
            }

            return acc;
          }, {targetElement: node})
        );
      }

      return initParams;
    },

    getAmpOptions: function(url) {
      var allowedKeys = BibblioUtils.getAllowedKeys();
      var options = {};

      //create options object from amp query string
      for (var index in allowedKeys) {
        var name = allowedKeys[index]
        var queryParam = BibblioUtils.getParameterByName(name, url);
        //Change boolean string to booleans
        queryParam = queryParam === "false" ? false : queryParam;
        queryParam = queryParam === "true" ? true : queryParam;
        //If style related param, replace commas with spaces
        if (name == 'styleClasses' || name == 'stylePreset') {
          queryParam = BibblioUtils.convertCommasToSpaces(queryParam);
        }
        //Append query param to options
        if (queryParam != null) {
          options[name] = queryParam;
        }
      }

      //set query string params
      options["queryStringParams"] = BibblioUtils.getQueryStringParams(options, url);
      //set target element
      options["targetElementId"] = "bibRelatedContentModule";

      return options;
    },

    submitAmpEmbedSize: function(h, w) {
      window.parent.postMessage({
        sentinel: 'amp',
        type: 'embed-size',
        height: h,
        width: w
      }, '*');
    },

    getAmpCallbacks: function() {
      var callbacks = {
        onRecommendationsRendered: function(recsData) {
          BibblioUtils.submitAmpEmbedSize(document.body.scrollHeight, document.body.scrollWidth);

          window.parent.postMessage({
            sentinel: 'amp',
            type: 'embed-ready'
          }, '*');

          // this event is currently not being issued by the browser. This code is left here in hope that it will one day
          window.addEventListener("orientationchange", function() {
            BibblioUtils.submitAmpEmbedSize(document.body.scrollHeight, document.body.scrollWidth);
          }, false);
        }
      };

      return callbacks;
    },

    /// Get recommendations functions
    getRecommendationFields: function(subtitleField) {
      var fields = ["name", "url", "moduleImage", "datePublished", "author"];
      if(subtitleField)
        fields.push(BibblioUtils.getRootProperty(subtitleField));
      return fields;
    },

    getRecommendationUrl: function(options, limit, page, fields) {
      var baseUrl = "https://api.bibblio.org/v1";
      var recommendationType = (options.recommendationType) ? options.recommendationType : null;
      var catalogueIds = options.catalogueIds ? options.catalogueIds : [];
      var customCatalogueIds = options.customCatalogueIds ? options.customCatalogueIds : [];
      var userId = options.userId;
      var querystringArgs = [
          "limit=" + limit,
          "page=" + page,
          "fields=" + fields.join(",")
      ];

      // Add identifier query param depending on if they supplied the uniqueCustomIdentifier or contentItemId
      var identifierQueryArg = null;

      if(options.contentItemId)
        querystringArgs.push("contentItemId=" + options.contentItemId);
      else if(options.customUniqueIdentifier)
        querystringArgs.push("customUniqueIdentifier=" + options.customUniqueIdentifier);

      if (catalogueIds.length > 0) {
          querystringArgs.push("catalogueIds=" + catalogueIds.join(","));
      }

      if (customCatalogueIds.length > 0) {
        querystringArgs.push("customCatalogueIds=" + customCatalogueIds.join(","));
      }

      if (userId) {
          querystringArgs.push("userId=" + userId);
      }

      switch (recommendationType) {
          case "related" :
              return baseUrl + "/recommendations/related?" + querystringArgs.join("&");
          case "popular" :
              return baseUrl + "/recommendations/popular?" + querystringArgs.join("&");
          default :
              return baseUrl + "/recommendations?" + querystringArgs.join("&");
      }
    },

    getParameterByName: function(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    },

    createParamsObj: function(url) {
      var queryStringParams = url.split('?')[1];
      var cleanParams = queryStringParams.split(/&/g);
      var params = {};

      for (param in cleanParams) {
        var param = cleanParams[param];
        var key = param.split('=')[0];
        var value = param.split('=')[1];

        if (value.indexOf('#') > -1) {
          var cleanedValue = value.split('#')[0];
          params[key] = cleanedValue;
        } else {
          params[key] = value;
        };
      };

      return params;
    },

    createQueryStringObj: function(params, options) {
      var diffArray = Object.keys(params).filter(function(k) { return params[k] !== options[k] }) ;
      var queryStringObj = {};
      if (diffArray.length > 0) {
        for (var key = 0; key < diffArray.length; key++) {
          var param = diffArray[key];
          queryStringObj[param] = params[param]
        }
      };
      return queryStringObj;
    },

    getQueryStringParams: function(options, url) {
      if (url.indexOf("?") !== -1) {
        var params = BibblioUtils.createParamsObj(url);
        params.styleClasses = options.styleClasses;
        params.stylePreset = options.stylePreset;
        return BibblioUtils.createQueryStringObj(params, options);
      } else {
        return {};
      }
    },

    isInUrl: function(url, string) {
      var hasString = url.includes(string);
      return hasString;
    },

    /// Auto ingestion functions
    stripUrlTrackingParameters: function(url) {
      var parser = document.createElement('a');
      parser.href = url;

      var params = parser.search;
      if (params.charAt(0) === '?') {
        params = params.substr(1);
      }

      // remove fragment identifier
      params = params.split('#')[0];

      if (params) {
        params = params.split('&');

        var paramsToRemoveMatch = ['utm', '_utm', '_ga', 'fb_', 'hmb_', 'ref_'];
        var paramsToRemoveSpecific = ['buffer_share', '_hsenc', '_hsmi', '_openstat', 'action_object_map', 'action_ref_map', 'action_type_map', 'aff_platform', 'aff_trace_key', 'campaignId', 'elqTrack', 'elqTrackId', 'fref', 'gs_l', 'hc_location', 'mkt_tok', 'recipientId', 'ref', 'terminal_id', 'yclid'];

        params = params.filter(function(param) {
          var paramName = param.split('=')[0].toLowerCase();

          // remove specific parameters
          if (paramsToRemoveSpecific.indexOf(paramName) !== -1) {
            return false; // remove parameter if it's in paramsToRemoveSpecific array
          }

          // remove matching parameters
          for (var i = paramsToRemoveMatch.length - 1; i >= 0; i--) {
            if (paramName.indexOf(paramsToRemoveMatch[i]) === 0) {
              return false; // remove parameter if it starts with anything in paramsToRemoveMatch
            }
          }

          return true; // keep parameter
        });
      }

      // ensure remaining parameters always appear in a consistent order

      if (params.length > 0) {
        params.sort();
        parser.search = '?' + params.join('&');
      } else {
        parser.search = '';
      }

      return parser.href;
    },

    getCanonicalUrl: function(options) {
      if (options && options.canonical !== undefined) {
        var url = options.canonical;
        return url;
      } else {
        var elem = document.querySelector('link[rel="canonical"]');
        return (elem) ? elem.getAttribute("href") : null;
      };
    },

    getCustomUniqueIdentifierFromUrl: function(options) {
      var url = BibblioUtils.getCanonicalUrl(options);
      if(!url){
        console.error("Exception: Unable to determine canonical URL for auto ingestion. Please see https://github.com/bibblio/related-content-module#customuniqueidentifier-required-if-no-contentitemid-is-provided on how to specify a customUniqueIdentifier, or see https://support.google.com/webmasters/answer/139066?hl=en to add a canonical URL tag.");
        return false;
      }else{
        return url;
      };
    },

    validateCustomUniqueIdentifier: function(str) {
      if(str && (str.indexOf('https://') === 0) || (str.indexOf('http://') === 0) || (str.indexOf('//') === 0)){
        return false;
      }else{
        return str;
      }
    },

    /// Render module functions
    getPresetModuleClasses: function(stylePreset) {
      var presets = {
          "grid-4": "bib--grd-4 bib--wide",
          "box-5": "bib--box-5 bib--wide",
          "box-6": "bib--box-6 bib--wide",
          "row-3": "bib--row-3"
      };
      return presets[stylePreset] || presets["row-3"];
    },

    linkRelFor: function(url) {
      var currentdomain = window.location.hostname;
      var matches = (BibblioUtils.getDomainName(currentdomain) == BibblioUtils.getDomainName(url));
      return (matches ? '' : ' rel="nofollow noopener noreferrer" ');
    },

    linkTargetFor: function(url) {
      if (Bibblio.isAmp) {
        return '_parent';
      } else {
        var currentdomain = window.location.hostname;
        var matches = (BibblioUtils.getDomainName(currentdomain) == BibblioUtils.getDomainName(url));
        return (matches ? '_self' : '_blank');
      }
    },

    linkHrefFor: function(url, queryStringParams) {
      if (!queryStringParams || (typeof queryStringParams !== 'object') || (Object.keys(queryStringParams).length === 0))
        return url;

      var queryStringParamsList = [];
      var param;
      Object.keys(queryStringParams).forEach(function (key) {
        param = encodeURIComponent(key) + "=" + encodeURIComponent(queryStringParams[key]);
        queryStringParamsList.push(param);
      });
      // Check if the url already has query params attached
      var urlSegments = url.split("#");
      if(urlSegments[0].indexOf('?') == -1)
        urlSegments[0] += "?";
      else
        urlSegments[0] += "&";
      urlSegments[0] += queryStringParamsList.join("&");

      return urlSegments.join("#");
    },

    /// Tracking functions
    getActivityId: function(trackingLink) {
      var activityId = trackingLink.replace("https://", "")
                                   .replace("http://", "")
                                   .replace(/v[0-9]\//g, "")
                                   .replace("api.bibblio.org/activities/", "");
      return activityId;
    },

    createModuleTrackingEntry: function(activityId) {
      Bibblio.moduleTracking[activityId] = {
        "trackedRecommendations": [],
        "hasModuleBeenViewed": false
      }
    },

    // Click events
    bindContentItemsClickEvents: function(options, callbacks, recommendationsResponse) {
      var container = options.targetElement;
      if (container) {
        var relatedContentItemlinks = container.getElementsByClassName("bib__link");
        // (options, recommendationsResponse, callback, event)
        var callback = callbacks.onRecommendationClick;

        for (var i = 0; i < relatedContentItemlinks.length; i++) {
          // This event is only here for the callback on left clicks
          relatedContentItemlinks[i].addEventListener('click', function(event) {
              BibblioEvents.onRecommendationClick(options, recommendationsResponse, event, callback);
          }, false);

          relatedContentItemlinks[i].addEventListener('mousedown', function(event) {
            if (event.which == 3)
              BibblioEvents.onRecommendationClick(options, recommendationsResponse, event, callback);
          }, false);

          relatedContentItemlinks[i].addEventListener('mouseup', function(event) {
            if (event.which < 4) {
              BibblioEvents.onRecommendationClick(options, recommendationsResponse, event, callback);
            }
          }, false);

          relatedContentItemlinks[i].addEventListener('auxclick', function(event) {
            if (event.which < 4) {
              BibblioEvents.onRecommendationClick(options, recommendationsResponse, event, callback);
            }
          }, false);

          relatedContentItemlinks[i].addEventListener('keydown', function(event) {
            if (event.which == 13) {
              BibblioEvents.onRecommendationClick(options, recommendationsResponse, event, callback);
            }
          }, false);
        }
      }
    },

    hasRecommendationBeenClicked: function(activityId, clickedContentItemId) {
      var moduleTrackedRecommendations = Bibblio.moduleTracking[activityId]["trackedRecommendations"];
      return moduleTrackedRecommendations.indexOf(clickedContentItemId) !== -1;
    },

    addTrackedRecommendation: function(activityId, clickedContentItemId) {
      var moduleTrackedRecommendations = Bibblio.moduleTracking[activityId]["trackedRecommendations"];
      moduleTrackedRecommendations.push(clickedContentItemId);
    },

    // Viewed event
    setOnViewedListeners: function(options, callbacks, recommendationsResponse) {
      // old (options, submitViewedActivityData, activityId, callbacks)
      // (options, recommendationsResponse, callback)
      var callback = null;
      var container = options.targetElement;
      var trackingLink = recommendationsResponse._links.tracking.href;
      var activityId = BibblioUtils.getActivityId(trackingLink);
      if(callbacks.onRecommendationViewed) {
        callback = callbacks.onRecommendationViewed;
      }

      // Check if the module is in view immeditally after rendered
      if(BibblioUtils.isRecommendationTileInView(container)) {
        BibblioEvents.onRecommendationViewed(options, recommendationsResponse, callback);
      }
      else {
        var ticking = false;
        var visiblityCheckDelay = 50;
        // Scroll event
        var eventListener = function(event) {
          if(BibblioUtils.hasModuleBeenViewed(activityId)){
            window.removeEventListener("scroll", eventListener, true);
            return;
          }
          if(!ticking) {
            window.setTimeout(function() {
              if(BibblioUtils.isRecommendationTileInView(container))
                BibblioEvents.onRecommendationViewed(options, recommendationsResponse, callback);
              ticking = false;
            }, visiblityCheckDelay);
          }
          ticking = true;
        }
        window.addEventListener('scroll', eventListener, true);
      }
    },

    isRecommendationTileInView: function(container) {
      if (container) {
        var tiles = container.getElementsByClassName("bib__link");
        var scrollableParents = BibblioUtils.getScrollableParents(container);
        if(scrollableParents !== false) {
          for(var i = 0; i < tiles.length; i++) {
            if(BibblioUtils.isTileVisible(tiles[i], scrollableParents))
              return true;
          }
        }
      }
      return false;
    },

    getScrollableParents: function(moduleElement) {
      var moduleRect = moduleElement.getBoundingClientRect();

      // is module displayed
      if(moduleRect.top == 0 && moduleRect.bottom == 0)
        return false;

      // is module visible
      var moduleStyle = window.getComputedStyle(moduleElement);
      if(moduleStyle.getPropertyValue("visibility") === "hidden")
        return false;

      // get scrollable parents
      var parent = moduleElement.parentNode;
      var parentStyle, parentRect, isScrollable;
      var scrollableParents = [];
      while(parent !== document.body) {
        // is parent visible
        parentStyle = window.getComputedStyle(parent);
        if(parentStyle.getPropertyValue("visibility") === "hidden")
          return false;

        // does container have scrollbar
        isScrollable = BibblioUtils.hasScrollableOverflow(parentStyle.getPropertyValue("overflow-x")) ||
                       BibblioUtils.hasScrollableOverflow(parentStyle.getPropertyValue("overflow-y"));
        if(isScrollable) {
          parentRect = parent.getBoundingClientRect();
          scrollableParents.push({
            rect: parentRect,
            // replace with clientWidth and clientHeight for exact measurements
            width: parentRect.right - parentRect.left,
            height: parentRect.bottom - parentRect.top,
            style: parentStyle
          });
        }

        parent = parent.parentNode;
      }

      return scrollableParents;
    },

    isTileVisible: function(tile, scrollableParents) {
      var tileRect = tile.getBoundingClientRect();
      var tileWidth = tileRect.right - tileRect.left;
      var tileHeight = tileRect.bottom - tileRect.top;

      // is tile displayed
      if(tileHeight == 0)
        return false;

      // is tile in window's current viewport
      var isInVerticleView, isInHorizontalView;
      isInVerticleView  = tileHeight <= window.innerHeight &&     // isn't higher than viewport
                          tileRect.bottom <= window.innerHeight;  // whole tile height is within viewport
      isInHorizontalView  = tileWidth <= window.innerWidth &&     // isn't wider than viewport
                            tileRect.right <= window.innerWidth;  // whole tile width in within viewport
      if(!isInVerticleView || !isInHorizontalView)
        return false;

      // is tile displayed in scrollable parents
      var parent, parentRect;
      for(var i = 0; i < scrollableParents.length; i++) {
        parent = scrollableParents[i];
        parentRect = parent.rect;
        isInVerticleView  = tileHeight <= parent.height &&         // isn't higher than viewport
                            tileRect.bottom <= parentRect.bottom;  // whole tile height is within viewport
        isInHorizontalView  = tileWidth <= parent.width &&         // isn't wider than viewport
                              tileRect.right <= parentRect.right;  // whole tile width in within viewport
        if(!isInVerticleView || !isInHorizontalView)
          return false;
      }

      return true;
    },

    hasScrollableOverflow: function(overflowProp) {
      return overflowProp === "scroll" || overflowProp === "auto" || overflowProp === "hidden";
    },

    hasModuleBeenViewed: function(activityId) {
      return Bibblio.moduleTracking[activityId]["hasModuleBeenViewed"];
    },

    setModuleViewed: function(activityId) {
      Bibblio.moduleTracking[activityId]["hasModuleBeenViewed"] = true;
    },

    /// Common utils
    getChildProperty: function(obj, path) {
      if ((typeof obj === 'object') && (typeof path === 'string')) {
        var arr = path.split('.');
        while (arr.length && (obj = obj[arr.shift()]));
        return obj;
      } else {
        return undefined;
      }
    },

    getModuleSettings: function(options) {
      var moduleSettings = {};
      moduleSettings.stylePreset = options.stylePreset || "default";
      moduleSettings.styleClasses = options.styleClasses || false;
      moduleSettings.subtitleField = (options.subtitleField ? options.subtitleField : "description");
      moduleSettings.dateFormat = (options.dateFormat ? options.dateFormat : "DMY");
      moduleSettings.truncateTitle = (options.truncateTitle ? options.truncateTitle : null);
      moduleSettings.hidden = (options.hidden || false);
      return moduleSettings;
    },

    getDomainName: function(url) {
      var r = /^(?:https?:\/\/)?(?:www\.)?(.[^/]+)/;
      var matchResult = url.match(r);
      return (url.match(r) ? matchResult[1].replace('www.', '') : "");
    },

    getRootProperty: function(accessor) {
      if (accessor == false || accessor == undefined) {
          return accessor;
      } else {
         return accessor.split(".")[0];
      }
    },

    // Http requests
    bibblioHttpGetRequest: function(url, accessToken, isAsync, callback) {
      var options = {
        url: url,
        method: "GET",
        accessToken: accessToken
      }
      BibblioUtils.bibblioHttpRequest(options, isAsync, callback);
    },

    bibblioHttpPostRequest: function(url, accessToken, body, isAsync, callback) {
      var options = {
        url: url,
        method: "POST",
        accessToken: accessToken,
        body: body
      }
      BibblioUtils.bibblioHttpRequest(options, isAsync, callback);
    },

    bibblioHttpRequest: function(options, isAsync, callback) {
      var url = options.url;
      var method = options.method;
      var accessToken = options.accessToken;
      if(isNodeJS) {
        var https = require('https');
        var baseUrl = "https://api.bibblio.org";
        var path = url.replace(baseUrl, "");
        var hostname = baseUrl.replace("https://", "");
        var httpOptions = {
          hostname: hostname,
          path: path,
          method: method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        if(accessToken) {
          httpOptions.headers.Authorization = "Bearer " + accessToken;
        }
        // Add body if method is POST
        if(method == "POST")
          httpOptions.body = JSON.stringify(options.body);

        var req = https.request(httpOptions, function(response) {
          var responseText = "";
          // Build response text
          response.on('data', function(dataChunk) {
            responseText += dataChunk;
          });

          response.on('end', function() {
              try {
                var responseObject = JSON.parse(responseText);
                BibblioUtils.httpCallback(callback, responseObject, response.statusCode);
              }
              catch(err) {
                BibblioUtils.httpCallback(callback, {}, response.statusCode);
              }
          })
        });

        req.on('error', function(e) {
          BibblioUtils.httpCallback(callback, {}, response.statusCode);
        });

        // Add body if method is POST
        if(method == "POST") {
          var requestBody = JSON.stringify(options.body);
          req.write(requestBody);
        }

        req.end();
      }
      else {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
          if (xmlhttp.readyState === 4) {
            try {
              var response = JSON.parse(xmlhttp.responseText);
              BibblioUtils.httpCallback(callback, response, xmlhttp.status);
            }
            catch (err) {
              BibblioUtils.httpCallback(callback, {}, xmlhttp.status);
            }
          }
        };
        xmlhttp.open(method, url, true);
        xmlhttp.setRequestHeader('Content-Type', 'application/json');
        if(accessToken)
          xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
        // If method is POST add body to request
        if(method == "POST") {
          var requestBody = JSON.stringify(options.body);
          xmlhttp.send(requestBody);
        }
        else
          xmlhttp.send();
      }
    },

    httpCallback: function(callback, response, status) {
      if (callback != null && typeof callback === "function") {
        callback(response, status);
      }
    },

    monthName: function(monthNum) {
      var month = [];
      month[1] = "January";
      month[2] = "February";
      month[3] = "March";
      month[4] = "April";
      month[5] = "May";
      month[6] = "June";
      month[7] = "July";
      month[8] = "August";
      month[9] = "September";
      month[10] = "October";
      month[11] = "November";
      month[12] = "December";
      var monthNum = parseInt(monthNum);
      return month[monthNum];
    },

    getItemRecData: function(recsData, contentItemId) {
      return recsData.find(function(element) { return element["contentItemId"] == contentItemId; });
    },

    getTruncationLengthForStyle: function(styles) {
      if (styles.indexOf('bib--square') !== -1) {
        return 110;
      } else if (styles.indexOf('bib--wide') !== -1) {
        return 70;
      } else {
        return 90;
      }
    },

    truncateTitle: function(name, styles, override) {
      var truncationLength = override || BibblioUtils.getTruncationLengthForStyle(styles);

      if (name.length > truncationLength) {
        return name.substring(0, truncationLength) + "…";
      } else {
        return name;
      }
    }
  };

  // Bibblio events module
  var BibblioEvents = {
    onRecommendationClick: function(options, recommendationsResponse, event, callback) {
      var clickedContentItemId = event.currentTarget.getAttribute("data");
      var moduleSettings = BibblioUtils.getModuleSettings(options);
      var relatedContentItems = recommendationsResponse.results;
      var trackingLink = recommendationsResponse._links.tracking.href;
      var sourceContentItemId = (recommendationsResponse._links.sourceContentItem ? recommendationsResponse._links.sourceContentItem.id : null);
      var activityId = BibblioUtils.getActivityId(trackingLink);

      var userId = options.userId ? options.userId : null;
      var activityData = BibblioActivity.constructOnClickedActivityData(
          sourceContentItemId,
          clickedContentItemId,
          options.catalogueIds,
          relatedContentItems,
          {
              type: "BibblioRelatedContent",
              version: Bibblio.moduleVersion,
              config: moduleSettings
          },
          userId
      );

      if(!BibblioUtils.hasRecommendationBeenClicked(activityId, clickedContentItemId)) {
          var response = BibblioActivity.track(trackingLink, activityData);
          BibblioUtils.addTrackedRecommendation(activityId, clickedContentItemId);

        // Call client callback if it exists
        if (callback != null && typeof callback === "function") {
            var clickedItemData = BibblioUtils.getItemRecData(relatedContentItems, clickedContentItemId);
            callback(clickedItemData, event);
        }
      }
    },

    onRecommendationViewed: function(options, recommendationsResponse, callback) {
      var trackingLink = recommendationsResponse._links.tracking.href;
      var activityId = BibblioUtils.getActivityId(trackingLink);
      if(!BibblioUtils.hasModuleBeenViewed(activityId)) {
        var moduleSettings = BibblioUtils.getModuleSettings(options);
        var relatedContentItems = recommendationsResponse.results;
        var sourceContentItemId = (recommendationsResponse._links.sourceContentItem ? recommendationsResponse._links.sourceContentItem.id : null);
        BibblioUtils.setModuleViewed(activityId);
        var userId = options.userId ? options.userId : null;
        var activityData = BibblioActivity.constructOnViewedActivityData(
            sourceContentItemId,
            options.catalogueIds,
            relatedContentItems,
            {
                type: "BibblioRelatedContent",
                version: Bibblio.moduleVersion,
                config: moduleSettings
            },
            userId
        );

        var response = BibblioActivity.trackAsync(trackingLink, activityData);

        // Call client callback if it exists
        if (callback != null && typeof callback === "function") {
            callback(activityData);
        }
      }
    }
  };

  // Bibblio template module
  var BibblioTemplates = {
    outerModuleTemplate: '<div class="bib__module <% classes %>">\
                            <% recommendedContentItems %>\
                            <div class="bib__origin"><a href="https://www.bibblio.org/what" target="_blank" rel="nofollow"><span class="bib__origin--icon">i</span><span class="bib__origin--label">About these recommendations</span></a></div>\
                          </div>',

    relatedContentItemTemplate: '<a href="<% linkHref %>" target="<% linkTarget %>" <% linkRel %> data="<% contentItemId %>" class="bib__link bib__link--<% linkNumber %> <% linkImageClass %>">\
                                    <span class="bib__image" <% linkImageStyle %> >\
                                    </span>\
                                    <span class="bib__info">\
                                        <span class="bib__title">\
                                          <span class="bib__name"><% name %></span>\
                                        </span>\
                                        <span class="bib__properties">\
                                          <% authorHTML %>\
                                          <% datePublishedHTML %>\
                                          <span class="bib__site"></span>\
                                        </span>\
                                        <span class="bib__preview">\
                                          <% subtitleHTML %>\
                                        </span>\
                                    </span>\
                                    </a>',

    subtitleTemplate: '<span class="bib__description"><% subtitle %></span>',

    authorTemplate: '<span class="bib__author"><% author %></span>',

    datePublishedTemplate: '<span class="bib__recency"><% datePublished %></span>',

    getTemplate: function(template, options) {
      Object.keys(options).forEach(function(key) {
        template = template.split("<% " + key + " %>").join(options[key]);
      });
      // Remove any unused placeholders
      var placeHolderStart = template.indexOf("<%");
      while(placeHolderStart != -1) {
        var placeHolderEnd = template.indexOf("%>", placeHolderStart);
        var placeHolder = template.substring(placeHolderStart, placeHolderEnd + 2);
        // Remove unused place holder
        template = template.replace(placeHolder, '');
        // Get next unused place holder
        placeHolderStart = template.indexOf("<%");
      }
      return template;
    },

    getSubtitleHTML: function(contentItem, moduleSettings) {
      var subtitleField = BibblioUtils.getChildProperty(contentItem.fields, moduleSettings.subtitleField);
      var subtitleHTML = '';
      if(subtitleField) {
        var templateOptions = {
          subtitle: subtitleField
        };
        subtitleHTML = BibblioTemplates.getTemplate(BibblioTemplates.subtitleTemplate, templateOptions);
      }

      return subtitleHTML;
    },

    getAuthorHTML: function(contentItem, moduleSettings) {
      var authorHTML = '';
      try {
        var authorField = contentItem.fields.author;
        var templateOptions = {
          author: authorField.name
        };
        authorHTML = BibblioTemplates.getTemplate(BibblioTemplates.authorTemplate, templateOptions);
      } catch (e) {

      }

      return authorHTML;
    },

    formatDate: function(value, formatting) {
      if (value && (value.indexOf('T') === 10)) {
        var date  = value.split('T')[0];
        var year  = parseInt(date.split('-')[0]);
        var month = parseInt(date.split('-')[1]);
        var day   = parseInt(date.split('-')[2]);
        var monthName = BibblioUtils.monthName(month);

        switch (formatting) {
          case "MDY":
            return monthName + " " + day + ", " + year;
            break;

          case "YMD":
            return year + " " + monthName + " " + day;
            break;

          case "DMY":
          default:
            return day + " " + monthName + " " + year;
            break;
        }
      }
    },

    getDatePublishedHTML: function(contentItem, moduleSettings) {
      var datePublishedHTML = '';
      try {
        var datePublishedField = contentItem.fields.datePublished;
        datePublishedField = BibblioTemplates.formatDate(datePublishedField, moduleSettings.dateFormat);
        var templateOptions = {
          datePublished: datePublishedField
        };
        datePublishedHTML = BibblioTemplates.getTemplate(BibblioTemplates.datePublishedTemplate, templateOptions);
      } catch (e) {

      }

      return datePublishedHTML;
    },

    filterContentItemImageUrl: function(moduleImageUrl) {
      var url = moduleImageUrl.replace(/'/g, "\\'");

      if((url.indexOf("http://") === 0) || (url.indexOf("https://") === 0) || (url.indexOf("data:image/") === 0)) {
        return url;
      } else {
        var withProtocol = "http://" + url;
        return withProtocol;
      };
    },

    getRelatedContentItemHTML: function(contentItem, contentItemIndex, options, moduleSettings) {

      // Create template for subtitle
      var subtitleHTML = BibblioTemplates.getSubtitleHTML(contentItem, moduleSettings);
      // Create template for author
      var authorHTML = BibblioTemplates.getAuthorHTML(contentItem, moduleSettings);
      // Create template for datePublished
      var datePublishedHTML = BibblioTemplates.getDatePublishedHTML(contentItem, moduleSettings);

      // Create template for related content item
      var contentItemUrl = (contentItem.fields.url ? contentItem.fields.url : '');
      var contentItemImageUrl = "";
      if(contentItem.fields.moduleImage && contentItem.fields.moduleImage.contentUrl)
        var filteredImageUrl = BibblioTemplates.filterContentItemImageUrl(contentItem.fields.moduleImage.contentUrl);
        contentItemImageUrl = filteredImageUrl;

      var classes = (moduleSettings.styleClasses ? moduleSettings.styleClasses : BibblioUtils.getPresetModuleClasses(moduleSettings.stylePreset));

      var templateOptions = {
          contentItemId: (contentItem.contentItemId ? contentItem.contentItemId : ''),
          name: BibblioUtils.truncateTitle((contentItem.fields.name ? contentItem.fields.name   : ''), classes, moduleSettings.truncateTitle),
          authorHTML: authorHTML,
          datePublishedHTML: datePublishedHTML,
          linkHref: BibblioUtils.linkHrefFor(contentItemUrl, options.queryStringParams),
          linkTarget: BibblioUtils.linkTargetFor(contentItemUrl),
          linkRel: BibblioUtils.linkRelFor(contentItemUrl),
          linkImageClass: (contentItemImageUrl ? 'bib__link--image' : ''),
          linkImageStyle: (contentItemImageUrl ? 'style="background-image: url(' + "'"  + contentItemImageUrl + "'" + ')"' : ''),
          subtitleHTML: subtitleHTML,
          linkNumber: contentItemIndex + 1
      };

      return BibblioTemplates.getTemplate(BibblioTemplates.relatedContentItemTemplate, templateOptions);
    },

    getOuterModuleHTML: function(moduleSettings, relatedContentItemsHTML) {
      var classes = moduleSettings.styleClasses ? moduleSettings.styleClasses : BibblioUtils.getPresetModuleClasses(moduleSettings.stylePreset);
      if (moduleSettings.hidden) {
        classes += " bib--hide";
      }

      var templateOptions = {
          classes: classes,
          recommendedContentItems: relatedContentItemsHTML
      };

      return BibblioTemplates.getTemplate(BibblioTemplates.outerModuleTemplate, templateOptions);
    },

    getModuleHTML: function(relatedContentItems, options, moduleSettings) {
      var contentItemsHTML = "";
      if (relatedContentItems) {
        for(var i = 0; i < relatedContentItems.length; i++) {
          contentItemsHTML += BibblioTemplates.getRelatedContentItemHTML(relatedContentItems[i], i, options, moduleSettings) + "\n";
        }
      }
      // Create module HTML
      var moduleHTML = BibblioTemplates.getOuterModuleHTML(moduleSettings, contentItemsHTML);
      return moduleHTML;
    }

  }

  // BibblioActivity module
  var BibblioActivity = {
    track: function(trackingLink, activityData) {
      if(trackingLink != null) {
        BibblioUtils.bibblioHttpPostRequest(trackingLink, null, activityData, false);
      }
    },

    trackAsync: function(trackingLink, activityData){
      if(trackingLink != null) {
        BibblioUtils.bibblioHttpPostRequest(trackingLink, null, activityData, true);
      }
    },

    constructOnClickedActivityData: function(sourceContentItemId, clickedContentItemId, catalogueIds, relatedContentItems, instrument, userId) {
      var activityData = {
        "type": "Clicked",
        "object": BibblioActivity.constructActivityObject(clickedContentItemId),
        "context": BibblioActivity.constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems),
        "instrument": BibblioActivity.constructActivityInstrument(instrument)
      };

      if(userId != null)
        activityData["actor"] = {"userId": userId};

      return activityData;
    },

    constructOnViewedActivityData: function(sourceContentItemId, catalogueIds, relatedContentItems, instrument, userId) {
      var activityData = {
        "type": "Viewed",
        "context": BibblioActivity.constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems),
        "instrument": BibblioActivity.constructActivityInstrument(instrument)
      };

      if(userId != null)
        activityData["actor"] = {"userId": userId};

      return activityData;
    },

    constructActivityInstrument: function(instrument) {
      return {
          "type": instrument.type,
          "version": instrument.version,
          "config": instrument.config
      };
    },

    constructActivityObject: function(clickedContentItemId) {
      return [["contentItemId", clickedContentItemId]];
    },

    constructActivityContext: function(sourceContentItemId, catalogueIds, relatedContentItems) {
      var context = [];
      var href = ((typeof window !== 'undefined') && window.location && window.location.href) ? window.location.href : '';

      context.push(["sourceHref", href]);
      if (sourceContentItemId) {
        context.push(["sourceContentItemId", sourceContentItemId]);
      }
      for(var i = 0; i < relatedContentItems.length; i++)
        context.push(["recommendations.contentItemId", relatedContentItems[i].contentItemId]);

      // include all specified catalogue ids in the context
      // but assume recommendations are from the source content item's catalogue if no catalogues were specified
      if (catalogueIds && (catalogueIds.length > 0)) {
        for(var i = 0; i < catalogueIds.length; i++)
          context.push(["recommendations.catalogueId", catalogueIds[i]]);
      } else {
        if (relatedContentItems[0].catalogueId) {
          context.push(["recommendations.catalogueId", relatedContentItems[0].catalogueId]);
        }
      }

      return context
    }
  };

  if (isNodeJS) {
    module.exports = {
      Bibblio: Bibblio,
      BibblioUtils: BibblioUtils,
      BibblioActivity: BibblioActivity,
      BibblioEvents: BibblioEvents,
      BibblioTemplates: BibblioTemplates
    };
  } else {
    window.Bibblio = Bibblio;
    window.BibblioActivity = BibblioActivity;
    window.BibblioUtils = BibblioUtils;
    window.BibblioEvents = BibblioEvents;
    window.BibblioTemplates = BibblioTemplates;

    // `DOMContentLoaded` may fire before your script has a chance to run,
    // so check before adding a listener
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", BibblioUtils.autoInit);
    } else {  // `DOMContentLoaded` already fired
      BibblioUtils.autoInit();
    }
  }
})();