"use strict";

var bib_outerModuleTemplate = "<ul class=\"<%= classes %>\">\
                                  <%= recommendedContentItems %>\
                               </ul>"

var bib_relatedContentItemTemplate = "<li class=\"bib__tile bib__tile--<%= tileNumber %>\">\
                                          <a href=\"<%= url %>\" class=\"bib__link <%= (imageUrl ? 'bib__link--image' : '') %>\" <%= (imageUrl ? 'style=\"background-image: url(' + imageUrl + ')' : '') %>\">\
                                              <span class=\"bib__container\">\
                                                  <span class=\"bib__info\">\
                                                      <span class=\"bib__title\"><span><%= name %></span></span>\
                                                      <% if (typeof(attributes) != \"undefined\") { %>\
                                                        <span class=\"bib__attributes\">\
                                                            <% if (attrtibutes['duration']) { %> <span class=\"bib__duration\"><%= attributes['duration'] %></span> <% } %>\
                                                            <% if (attrtibutes['author']) { %> <span class=\"bib__author\"><%= attributes['author'] %></span> <% } %>\
                                                            <% if (attrtibutes['recency']) { %> <span class=\"bib__recency\"><%= attributes['recency'] %></span> <% } %>\
                                                        </span>\
                                                      <% } %>\
                                                      <span class=\"bib__preview\"><%= headline %></span>\
                                                      <span class=\"bib__terms\">\
                                                          <span class=\"bib__term-label\">Related by</span>\
                                                          <span class=\"bib__term-list\">\
                                                              <span class=\"bib__term-item\"><%= relatedBy[0] %></span>\
                                                              <span class=\"bib__term-item\"><%= relatedBy[1] %></span>\
                                                              <span class=\"bib__term-item\"><%= relatedBy[2] %></span>\
                                                          </span>\
                                                      </span>\
                                                  </span>\
                                              </span>\
                                          </a>\
                                      </li>";

function bib_initRelatedContent(containerId, accessToken, contentItemId, options={}) {
    // This uses partial function application to bind the template and render arguments to a
    // new (partially applied) version of the bib_displayRelatedContent function. That function can
    // then be passed around as a callback without worrying about the template arguments.
    // i.e. the templates are at this point bound to the rest of the function call chain.
    // Modify the global bib_relatedContentItemTemplate and bib_outerModuleTemplate variables
    // if you want to change the templates.
    var stylePreset = options.stylePreset || "default";
    var displayWithTemplates = _.partial(bib_displayRelatedContent, 
                                        containerId,
                                        bib_outerModuleTemplate,
                                        bib_relatedContentItemTemplate,
                                        stylePreset,
                                        _);
    // Gets the related content items and passes the partially-applied display function as a callback.
    var catalogueIds = options.catalogueIds || [];
    bib_getRelatedContentItems(accessToken, contentItemId, catalogueIds, displayWithTemplates);
}

function bib_getRelatedContentItems(accessToken, contentItemId, catalogueIds, successCallback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var response = JSON.parse(xmlhttp.responseText);
            successCallback(response.results);
        }
    };
    // URL arguments should be injected but the module only supports these settings now anyway.
    var url = bib_recommendationUrl(contentItemId, catalogueIds, 6, 1, ["name", "url", "headline", "squareImage"]);
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
    xmlhttp.send();
}

function bib_displayRelatedContent(containerId, outerModuleTemplate, contentItemTemplate, stylePreset, relatedContentItems) {
    var relatedContentItemCountainer = document.getElementById(containerId);
    var relatedContentItemPanels = _.map(relatedContentItems, function (contentItem, index) {
        return bib_renderContentItemTemplate(contentItem, index, contentItemTemplate);
    }).join('\n');
    var module = bib_renderOuterModuleTemplate(stylePreset, relatedContentItemPanels, outerModuleTemplate);

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

function bib_renderContentItemTemplate(contentItem, contentItemIndex, contentItemTemplate) {
    var compiled = _.template(contentItemTemplate);
    var varBindings = {
        name: bib_toTitleCase(contentItem.fields.name),
        url: contentItem.fields.url,
        headline: contentItem.fields.headline,
        imageUrl: (contentItem.fields.squareImage ? contentItem.fields.squareImage.urlContent : null),
        relatedBy: contentItem.relationships.inCommon,
        tileNumber: (contentItemIndex + 1)
    };
    return compiled(varBindings);
}

function bib_recommendationUrl(contentItemId, catalogueIds, limit, page, fields) {
    var querystringFields = _.map(fields, function (field) {
        return "fields=" + field;
    }).join("&");

    var querystringCatalogueIds = _.map(catalogueIds, function (catalogueId) {
        return "catalogueIds=" + catalogueId;
    }).join("&");

    // TODO: make this much nicer
    return "https://api.bibblio.org/content-items/" + contentItemId + "/recommendations?limit=" + limit + "&page=" + page + "&" + querystringFields + (querystringCatalogueIds ? "&" + querystringCatalogueIds : "");
}

function bib_toTitleCase(str) {
    return str.replace(/\b\w+/g, function (s) {
        return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    });
}

function bib_getPresetModuleClasses(stylePreset) {
  var presets = {
    "grid-4": "bib__module bib--grd-4 bib-wide",
    "box-5": "bib__module bib--box-5 bib-wide",
    "box-6": "bib__module bib--box-6 bib—wide"
  };
  return presets[stylePreset] || presets["box-6"];
}
