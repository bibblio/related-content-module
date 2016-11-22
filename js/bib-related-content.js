"use strict";

var bib_outerModuleTemplate = "<ul class=\"<%= classes %>\">\
                                  <%= recommendedContentItems %>\
                               </ul>";

var bib_relatedContentItemTemplate = "<li class=\"bib__tile bib__tile--<%= tileNumber %>\">\
                                          <a href=\"<%= url %>\" target=\"<%= bib_linkTargetFor(url) %>\" data=\"<%= contentItemId %>\" class=\"bib__link <%= (imageUrl ? 'bib__link--image' : '') %>\" <%= (imageUrl ? 'style=\"background-image: url(' + imageUrl + ')' : '') %>\">\
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
                                      </li>";

function bib_initRelatedContent(containerId, accessToken, contentItemId, options, callbacks) {
    // This uses partial function application to bind the template and render arguments to a
    // new (partially applied) version of the bib_displayRelatedContent function. That function can
    // then be passed around as a callback without worrying about the template arguments.
    // i.e. the templates are at this point bound to the rest of the function call chain.
    // Modify the global bib_relatedContentItemTemplate and bib_outerModuleTemplate variables
    // if you want to change the templates.
    var catalogueIds = options.catalogueIds || [];
    var moduleSettings = bib_initModuleSettings(options);

    var displayWithTemplates = _.partial(bib_displayRelatedContent, 
                                         containerId,
                                         bib_outerModuleTemplate,
                                         bib_relatedContentItemTemplate,
                                         moduleSettings,
                                         _);    

    var submitActivityData = _.partial(bib_onRecommendationClick,
                                       containerId,
                                       contentItemId,
                                       catalogueIds,
                                       moduleSettings,
                                       callbacks,
                                       _,
                                       _);

    var renderModule = _.partial(bib_renderModule,
                                 displayWithTemplates,
                                 submitActivityData,
                                 _);

    // Gets the related content items and passes the partially-applied display function as a callback.
    bib_getRelatedContentItems(accessToken, contentItemId, catalogueIds, moduleSettings.subtitleField, renderModule);
}

function bib_getRelatedContentItems(accessToken, contentItemId, catalogueIds, subtitleField, successCallback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var response = JSON.parse(xmlhttp.responseText);
            successCallback(response.results);
        }
    };
    // URL arguments should be injected but the module only supports these settings now anyway.
    var fields = ["name", "url", "squareImage"].concat(bib_getRootProperty(subtitleField)).filter(Boolean); // filter out falsey values
    var url = bib_recommendationUrl(contentItemId, catalogueIds, 6, 1, fields);
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
    xmlhttp.send();
}

function bib_renderModule(displayWithTemplates, submitActivityData, relatedContentItems) {
    var submitActivityData = _.partial(submitActivityData, relatedContentItems, _);
    displayWithTemplates(relatedContentItems);
    bib_bindRelatedContentItemLinks(submitActivityData);
}

function bib_displayRelatedContent(containerId, 
                                   outerModuleTemplate, 
                                   contentItemTemplate, 
                                   moduleSettings, 
                                   relatedContentItems) {
    var relatedContentItemCountainer = document.getElementById(containerId);
    var relatedContentItemPanels = _.map(relatedContentItems, function (contentItem, index) {
        return bib_renderContentItemTemplate(contentItem, 
                                             index, 
                                             contentItemTemplate, 
                                             moduleSettings);
    }).join('\n');
    var module = bib_renderOuterModuleTemplate(moduleSettings.stylePreset, relatedContentItemPanels, outerModuleTemplate);
    relatedContentItemCountainer.innerHTML = module;
}

function bib_renderOuterModuleTemplate(stylePreset, contentItemsHTML, outerModuleTemplate) {
    var compiled = _.template(outerModuleTemplate);
    var varBindings = {
        classes: bib_getPresetModuleClasses(stylePreset),
        recommendedContentItems: contentItemsHTML
    };
    return compiled(varBindings);
}

function bib_renderContentItemTemplate(contentItem, contentItemIndex, contentItemTemplate, moduleSettings) {
    var compiled = _.template(contentItemTemplate);
    var varBindings = {
        contentItemId: contentItem.contentItemId,
        name: bib_toTitleCase(contentItem.fields.name),
        url: contentItem.fields.url,
        subtitle: bib_getProperty(contentItem.fields, moduleSettings.subtitleField),
        imageUrl: (contentItem.fields.squareImage ? contentItem.fields.squareImage.contentUrl : null),
        relatedBy: contentItem.relationships.inCommon,
        tileNumber: (contentItemIndex + 1),
        showRelatedBy: moduleSettings.showRelatedBy
    };
    return compiled(varBindings);
}

function bib_recommendationUrl(contentItemId, catalogueIds, limit, page, fields) {
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
}

function bib_toTitleCase(str) {
    return str.replace(/\b\w+/g, function (s) {
        return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    });
}

function bib_getPresetModuleClasses(stylePreset) {
    var presets = {
        "grid-4": "bib__module bib--grd-4 bib--wide",
        "box-5": "bib__module bib--box-5 bib--wide",
        "box-6": "bib__module bib--box-6 bib--wide"
    };
    return presets[stylePreset] || presets["box-6"];
}

function bib_linkTargetFor(url) {
    var currentdomain = window.location.hostname;
    var matches = (bib_getDomainName(currentdomain) == bib_getDomainName(url));
    return (matches ? '_self' : '_blank');
}

function bib_getDomainName(url) {
    var r = /^(?:https?:\/\/)?(?:www\.)?(.[^/]+)/;
    var matchResult = url.match(r);
    return (url.match(r) ? matchResult[1].replace('www.', '') : "");
}

function bib_getProperty(properties, accessor) {
    if (accessor == false || accessor == undefined) {
        return accessor;
    } else {
        var reduceProps = function(props, field) { return (props == undefined ? undefined : props[field] ); }
        return _.reduce(accessor.split("."), reduceProps, properties);
    }
}

function bib_getRootProperty(accessor) {
    if (accessor == false || accessor == undefined) {
        return accessor;
    } else {
       return accessor.split(".")[0];
    }
}

function bib_validateField(accessor) {
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
        "publisher"]
    return _.contains(validFields, bib_getRootProperty(accessor));
}

function bib_bindRelatedContentItemLinks(submitActivityData) {
    var relatedContentItemlinks = document.getElementsByClassName("bib__link");
    for (var i = 0; i < relatedContentItemlinks.length; i++) {
        relatedContentItemlinks[i].addEventListener('click', function() {
            var contentItemId = this.getAttribute("data");
            submitActivityData(contentItemId);
        }, false);
    }
}

function bib_onRecommendationClick(containerId, sourceContentItemId, catalogueIds, moduleSettings, callbacks, relatedContentItems, clickedContentItemId) {
    if (bib_recommendationActivityTrackingIsEnabled(callbacks)) {
        callbacks.onRecommendationClick(bib_constructActivityData(
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
}

function bib_recommendationActivityTrackingIsEnabled(callbacks) {
    return (_.isFunction(callbacks.onRecommendationClick) && _.isFunction(bib_constructActivityData)) ? true : false;
}

function bib_initModuleSettings(options) {
    var moduleSettings = {};
    moduleSettings.stylePreset = options.stylePreset || "default";
    moduleSettings.showRelatedBy = options.showRelatedBy || false;
    moduleSettings.subtitleField = (bib_validateField(options.subtitleField) ? options.subtitleField : "headline");
    return moduleSettings;
}