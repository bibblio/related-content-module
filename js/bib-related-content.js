"use strict";

(function() {
  var isNodeJS = false;
  var XMLHttpRequestNodeJS = false;

  // support for NodeJS, which doesn't support XMLHttpRequest natively
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    isNodeJS = true;
    XMLHttpRequestNodeJS = require('xmlhttprequest').XMLHttpRequest;
  }

  // Bibblio module
  var Bibblio = {
    trackedRecommendations: [],
    moduleHasBeenViewed: false,
    moduleVersion: "1.1.11",

    outerModuleTemplate: "<ul class=\"bib__module <%= classes %>\">\
                                    <%= recommendedContentItems %>\
                                    <a href=\"http://bibblio.org/about\" target=\"_blank\" class=\"bib__origin\">Refined by</a>\
                                 </ul>",

    relatedContentItemTemplate: "<li class=\"bib__tile bib__tile--<%= tileNumber %>\">\
                                            <a href=\"<%= url %>\" target=\"<%= Bibblio.linkTargetFor(url) %>\"  <%= Bibblio.linkRelFor(url) %> data=\"<%= contentItemId %>\" class=\"bib__link <%= (imageUrl ? 'bib__link--image' : '') %>\" <%= (imageUrl ? 'style=\"background-image: url(' + imageUrl + ')' : '') %>\">\
                                                <span class=\"bib__container\">\
                                                    <span class=\"bib__info\">\
                                                        <span class=\"bib__title\"><span><%= name %></span></span>\
                                                        <% if (typeof(attributes) != \"undefined\") { %>\
                                                          <span class=\"bib__attributes\">\
                                                              <% if (attributes['duration']) { %> <span class=\"bib__duration\"><%= attributes['duration'] %></span> <% } %>\
                                                              <% if (attributes['author']) { %> <span class=\"bib__author\"><%= attributes['author'] %></span> <% } %>\
                                                              <% if (attributes['recency']) { %> <span class=\"bib__recency\"><%= attributes['recency'] %></span> <% } %>\
                                                          </span>\
                                                        <% } %>\
                                                        <% if (subtitle) { %><span class=\"bib__preview\"><%= subtitle %></span><% } %>\
                                                        <% if (showRelatedBy && relatedBy.length > 0) { %>\
                                                          <span class=\"bib__terms\">\
                                                              <span class=\"bib__term-label\">Related by</span>\
                                                              <span class=\"bib__term-list\">\
                                                                  <span class=\"bib__term-item\"><%= relatedBy[0] %></span>\
                                                                  <span class=\"bib__term-item\"><%= relatedBy[1] %></span>\
                                                                  <span class=\"bib__term-item\"><%= relatedBy[2] %></span>\
                                                              </span>\
                                                          </span>\
                                                        <% } %>\
                                                    </span>\
                                                </span>\
                                            </a>\
                                        </li>",

    initRelatedContent: function(containerId, accessToken, contentItemId, options, callbacks) {
      // This uses partial function application to bind the template and render arguments to a
      // new (partially applied) version of the Bibblio.displayRelatedContent function. That function can
      // then be passed around as a callback without worrying about the template arguments.
      // i.e. the templates are at this point bound to the rest of the function call chain.
      // Modify the global Bibblio.relatedContentItemTemplate and Bibblio.outerModuleTemplate variables
      // if you want to change the templates.
      var catalogueIds = options.catalogueIds || [];
      var moduleSettings = Bibblio.initModuleSettings(options);
      var callbacks = callbacks || {};

      var displayWithTemplates = _.partial(Bibblio.displayRelatedContent,
                                           containerId,
                                           Bibblio.outerModuleTemplate,
                                           Bibblio.relatedContentItemTemplate,
                                           moduleSettings,
                                           _);

      var submitClickedActivityData = _.partial(Bibblio.onRecommendationClick,
                                         containerId,
                                         contentItemId,
                                         catalogueIds,
                                         moduleSettings,
                                         _,
                                         _,
                                         _,
                                         _);

      var submitViewedActivityData = _.partial(Bibblio.onRecommendationViewed,
                                        moduleSettings,
                                        contentItemId,
                                        catalogueIds,
                                        _,
                                        _);

      var renderModule = _.partial(Bibblio.renderModule,
                                   containerId,
                                   displayWithTemplates,
                                   submitClickedActivityData,
                                   submitViewedActivityData,
                                   callbacks,
                                   _);

      // Gets the related content items and passes the partially-applied display function as a callback.
      Bibblio.getRelatedContentItems(accessToken, contentItemId, catalogueIds, moduleSettings, renderModule);
    },

    getRelatedContentItems: function(accessToken, contentItemId, catalogueIds, moduleSettings, successCallback) {
      var subtitleField = moduleSettings.subtitleField;
      var userId = moduleSettings.userId;
      var xmlhttp = (XMLHttpRequestNodeJS) ? new XMLHttpRequestNodeJS() : new XMLHttpRequest();
      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
          if (xmlhttp.status === 200) {
            var response = JSON.parse(xmlhttp.responseText);
            successCallback(response);
          } else if (isNodeJS) {
            successCallback(new Error(xmlhttp.status));
          }
        }
      };
      // URL arguments should be injected but the module only supports these settings now anyway.
      var fields = ["name", "url", "moduleImage"].concat(Bibblio.getRootProperty(subtitleField)).filter(Boolean); // filter out falsey values
      var url = Bibblio.recommendationUrl(userId, contentItemId, catalogueIds, 6, 1, fields);
      xmlhttp.open("GET", url, true);
      xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
      xmlhttp.send();
    },

    renderModule: function(containerId, displayWithTemplates, submitClickedActivityData, submitViewedActivityData, callbacks, recommendationsResponse) {
      var relatedContentItems = [];
      var trackingLink = null;
      try {
        relatedContentItems = recommendationsResponse.results;
        trackingLink = recommendationsResponse._links.tracking.href;
      } catch(err) {}
      var submitClickedActivityData = _.partial(submitClickedActivityData, relatedContentItems, trackingLink, _, _);
      var submitViewedActivityData = _.partial(submitViewedActivityData, relatedContentItems, trackingLink, _)
      displayWithTemplates(relatedContentItems);
      Bibblio.bindRelatedContentItemLinks(submitClickedActivityData, callbacks);
      Bibblio.setOnViewedListeners(containerId, submitViewedActivityData, callbacks);
    },

    displayRelatedContent: function(containerId,
                                        outerModuleTemplate,
                                        contentItemTemplate,
                                        moduleSettings,
                                        relatedContentItems) {
      var relatedContentItemCountainer = document.getElementById(containerId);
      var relatedContentItemPanels = _.map(relatedContentItems, function (contentItem, index) {
          return Bibblio.renderContentItemTemplate(contentItem,
                                               index,
                                               contentItemTemplate,
                                               moduleSettings);
      }).join('\n');
      var module = Bibblio.renderOuterModuleTemplate(moduleSettings, relatedContentItemPanels, outerModuleTemplate);
      relatedContentItemCountainer.innerHTML = module;
    },

    renderOuterModuleTemplate: function(moduleSettings, contentItemsHTML, outerModuleTemplate) {
      // If style classes are specified then omit styled preset
      var classes = moduleSettings.styleClasses ? moduleSettings.styleClasses : Bibblio.getPresetModuleClasses(moduleSettings.stylePreset);
      var compiled = _.template(outerModuleTemplate);
      var varBindings = {
          classes: classes,
          recommendedContentItems: contentItemsHTML
      };
      return compiled(varBindings);
    },

    stripImgProtocol: function(contentUrl) {
      if (contentUrl) {
        return contentUrl.replace(/^https?\:/, "");
      }
    },

    renderContentItemTemplate: function(contentItem, contentItemIndex, contentItemTemplate, moduleSettings) {
      var compiled = _.template(contentItemTemplate);
      var varBindings = {
          contentItemId: contentItem.contentItemId,
          name: contentItem.fields.name,
          url: contentItem.fields.url,
          subtitle: Bibblio.getProperty(contentItem.fields, moduleSettings.subtitleField),
          imageUrl: (contentItem.fields.moduleImage ? Bibblio.stripImgProtocol(contentItem.fields.moduleImage.contentUrl) : null),
          relatedBy: contentItem.relationships.inCommon,
          tileNumber: (contentItemIndex + 1),
          showRelatedBy: moduleSettings.showRelatedBy
      };
      return compiled(varBindings);
    },

    recommendationUrl: function(userId, contentItemId, catalogueIds, limit, page, fields) {
      var baseUrl = "https://api.bibblio.org/v1";
      var querystringArgs = [
          "limit=" + limit,
          "page=" + page,
          "fields=" + fields.join(",")
      ];

      if (catalogueIds.length > 0) {
          querystringArgs.push("catalogueIds=" + catalogueIds.join(","));
      }

      if (userId !== null) {
          querystringArgs.push("userId=" + userId);
      }

      // TODO: make this much nicer
      return baseUrl + "/content-items/" + contentItemId + "/recommendations?" + querystringArgs.join("&");
    },

    getPresetModuleClasses: function(stylePreset) {
      var presets = {
          "grid-4": "bib--grd-4 bib--wide",
          "box-5": "bib--box-5 bib--wide",
          "box-6": "bib--box-6 bib--wide"
      };
      return presets[stylePreset] || presets["box-6"];
    },

    linkRelFor: function(url) {
      var currentdomain = window.location.hostname;
      var matches = (Bibblio.getDomainName(currentdomain) == Bibblio.getDomainName(url));
      return (matches ? '' : ' rel="noopener noreferrer" ');
    },

    linkTargetFor: function(url) {
      var currentdomain = window.location.hostname;
      var matches = (Bibblio.getDomainName(currentdomain) == Bibblio.getDomainName(url));
      return (matches ? '_self' : '_blank');
    },

    getDomainName: function(url) {
      var r = /^(?:https?:\/\/)?(?:www\.)?(.[^/]+)/;
      var matchResult = url.match(r);
      return (url.match(r) ? matchResult[1].replace('www.', '') : "");
    },

    getProperty: function(properties, accessor) {
      if (accessor == false || accessor == undefined) {
          return accessor;
      } else {
          var reduceProps = function(props, field) { return (props == undefined ? undefined : props[field] ); };
          return _.reduce(accessor.split("."), reduceProps, properties);
      }
    },

    getRootProperty: function(accessor) {
      if (accessor == false || accessor == undefined) {
          return accessor;
      } else {
         return accessor.split(".")[0];
      }
    },

    validateField: function(accessor) {
      // TODO: this is not ideal. Can we get the valid fields programmatically?
      //       Else change the feature spec and be willing to fail with 422 if field is wrong?
      var validFields = [
          "name",
          "url",
          "text",
          "description",
          "keywords",
          "learningResourceType",
          "thumbnail",
          "image",
          "moduleImage",
          "video",
          "dateCreated",
          "dateModified",
          "datePublished",
          "provider",
          "publisher"];
      return _.contains(validFields, Bibblio.getRootProperty(accessor));
    },

    bindRelatedContentItemLinks: function(submitClickedActivityData, callbacks) {
      var relatedContentItemlinks = document.getElementsByClassName("bib__link");
      for (var i = 0; i < relatedContentItemlinks.length; i++) {

        // This event is only here for the callback on left clicks
        relatedContentItemlinks[i].addEventListener('click', function(event) {
          var callback = null;

          if (event.which == 1 && callbacks.onRecommendationClick) { // Left click
            callback = callbacks.onRecommendationClick;
          }

          Bibblio.triggerRecommendationClickedEvent(submitClickedActivityData, event, callback);
        }, false);

        relatedContentItemlinks[i].addEventListener('mousedown', function(event) {
          if (event.which == 3)

            Bibblio.triggerRecommendationClickedEvent(submitClickedActivityData, event);
        }, false);

        relatedContentItemlinks[i].addEventListener('mouseup', function(event) {
        	if (event.which < 4) {
        		Bibblio.triggerRecommendationClickedEvent(submitClickedActivityData, event);
        	}
        }, false);

        relatedContentItemlinks[i].addEventListener('auxclick', function(event) {
          if (event.which < 4) {
            Bibblio.triggerRecommendationClickedEvent(submitClickedActivityData, event);
          }
        }, false);

        relatedContentItemlinks[i].addEventListener('keydown', function(event) {
          if (event.which == 13) {
            Bibblio.triggerRecommendationClickedEvent(submitClickedActivityData, event);
          }
        }, false);
      }
    },

    setOnViewedListeners: function(containerId, submitViewedActivityData, callbacks) {
      var callback = null;
      if(callbacks.onRecommendationViewed) {
        callback = callbacks.onRecommendationViewed;
      }

      // Check if the module is in view after rendered
      if(Bibblio.isRecommendationTileInView(containerId)) {
        Bibblio.triggerRecommendationViewedEvent(submitViewedActivityData, callback);
      }
      else {
        var ticking = false;
        var visiblityCheckDelay = 50;
        // Scroll event
        var eventListener = function(event) {
          if(Bibblio.moduleHasBeenViewed){
            window.removeEventListener("scroll", eventListener, true);
            return;
          }
          if(!ticking) {
            window.setTimeout(function() {
              if(Bibblio.isRecommendationTileInView(containerId))
                Bibblio.triggerRecommendationViewedEvent(submitViewedActivityData, callback);
              ticking = false;
            }, visiblityCheckDelay);
          }
          ticking = true;
        }
        window.addEventListener('scroll', eventListener, true);
      }
    },

    isRecommendationTileInView: function(containerId) {
      var tiles = document.getElementsByClassName("bib__tile");
      var scrollableParents = Bibblio.getScrollableParents(containerId);
      if(scrollableParents !== false) {
        for(var i = 0; i < tiles.length; i++) {
          if(Bibblio.isTileVisible(tiles[i], scrollableParents))
            return true;
        }
      }
      return false;
    },

    hasScrollableOverflow: function(overflowProp) {
      return overflowProp === "scroll" || overflowProp === "auto" || overflowProp === "hidden";
    },

    getScrollableParents: function(containerId) {
      var moduleElement = document.getElementById(containerId);
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
        isScrollable = Bibblio.hasScrollableOverflow(parentStyle.getPropertyValue("overflow-x")) ||
                       Bibblio.hasScrollableOverflow(parentStyle.getPropertyValue("overflow-y"));
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

    triggerRecommendationClickedEvent: function(submitClickedActivityData, event, callback) {
      var clickedContentItemId = event.currentTarget.getAttribute("data");
      submitClickedActivityData(clickedContentItemId, event, callback);
    },

    triggerRecommendationViewedEvent: function(submitViewedActivityData, callback) {
      if(!Bibblio.moduleHasBeenViewed) {
        submitViewedActivityData(callback);
      }
      Bibblio.moduleHasBeenViewed = true;
    },

    onRecommendationClick: function(containerId, sourceContentItemId, catalogueIds, moduleSettings, relatedContentItems, trackingLink, clickedContentItemId, event, callback) {
      var activityData = BibblioActivity.constructOnClickedActivityData(
          sourceContentItemId,
          clickedContentItemId,
          catalogueIds,
          relatedContentItems,
          {
              type: "BibblioRelatedContent",
              version: Bibblio.moduleVersion,
              config: moduleSettings
          },
          moduleSettings.userId
      );

      if (Bibblio.trackedRecommendations.indexOf(clickedContentItemId) === -1) {
        var response = BibblioActivity.track(trackingLink, activityData);
        Bibblio.trackedRecommendations.push(clickedContentItemId);
      }

      // Call client callback if it exists
      if (callback != null && typeof callback === "function") {
          callback(activityData, event);
      }
    },

    onRecommendationViewed: function(moduleSettings, sourceContentItemId, catalogueIds, relatedContentItems, trackingLink, callback) {
      var activityData = BibblioActivity.constructOnViewedActivityData(
          sourceContentItemId,
          catalogueIds,
          relatedContentItems,
          {
              type: "BibblioRelatedContent",
              version: Bibblio.moduleVersion,
              config: moduleSettings
          },
          moduleSettings.userId
      );

      var response = BibblioActivity.trackAsync(trackingLink, activityData);

      // Call client callback if it exists
      if (callback != null && typeof callback === "function") {
          callback(activityData);
      }
    },

    initModuleSettings: function(options) {
      var moduleSettings = {};
      moduleSettings.stylePreset = options.stylePreset || "default";
      moduleSettings.styleClasses = options.styleClasses || false;
      moduleSettings.showRelatedBy = options.showRelatedBy || false;
      moduleSettings.subtitleField = (Bibblio.validateField(options.subtitleField) ? options.subtitleField : "headline");
      moduleSettings.userId = options.userId || null;
      return moduleSettings;
    }
  };

  // BibblioActivity module
  var BibblioActivity = {
    track: function(trackingLink, activityData) {
      if(trackingLink != null) {
        var requestBody = BibblioActivity.constructRequestBody(activityData);
        var httpClient = BibblioActivity.constructHttpClient(trackingLink, false);
        return httpClient.send(requestBody);
      }
    },

    trackAsync: function(trackingLink, activityData){
      if(trackingLink != null) {
        var requestBody = BibblioActivity.constructRequestBody(activityData);
        var httpClient = BibblioActivity.constructHttpClient(trackingLink, true);
        return httpClient.send(requestBody);
      }
    },

    constructRequestBody: function(activityData) {
      return JSON.stringify(activityData);
    },

    constructHttpClient: function(trackingLink, isAsyncClient) {
      var url = trackingLink;
      var httpClient = (XMLHttpRequestNodeJS) ? new XMLHttpRequestNodeJS() : new XMLHttpRequest();
      httpClient.open("POST", url, isAsyncClient);
      httpClient.setRequestHeader('Content-Type', 'application/json');
      return httpClient;
    },

    constructOnClickedActivityData: function(sourceContentItemId, clickedContentItemId, catalogueIds, relatedContentItems, instrument, userId) {
      var activityData = {
        "type": "Clicked",
        "object": BibblioActivity.constructActivityObject(clickedContentItemId),
        "context": BibblioActivity.constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems),
        "instrument": BibblioActivity.constructActivityInstrument(instrument),
      };
      if(userId != null)
        activityData["actor"] = {"userId": userId};

      return activityData;
    },

    constructOnViewedActivityData: function(sourceContentItemId, catalogueIds, relatedContentItems, instrument, userId) {
      var activityData = {
        "type": "Viewed",
        "context": BibblioActivity.constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems),
        "instrument": BibblioActivity.constructActivityInstrument(instrument),
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
      context.push(["sourceContentItemId", sourceContentItemId]);
      context = context.concat(_.map(relatedContentItems, function(contentItem) {
        return ["recommendations.contentItemId", contentItem.contentItemId]
      }));

      // include all specified catalogue ids in the context
      // but assume recommendations are from the source content item's catalogue if no catalogues were specified
      if (catalogueIds && (catalogueIds.length > 0)) {
        context = context.concat(_.map(catalogueIds, function(catalogueId) {
          return ["recommendations.catalogueId", catalogueId]
        }));
      } else {
        if (relatedContentItems[0].catalogueId) {
          context.push(["recommendations.catalogueId", relatedContentItems[0].catalogueId]);
        }
      }

      return context;
    }
  };

  if (isNodeJS) {
    module.exports = {Bibblio: Bibblio, BibblioActivity: BibblioActivity};
  } else {
    window.Bibblio = Bibblio;
    window.BibblioActivity = BibblioActivity;
  }
})();
