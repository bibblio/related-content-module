"use strict";

(function() {
  var isNodeJS = false;

  // support for NodeJS, which doesn't support XMLHttpRequest natively
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    isNodeJS = true;
  }

  function limitExecutionRate(func, delay) {
    var timer;
    var context = this;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        return func.apply(context, args)
      }, delay);
    }
  }

  // Bibblio module
  var Bibblio = {
    moduleVersion: "4.13.0",
    moduleTracking: {},
    isAmp: false,

    showModules: function() {
      var modules = document.getElementsByClassName("bib__module");
      [].forEach.call(modules, function(element) {
        element.classList.remove("bib--hide");
      });
    },

    autoInit: function() {
      var rcmSrcElement = BibblioUtils.getSrcElement();
      var rcmAutoInitElements = BibblioUtils.getAutoInitElements();
      var options = {}
      var callbacks = {}

      // Initialise auto ingestion
      BibblioUtils.initScriptParamIngestion(rcmSrcElement);

      // Loop over all auto init elements and initialise
      rcmAutoInitElements.forEach(function(element) {
        var moduleData = BibblioUtils.parseModuleData(element);
        Bibblio.initRelatedContent(moduleData.options, moduleData.callbacks);
      });
    },

    initRelatedContent: function(options, callbacks) {
      // Validate the values of the related content module options
      if (!BibblioUtils.validateModuleOptions(options)) return;

      var url = window.location.href;
      var callbacks = callbacks || {};
      var moduleOptions = BibblioUtils.prepareModuleOptions(options);
      var element = (options.targetElementId) ? document.getElementById(options.targetElementId) : options.targetElement;
      var elementIsVisible = BibblioUtils.isElementVisible(element);
      var isAmp = BibblioUtils.isAmp(url);

      //Get recs for the module if visible
      if (elementIsVisible === true || isAmp === true) {
        Bibblio.getRelatedContentItems(moduleOptions, callbacks);
      } else {
        console.log("Bibblio: Module will not be rendered until the target element is made visible on the page");
        //Watch for attribute modifications on module
        BibblioUtils.watchForAttributeModifications(element, moduleOptions, callbacks);
      }
    },

    getRelatedContentItems: function(options, callbacks) {
      var moduleSettings = BibblioUtils.getModuleSettings(options);
      var subtitleField = moduleSettings.subtitleField;
      var accessToken = options.recommendationKey;
      var baseItemLimit = 6;
      var itemLimitOffset = (options.offset === undefined ? 0 : options.offset);
      var itemLimit = baseItemLimit + itemLimitOffset;

      // URL arguments should be injected but the module only supports these settings now anyway.
      var fields = BibblioUtils.getRecommendationFields(subtitleField);
      var url = BibblioUtils.getRecommendationUrl(options, itemLimit, 1, fields);
      BibblioUtils.bibblioHttpGetRequest(url, accessToken, true, function(response, status) {
        Bibblio.handleRecsResponse(options, callbacks, response, status);

        // fall back to Global Popularity recommendations if no recommendations could be fetched yet
        if ((status === 404) || (status === 412) || (status === 422)) {
          console.log('Bibblio: Fetching Global Popularity Recs after receiving HTTP status ' + status);

          // copy and modify the previous options
          var popularOptions = JSON.parse(JSON.stringify(options));
          popularOptions.targetElement = document.getElementById(options.targetElementId);
          popularOptions.recommendationType = "popular";
          delete popularOptions.contentItemId;
          delete popularOptions.customUniqueIdentifier;

          var popularUrl = BibblioUtils.getRecommendationUrl(popularOptions, 6, 1, fields);
          BibblioUtils.bibblioHttpGetRequest(popularUrl, accessToken, true, function(response, status) {
            Bibblio.handleRecsResponse(popularOptions, callbacks, response, status);
          });
        }
      });
    },

    handleRecsResponse: function(options, callbacks, recommendationsResponse, status) {
      if(options.autoIngestion) {
        // if content item has not been ingested yet
        if(status === 404) { // this will always be returned before a 402 (if the item doesn't exist)

          // delay the call(s) to createScrapeRequest
          var timeout = Math.floor(Math.random() * 500);
          setTimeout(function() {
            // then make sure it hasn't been called yet (so only one module on a page gets to ingest)
            if (!Bibblio.createScrapeRequestCalled) {
              Bibblio.createScrapeRequest(options);
            }
          }, timeout);
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

      return status;
    },

    createScrapeRequest: function(options) {
      Bibblio.createScrapeRequestCalled = true;
      var href;
      var canonical = BibblioUtils.getCanonicalUrl(options);

      if(options.autoIngestionUrl) {
        href = options.autoIngestionUrl;
      } else {
        href = (canonical) ? canonical : BibblioUtils.getWindowLocation();
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
      var relatedContentItems = recommendationsResponse.results.slice(options.offset);
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

    isInUrl: function(url, string) {
      var hasString = url.indexOf(string) > -1;
      return hasString;
    },

    getSrcElement: function() {
      return document.getElementById('bib--rcm-src');
    },

    getAutoInitElements: function() {
      var elements = document.getElementsByClassName('bib--rcm-init');
      return [].slice.call(elements); //converting htmlCollection to array of elements
    },

    getOptionsAndCallbacks: function(element, options, callbacks) {
      return (options.targetElementId) ? {'options': options, 'callbacks': callbacks} : BibblioUtils.parseModuleData(element);
    },

    watchForAttributeModifications: function(element, options, callbacks) {
      window.MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
      if (window.MutationObserver) {
        var config = {attributes: true};
        var callback = function(mutationsList, observer) {
          var data = BibblioUtils.getOptionsAndCallbacks(element, options, callbacks);
          Bibblio.initRelatedContent(data.options, data.callbacks);
          observer.disconnect();
        };
        var observer = new MutationObserver(callback);
        observer.observe(element, config);
      }
    },

    isElementVisible: function(element) {
      var visible = false;
      if (element !== null) {
        var computedDisplayAttr = window.getComputedStyle(element).getPropertyValue('display');
        visible = (computedDisplayAttr !== "none") ? true : false;
      }
      return visible;
    },

    isAmp: function(url) {
      return BibblioUtils.isInUrl(url, '#amp=1');
    },

    isIntOrStringInt: function(val) {
      return !isNaN(val) && (val.toString() === parseInt(val).toString());
    },

    numIsInRange: function(num, start, end) {
      return num >= start && num <= end;
    },

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

      if(options.autoIngestion && options.recommendationType === "personalised") {
        console.error("Bibblio: auto-ingestion cannot be enabled on a module serving personalised recommendations. Please auto-ingest with a module serving 'optimised' or 'related' recommendations instead.");
        return false
      }

      if(!options.userId && options.recommendationType === "personalised") {
        console.error("Bibblio: Please provide a userId when requesting personalised recommendations.")
        return false
      }

      if(!options.userId && options.userMetadata) {
        console.error("Bibblio: userId must be present if userMetadata is supplied.");
        return false;
      }

      if(options.contentItemId && options.customUniqueIdentifier) {
        console.error("Bibblio: Cannot supply both contentItemId and customUniqueIdentifier.");
        return false;
      }

      if(options.contentItemId && options.recommendationType === "personalised") {
        console.error("Bibblio: contentItemId cannot be supplied when serving personalised recommendations.")
        return false
      }

      if(options.customUniqueIdentifier && !BibblioUtils.validateCustomUniqueIdentifier(options.customUniqueIdentifier)){
        console.error("Exception: Cannot supply a URL as a customUniqueIdentifier. Please see https://github.com/bibblio/related-content-module#customuniqueidentifier-required-if-no-contentitemid-is-provided on how to specify a customUniqueIdentifier, or see https://support.google.com/webmasters/answer/139066?hl=en to add a canonical URL tag.");
        return false;
      }

      if(options.customUniqueIdentifier && options.recommendationType === "personalised") {
        console.error("Bibblio: customUniqueIdentifier cannot be supplied when serving personalised recommendations.")
        return false
      }

      if(!options.urlParamIngestion) {
        if(!options.targetElementId && !options.targetElement) {
          console.error("Bibblio: Please provide a value for targetElementId in the options parameter.");
          return false;
        }
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

      if(options.autoIngestionCatalogueId && options.recommendationType === "personalised") {
        console.error("Bibblio: autoIngestionCatalogueId cannot be supplied when serving personalised recommendations.")
        return false
      }

      if(options.autoIngestionCustomCatalogueId && options.recommendationType === "personalised") {
        console.error("Bibblio: autoIngestionCustomCatalogueId cannot be supplied when serving personalised recommendations.")
        return false
      }

      if(options.corpusType === "syndicated" && options.catalogueIds) {
        console.error("Bibblio: catalogueIds cannot be supplied when serving syndicated recommendations.")
        return false
      }

      if(options.corpusType === "syndicated" && options.customCatalogueIds) {
        console.error("Bibblio: customCatalogueIds cannot be supplied when serving syndicated recommendations.")
        return false
      }

      if(options.offset && (!BibblioUtils.isIntOrStringInt(options.offset) || !BibblioUtils.numIsInRange(parseInt(options.offset), 1, 14))) {
        console.error("Bibblio: offset must be an integer between 1 and 14.")
        return false
      }

      return true;
    },

    isUserMetadataParam: function(param) {
      return /^userMetadata\[(.+)\]$/.test(param);
    },

    cleanAmpUserMetadata: function(options) {
      var ampOptions = {};

      for(var param in options) {
        if(BibblioUtils.isUserMetadataParam(param)) {
          var cleanFirst = param.slice(13);
          var newParam = cleanFirst.substring(0, cleanFirst.length - 1);

          if(newParam !== "") {
            ampOptions[newParam] = options[param];
          }
        }
      }

      return ampOptions;
    },

    convertInitParamUserMetadata: function(metadata) {
      var cleanParams = metadata.split(/&/g);

      var params = {};

      for(param in cleanParams) {
        var param = cleanParams[param];
        var key = param.split('=')[0];
        var value = param.split('=')[1];

        if (value.indexOf('#') > -1) {
          var cleanedValue = value.split('#')[0];
          params[key] = cleanedValue;
        } else {
          params[key] = value;
        }
      }

      return params;
    },

    getWindowLocation: function() {
      return ((typeof window !== 'undefined') && window.location && window.location.href) ? window.location.href : '';
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

        if (value.indexOf('#') > -1) {
          var cleanedValue = value.split('#')[0];
          params[key] = cleanedValue;
        } else {
          params[key] = value;
        }
      }

      return params;
    },

    createQueryStringObj: function(params, options) {
      var diffArray = Object.keys(params).filter(function (k) {
        return params[k] !== options[k]
      });

      var diffObject = Object.assign({}, diffArray);

      var queryStringObj = {};
      if (Object.keys(diffObject).length > -1) {
        for(var key = 0; key < Object.keys(diffObject).length; key++) {
          var param = diffObject[key];
          queryStringObj[param] = params[param];
        }
      }

      return queryStringObj;
    },

    prepareModuleOptions: function(options) {
      if (options && !options.contentItemId && !options.customUniqueIdentifier && options.recommendationType !== "popular" && options.recommendationType !== "personalised") {
        var canonicalUrl = BibblioUtils.getCustomUniqueIdentifierFromUrl(options);
        if (canonicalUrl) {
          options.customUniqueIdentifier = BibblioUtils.getCustomUniqueIdentifierFromUrl(options);
        }
      }

      if (options && options.targetElementId && !options.targetElement) {
        options.targetElement = document.getElementById(options.targetElementId);
      }

      if (options.offset === undefined) {
        options.offset = 0;
      } else {
        options.offset = parseInt(options.offset);
      }

      return options;
    },

    /// Auto initialise params functions
    allowedKeys: [
      "amp",
      "autoIngestion",
      "autoIngestionCatalogueId",
      "autoIngestionCustomCatalogueId",
      "urlParamIngestion",
      "catalogueIds",
      "customCatalogueIds",
      "contentItemId",
      "corpusType",
      "customUniqueIdentifier",
      "dateFormat",
      "hidden",
      "offset",
      "queryStringParams",
      "recommendationKey",
      "recommendationType",
      "styleClasses",
      "stylePreset",
      "subtitleField",
      "targetElementId",
      "truncateTitle",
      "userMetadata",
      "userId"
    ],

    parseModuleData: function(element) {
      var url = window.location.href;
      Bibblio.isAmp = BibblioUtils.isInUrl(url, '#amp=1');
      var options = {};
      var callbacks = {};

      if(Bibblio.isAmp) {
        options = BibblioUtils.getAmpAutoInitParams(url)
        callbacks = BibblioUtils.ampCallbacks;
      } else {
        options = BibblioUtils.getParams(element);
      }

      return {
        'options': options,
        'callbacks': callbacks
      }
    },

    getAmpAutoInitParams: function(url) {
      var params = {};
      var targetElement = BibblioUtils.findInitElements()[0];
      if (targetElement) {
        params = BibblioUtils.getAmpParams(url, targetElement);
      }
      return params;
    },

    getAmpParams: function(url, targetElement) {
      var ampParams = BibblioUtils.getAmpOptions(url);
      ampParams.autoIngestionUrl = document.referrer;
      ampParams.targetElement = targetElement;
      return ampParams;
    },

    getParams: function(element) {
      var params = BibblioUtils.elementToInitParams(element);
      return params;
    },

    findInitElements: function() {
      return document.getElementsByClassName("bib--rcm-init");
    },

    handleNodeData: function(key, value) {
      switch (key) {
        // Transform queryStringParameters into object
        case "queryStringParams":
          var queryStringParameters = {};
          var pairs = value.split("&");

          // Append each key value pair to queryStringParameters object
          pairs.forEach(function(pair) {
            var keyValueTuple = pair.split("=");
            queryStringParameters[keyValueTuple[0]] = keyValueTuple[1];
          })

          // Return custom object value for query string parameters
          return queryStringParameters;

        // Transform comma separated strings into array
        case "customCatalogueIds":
        case "catalogueIds":
          return value.split(",");
        case "userMetadata":
          return BibblioUtils.convertInitParamUserMetadata(value);
        case "offset":
          if (value === undefined) {
            return 0;
          } else {
            return parseInt(value);
          }
        default:
          break;
      }

      // Handle booleans
      if(value === "true")  return true;
      if(value === "false") return false;

      return value;
    },

    elementToInitParams: function(element) {
      var allowedKeys = BibblioUtils.allowedKeys;

      // Construct new objects with only the allowed keys from each node's dataset
      var dataset = element.dataset;
      var initParams = allowedKeys.reduce(function(acc, key) {
        if (dataset[key]) {
          acc[key] = BibblioUtils.handleNodeData(key, dataset[key]);
        }
        return acc;
      }, {targetElement: element});

      return initParams;
    },

    checkAndSetAmpUserMetadata: function(options) {
      var hasMetadata = false;

      for(var param in options.queryStringParams) {
        if(BibblioUtils.isUserMetadataParam(param)) {
          hasMetadata = true;
        }
      }

      if(hasMetadata) {
        options.userMetadata = BibblioUtils.cleanAmpUserMetadata(options.queryStringParams);

        for(var param in options.queryStringParams) {
          if(BibblioUtils.isUserMetadataParam(param)) {
            delete options.queryStringParams[param];
          }
        }

        return options;
      } else {
        return options;
      }
    },

    getAmpOptions: function(url) {
      var allowedKeys = BibblioUtils.allowedKeys;
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

      options = BibblioUtils.checkAndSetAmpUserMetadata(options);

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

    ampCallbacks: {
      onRecommendationsRendered: function (recsData) {
        BibblioUtils.submitAmpEmbedSize(document.body.scrollHeight, document.body.scrollWidth);

        window.parent.postMessage({
          sentinel: 'amp',
          type: 'embed-ready'
        }, '*');

        // this event is currently not being issued by the browser. This code is left here in hope that it will one day
        window.addEventListener("orientationchange", function () {
          BibblioUtils.submitAmpEmbedSize(document.body.scrollHeight, document.body.scrollWidth);
        }, false);
      }
    },

    filterOptions: function(options) {
      return Object.keys(options)
        .filter(function(key) {
          return BibblioUtils.allowedKeys.indexOf(key) > -1;
        })
        .reduce(function(obj, key) {
          obj[key] = BibblioUtils.handleNodeData(key, options[key]);
          return obj;
        }, {});
    },

    // TODO: might be unnecessarily specific to script param ingestion? could generify
    ingestFromScriptParam: function(options) {
      if(options.recommendationKey && (options.autoIngestion === true)) {
        options.urlParamIngestion = true;
      } else {
        return;
      }

      if(!BibblioUtils.validateModuleOptions(options)) {
        return;
      } else {
        options.customUniqueIdentifier = (options.customUniqueIdentifier ? options.customUniqueIdentifier : BibblioUtils.getCustomUniqueIdentifierFromUrl(options));
        Bibblio.createScrapeRequest(options);
      }
    },

    initScriptParamIngestion: function(element) {
      if (element && element.dataset) {
        var options = BibblioUtils.filterOptions(element.dataset);
        BibblioUtils.ingestFromScriptParam(options);
      }
    },

    /// Get recommendations functions
    getRecommendationFields: function(subtitleField) {
      var fields = ["name", "url", "moduleImage", "datePublished", "author"];
      if(subtitleField)
        fields.push(BibblioUtils.getRootProperty(subtitleField));
      return fields;
    },

    createMetadataQueryString: function(userMetadata) {
      var queryString = '';

      for(var param in userMetadata){
        var newParams = 'userMetadata[' + param + ']=' + userMetadata[param];

        if(queryString.indexOf('userMetadata') > -1){
          newParams = '&' + newParams;
          queryString += newParams;
        } else {
          queryString += newParams;
        }
      }
      return queryString;
    },

    getRecommendationUrl: function(options, limit, page, fields) {
      var baseUrl = "https://api.bibblio.org/v1";
      var recommendationType = (options.recommendationType) ? options.recommendationType : null;
      var corpusType = options.corpusType ? options.corpusType : null;
      var catalogueIds = options.catalogueIds ? options.catalogueIds : [];
      var customCatalogueIds = options.customCatalogueIds ? options.customCatalogueIds : [];
      var userId = options.userId;
      var userMetadata = options.userMetadata ? options.userMetadata : null;

      var querystringArgs = [
          "limit=" + limit,
          "page=" + page,
          "fields=" + fields.join(",")
      ];

      if(userMetadata) {
          var queryString = BibblioUtils.createMetadataQueryString(userMetadata)
          querystringArgs.push(queryString);
      }

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

      if (corpusType === "syndicated") {
          querystringArgs.push("corpusType=" + corpusType);

          // Hardcode recommendation type for now when using syndication
          recommendationType = "optimised";
      }

      switch (recommendationType) {
          case "related" :
              return baseUrl + "/recommendations/related?" + querystringArgs.join("&");
          case "popular" :
              return baseUrl + "/recommendations/popular?" + querystringArgs.join("&");
          case "personalised" :
              return baseUrl + "/recommendations/personalised?" + querystringArgs.join("&");
          default :
              return baseUrl + "/recommendations?" + querystringArgs.join("&");
      }
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
      }
    },

    getCustomUniqueIdentifierFromUrl: function(options) {
      var url = BibblioUtils.getCanonicalUrl(options);
      if (!url) {
        console.error("Exception: Unable to determine canonical URL for retrieving recommendations or auto ingestion. Please see https://github.com/bibblio/related-content-module#customuniqueidentifier-required-if-no-contentitemid-is-provided on how to specify a customUniqueIdentifier, or see https://support.google.com/webmasters/answer/139066?hl=en to add a canonical URL tag.");
        return false;
      } else {
        return url;
      }
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
        return '_top';
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
      trackingLink = trackingLink || "";
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
      var callback = null;
      var moduleElement = options.targetElement;
      var trackingLink = recommendationsResponse._links.tracking.href;
      var activityId = BibblioUtils.getActivityId(trackingLink);
      if (callbacks.onRecommendationViewed) {
        callback = callbacks.onRecommendationViewed;
      }

      var visibilityTimeout = 5;

      if (Bibblio.isAmp) {
        var handleMessage = limitExecutionRate(function (message) {
          // https://www.ampproject.org/docs/reference/components/amp-iframe
          // Message structure that comes back from AMP when you ask for 'send-intersections'
          var messageType = [message.data.sentinel, message.data.type].join(':');

          if (messageType == "amp:intersection") {
            if (BibblioUtils.hasModuleBeenViewed(activityId)) {
              window.removeEventListener("message", handleMessage, true);
              return;
            }

            // Check if tile is in view. For amp we supply the intersection ratio between
            // the parent viewport and the iframe. This is multipled by the iframe window
            // size (currently only height) to determine effective visible viewport in the iframe
            if (BibblioUtils.isRecommendationTileInView(moduleElement,
                                                        message.data.changes[0].boundingClientRect,
                                                        message.data.changes[0].intersectionRatio)) {
              BibblioEvents.onRecommendationViewed(options, recommendationsResponse, callback);
            }


          }
        }, visibilityTimeout);

        window.parent.postMessage({
          sentinel: 'amp',
          type: 'send-intersections'
        }, '*');

        window.addEventListener('message', handleMessage, true);
      } else {
        // Check if the module is in view immediately after rendered
        if (BibblioUtils.isRecommendationTileInView(moduleElement, moduleElement.getBoundingClientRect())) {
          BibblioEvents.onRecommendationViewed(options, recommendationsResponse, callback);
        } else {
          var handleScroll = limitExecutionRate(function () {
            if (BibblioUtils.hasModuleBeenViewed(activityId)) {
              window.removeEventListener("scroll", handleScroll, true);
              return;
            }

            if (BibblioUtils.isRecommendationTileInView(moduleElement, moduleElement.getBoundingClientRect())) {
              BibblioEvents.onRecommendationViewed(options, recommendationsResponse, callback);
            }
          }, visibilityTimeout);

          window.addEventListener('scroll', handleScroll, true);
        }
      }
    },

    isRecommendationTileInView: function(container, boundingClientRect, visibleRatio) {
      if (container) {
        var tiles = container.getElementsByClassName("bib__link");
        var scrollableParents = BibblioUtils.getScrollableParents(container, boundingClientRect);
        if(scrollableParents !== false) {
          for(var i = 0; i < tiles.length; i++) {
            if(BibblioUtils.isTileVisible(tiles[i], scrollableParents, visibleRatio))
              return true;
          }
        }
      }
      return false;
    },

    getScrollableParents: function(moduleElement, moduleRect) {
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

    isTileVisible: function(tile, scrollableParents, visibleRatio) {
      if (typeof visibleRatio === 'undefined') { visibleRatio = 1.0; }
      var tileRect = tile.getBoundingClientRect();
      var tileWidth = tileRect.right - tileRect.left;
      var tileHeight = tileRect.bottom - tileRect.top;

      // is tile displayed
      if(tileHeight == 0)
        return false;

      // is tile in window's current viewport
      var isInVerticleView, isInHorizontalView;
      isInVerticleView  = tileHeight <= (window.innerHeight * visibleRatio) &&    // isn't higher than viewport. adjust to visible ratio if supplied for AMP
                          tileRect.bottom <= window.innerHeight;                  // whole tile height is within viewport
      isInHorizontalView  = tileWidth <= window.innerWidth &&                     // isn't wider than viewport
                            tileRect.right <= window.innerWidth;                  // whole tile width in within viewport
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
              var response;
              if (xmlhttp.getResponseHeader('content-type') == "application/json") {
                response = JSON.parse(xmlhttp.responseText);
              }
              BibblioUtils.httpCallback(callback, response, xmlhttp.status);
            }
            catch (err) {
              BibblioUtils.httpCallback(callback, {}, xmlhttp.status);
            }
          }
        };
        xmlhttp.open(method, url, isAsync);
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
      return recsData.filter(function(element) { return element["contentItemId"] == contentItemId; })[0];
    },

    getModuleStyleClasses: function(moduleSettings) {
      return (moduleSettings.styleClasses ? moduleSettings.styleClasses : BibblioUtils.getPresetModuleClasses(moduleSettings.stylePreset));
    },

    shouldTruncate: function(field, styles) {
      switch(field) {
        case "title": return (styles.indexOf('bib--txt') === -1) && (styles.indexOf('bib--tall') === -1) && (styles.indexOf('bib--split') === -1);
        case "subtitle": return (styles.indexOf('bib--txt') === -1) && (styles.indexOf('bib--tall') === -1);
      }

      return true;
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
      var extraCutOffLength = 10;

      var shouldTruncate = (name.length > (truncationLength + extraCutOffLength)) &&
                           (BibblioUtils.shouldTruncate("title", styles));

      if(shouldTruncate) {
        return name.substring(0, truncationLength) + "…";
      } else {
        return name;
      }
    },

    truncateText: function(text, minCharacters, maxCharacters) {
      if(text.length <= minCharacters)
        return text;

      var truncatedText = text.substring(0, maxCharacters);
      var fullStopIndex = truncatedText.indexOf('.', minCharacters);  // first full stop starting at min character length

      if(fullStopIndex === -1)
        return text.substring(0, minCharacters) + "…";

      return text.substring(0, fullStopIndex + 1);
    },

    truncateSubtitle: function(subtitle, styles) {
      var truncateLength = 130;
      var searchBounds = 10; // search for full stop between 'length - searchBounds' and 'length + searchBounds'
      var subtitleLength = subtitle.length;

      if((subtitleLength > truncateLength) && (BibblioUtils.shouldTruncate("subtitle", styles))) {
        // truncates to full stop between min and max length if it exists
        return BibblioUtils.truncateText(subtitle, truncateLength - searchBounds, truncateLength + searchBounds);
      }

      return subtitle;
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
      var userMetadata = options.userMetadata ? options.userMetadata : null;

      var activityData = BibblioActivity.constructOnClickedActivityData({
          sourceContentItemId: sourceContentItemId,
          clickedContentItemId: clickedContentItemId,
          clickedContentItemHref: event.currentTarget.getAttribute("href"),
          catalogueIds: options.catalogueIds,
          relatedContentItems: relatedContentItems,
          instrument: {
            type: "BibblioRelatedContent",
            version: Bibblio.moduleVersion,
            config: moduleSettings
          },
          userId: userId,
          userMetadata: userMetadata
        });

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
        var userMetadata = options.userMetadata ? options.userMetadata : null;

        var activityData = BibblioActivity.constructOnViewedActivityData({
            sourceContentItemId: sourceContentItemId,
            catalogueIds: options.catalogueIds,
            relatedContentItems: relatedContentItems,
            instrument: {
              type: "BibblioRelatedContent",
              version: Bibblio.moduleVersion,
              config: moduleSettings
            },
            userId: userId,
            userMetadata: userMetadata
          });

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
                                          <% siteHTML %>\
                                        </span>\
                                        <span class="bib__preview">\
                                          <% subtitleHTML %>\
                                        </span>\
                                    </span>\
                                    </a>',

    subtitleTemplate: '<span class="bib__description"><% subtitle %></span>',

    authorTemplate: '<span class="bib__author"><% author %></span>',

    siteTemplate: '<span class="bib__site"><% domain %></span>',

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
        var styleClasses = BibblioUtils.getModuleStyleClasses(moduleSettings);
        var truncatedSubtitle = BibblioUtils.truncateSubtitle(subtitleField, styleClasses);
        var templateOptions = {
          subtitle: truncatedSubtitle
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

    getSiteHTML: function(contentItem) {
      var siteHTML = '';
      try {
        var syndicationField = BibblioUtils.getDomainName(contentItem.fields.url);
        var templateOptions = {
          domain: syndicationField
        };
        siteHTML = BibblioTemplates.getTemplate(BibblioTemplates.siteTemplate, templateOptions);
      } catch (e) {

      }

      return siteHTML;
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

      if ((url.indexOf("http://") === 0) || (url.indexOf("https://") === 0) || (url.indexOf("data:image/") === 0)) {
        return url;
      } else {
        var withProtocol = "http://" + url;
        return withProtocol;
      }
    },

    getRelatedContentItemHTML: function(contentItem, contentItemIndex, options, moduleSettings) {

      // Create template for subtitle
      var subtitleHTML = BibblioTemplates.getSubtitleHTML(contentItem, moduleSettings);
      // Create template for author
      var authorHTML = BibblioTemplates.getAuthorHTML(contentItem, moduleSettings);
      // Create template for datePublished
      var datePublishedHTML = BibblioTemplates.getDatePublishedHTML(contentItem, moduleSettings);
      // Create template for site domain
      var siteHTML = BibblioTemplates.getSiteHTML(contentItem);

      // Create template for related content item
      var contentItemUrl = (contentItem.fields.url ? contentItem.fields.url : '');

      // Choose module image
      var contentItemImageUrl = "";
      if(contentItem.fields.moduleImage) {
        if(contentItem.fields.moduleImage.cdnUrl) {
          contentItemImageUrl = BibblioTemplates.filterContentItemImageUrl(contentItem.fields.moduleImage.cdnUrl);
        }
        else if(contentItem.fields.moduleImage.contentUrl) {
          contentItemImageUrl = BibblioTemplates.filterContentItemImageUrl(contentItem.fields.moduleImage.contentUrl);
        }
      }

      var classes = BibblioUtils.getModuleStyleClasses(moduleSettings);

      var templateOptions = {
          contentItemId: (contentItem.contentItemId ? contentItem.contentItemId : ''),
          name: BibblioUtils.truncateTitle((contentItem.fields.name ? contentItem.fields.name   : ''), classes, moduleSettings.truncateTitle),
          authorHTML: authorHTML,
          siteHTML: siteHTML,
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

    constructOnClickedActivityData: function(options) {
      var activityData = {
        "type": "Clicked",
        "object": BibblioActivity.constructActivityObject(options.clickedContentItemId, options.clickedContentItemHref),
        "context": BibblioActivity.constructActivityContext(options.sourceContentItemId, options.catalogueIds, options.relatedContentItems),
        "instrument": BibblioActivity.constructActivityInstrument(options.instrument)
      };

      if(options.userId != null && options.userMetadata != null) {
        activityData["actor"] = {"userId": options.userId,
                                 "userMetadata": options.userMetadata};
      } else if (options.userId != null) {
        activityData["actor"] = {"userId": options.userId};
      }

      return activityData;
    },

    constructOnViewedActivityData: function(options) {
      var activityData = {
        "type": "Viewed",
        "context": BibblioActivity.constructActivityContext(options.sourceContentItemId, options.catalogueIds, options.relatedContentItems),
        "instrument": BibblioActivity.constructActivityInstrument(options.instrument)
      };

      if(options.userId != null && options.userMetadata != null) {
        activityData["actor"] = {"userId": options.userId,
                                 "userMetadata": options.userMetadata};
      } else if (options.userId != null) {
        activityData["actor"] = {"userId": options.userId};
      }

      return activityData;
    },

    constructActivityInstrument: function(instrument) {
      return {
          "type": instrument.type,
          "version": instrument.version,
          "config": instrument.config
      };
    },

    constructActivityObject: function(clickedContentItemId, clickedContentItemHref) {
      return [["contentItemId", clickedContentItemId],
              ["href", clickedContentItemHref]];
    },

    constructActivityContext: function(sourceContentItemId, catalogueIds, relatedContentItems) {
      var context = [];
      var href = ((typeof window !== 'undefined') && window.location && window.location.href) ? window.location.href : '';

      context.push(["sourceHref", href]);
      if (sourceContentItemId) {
        context.push(["sourceContentItemId", sourceContentItemId]);
      }

      for(var i = 0; i < relatedContentItems.length; i++) {
        context.push(["recommendations.contentItemId", relatedContentItems[i].contentItemId]);
      }

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
      document.addEventListener("DOMContentLoaded", Bibblio.autoInit);
    } else {  // `DOMContentLoaded` already fired
      Bibblio.autoInit();
    }
  }
})();
