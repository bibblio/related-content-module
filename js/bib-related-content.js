"use strict";

(function() {
  var isNodeJS = false;
  var XMLHttpRequestNodeJS = false;

  // support for NodeJS, which doesn't support XMLHttpRequest natively
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    isNodeJS = true;
    XMLHttpRequestNodeJS = require('xmlhttprequest').XMLHttpRequest;
  }

  var Bibblio = {
    outerModuleTemplate: "<ul class=\"<%= classes %>\">\
                                    <%= recommendedContentItems %>\
                                 </ul>",

    relatedContentItemTemplate: "<li class=\"bib__tile bib__tile--<%= tileNumber %>\">\
                                            <a href=\"<%= url %>\" target=\"<%= Bibblio.linkTargetFor(url) %>\" data=\"<%= contentItemId %>\" class=\"bib__link <%= (imageUrl ? 'bib__link--image' : '') %>\" <%= (imageUrl ? 'style=\"background-image: url(' + imageUrl + ')' : '') %>\">\
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

      var displayWithTemplates = _.partial(Bibblio.displayRelatedContent,
                                           containerId,
                                           Bibblio.outerModuleTemplate,
                                           Bibblio.relatedContentItemTemplate,
                                           moduleSettings,
                                           _);

      var submitActivityData = _.partial(Bibblio.onRecommendationClick,
                                         containerId,
                                         contentItemId,
                                         catalogueIds,
                                         moduleSettings,
                                         callbacks,
                                         _,
                                         _);

      var renderModule = _.partial(Bibblio.renderModule,
                                   displayWithTemplates,
                                   submitActivityData,
                                   _);

      // Gets the related content items and passes the partially-applied display function as a callback.
      Bibblio.getRelatedContentItems(accessToken, contentItemId, catalogueIds, moduleSettings.subtitleField, renderModule);
    },

    getRelatedContentItems: function(accessToken, contentItemId, catalogueIds, subtitleField, successCallback) {
      var xmlhttp = (XMLHttpRequestNodeJS) ? new XMLHttpRequestNodeJS() : new XMLHttpRequest();
      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
          if (xmlhttp.status === 200) {
            var response = JSON.parse(xmlhttp.responseText);
            successCallback(response.results);
          } else if (isNodeJS) {
            successCallback(new Error(xmlhttp.status));
          }
        }
      };
      // URL arguments should be injected but the module only supports these settings now anyway.
      var fields = ["name", "url", "moduleImage"].concat(Bibblio.getRootProperty(subtitleField)).filter(Boolean); // filter out falsey values
      var url = Bibblio.recommendationUrl(contentItemId, catalogueIds, 6, 1, fields);
      xmlhttp.open("GET", url, true);
      xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
      xmlhttp.send();
    },

    renderModule: function(displayWithTemplates, submitActivityData, relatedContentItems) {
      var submitActivityData = _.partial(submitActivityData, relatedContentItems, _);
      displayWithTemplates(relatedContentItems);
      Bibblio.bindRelatedContentItemLinks(submitActivityData);
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
      // If style classes are specified then ommit styled preset
      var classes = moduleSettings.styleClasses ? moduleSettings.styleClasses : Bibblio.getPresetModuleClasses(moduleSettings.stylePreset);
      var compiled = _.template(outerModuleTemplate);
      var varBindings = {
          classes: classes,
          recommendedContentItems: contentItemsHTML
      };
      return compiled(varBindings);
    },

    renderContentItemTemplate: function(contentItem, contentItemIndex, contentItemTemplate, moduleSettings) {
      var compiled = _.template(contentItemTemplate);
      // var compiled = 'test';
      var varBindings = {
          contentItemId: contentItem.contentItemId,
          name: contentItem.fields.name,
          url: contentItem.fields.url,
          subtitle: Bibblio.getProperty(contentItem.fields, moduleSettings.subtitleField),
          imageUrl: (contentItem.fields.moduleImage ? contentItem.fields.moduleImage.contentUrl : null),
          relatedBy: contentItem.relationships.inCommon,
          tileNumber: (contentItemIndex + 1),
          showRelatedBy: moduleSettings.showRelatedBy
      };
      return compiled(varBindings);
    },

    recommendationUrl: function(contentItemId, catalogueIds, limit, page, fields) {
      var querystringArgs = [
          "limit=" + limit,
          "page=" + page,
          "fields=" + fields.join(",")
      ];

      if (catalogueIds.length > 0) {
          querystringArgs.push("catalogueIds=" + catalogueIds.join(","));
      }

      // TODO: make this much nicer
      return "https://api.bibblio.org/content-items/" + contentItemId + "/recommendations?" + querystringArgs.join("&");
    },

    getPresetModuleClasses: function(stylePreset) {
      var presets = {
          "grid-4": "bib__module bib--grd-4 bib--wide",
          "box-5": "bib__module bib--box-5 bib--wide",
          "box-6": "bib__module bib--box-6 bib--wide"
      };
      return presets[stylePreset] || presets["box-6"];
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

    bindRelatedContentItemLinks: function(submitActivityData) {
      var relatedContentItemlinks = document.getElementsByClassName("bib__link");
      for (var i = 0; i < relatedContentItemlinks.length; i++) {
          relatedContentItemlinks[i].addEventListener('click', function() {
              var contentItemId = Bibblio.getAttribute("data");
              submitActivityData(contentItemId);
          }, false);
      }
    },

    onRecommendationClick: function(containerId, sourceContentItemId, catalogueIds, moduleSettings, callbacks, relatedContentItems, clickedContentItemId) {
      if (Bibblio.recommendationActivityTrackingIsEnabled(callbacks)) {
          callbacks.onRecommendationClick(Bibblio.constructActivityData(
              "Clicked",
              sourceContentItemId,
              clickedContentItemId,
              catalogueIds,
              relatedContentItems,
              {
                  name: "bibblio-related-content",
                  version: "0.8",
                  config: moduleSettings
              }
          ));
      }
    },

    recommendationActivityTrackingIsEnabled: function(callbacks) {
      return (_.isFunction(callbacks.onRecommendationClick) && _.isFunction(Bibblio.constructActivityData)) ? true : false;
    },

    initModuleSettings: function(options) {
      var moduleSettings = {};
      moduleSettings.stylePreset = options.stylePreset || "default";
      moduleSettings.styleClasses = options.styleClasses || false;
      moduleSettings.showRelatedBy = options.showRelatedBy || false;
      moduleSettings.subtitleField = (Bibblio.validateField(options.subtitleField) ? options.subtitleField : "headline");
      return moduleSettings;
    }
  };

  if (isNodeJS) {
    module.exports = Bibblio;

  } else {
    window.Bibblio = Bibblio;
  }
})();
