"use strict";

var bib_relatedContentItemTemplate = "<li class=\"bib-accordion-row  bib-accordion-row-<%= rowNumber %>\" <%= (imageUrl ? 'style=\"background-image: url(' + imageUrl + ')' : '') %>\">\
                                          <a class=\"bib-accordion-cell\" href=\"<%= url %>\">\
                                              <span class=\"bib-accordion-info\">\
                                                  <span class=\"bib-accordion-title\"><%= name %></span>\
                                                  <span class=\"bib-accordion-related-container\">\
                                                      <span class=\"bib-accordion-related-label\">related by</span>\
                                                      <span class=\"bib-accordion-related-list\">\
                                                          <span class=\"bib-accordion-related-item\"><%= relatedBy[0] %></span>\
                                                          <span class=\"bib-accordion-related-item\"><%= relatedBy[1] %></span>\
                                                          <span class=\"bib-accordion-related-item\"><%= relatedBy[2] %></span>\
                                                      </span>\
                                                  </span>\
                                              </span>\
                                          </a>\
                                      </li>";

function bib_initRelatedContent(accessToken, contentItemId) {
    // This uses partial function application to bind the template variable as an argument to a
    // new (partially applied) version of the bib_displayRelatedContent function. That function can
    // then be passed around as a callback without worrying about the template argument.
    // i.e. the template is at this point bound to the rest of the function call chain.
    // Modify the global bib_relatedContentItemTemplate variable if you want to change the template.
    var displayWithTemplate = _.partial(bib_displayRelatedContent, _, bib_relatedContentItemTemplate);
    // Gets the related content items and passes the partially-applied display function as a callback.
    bib_getRelatedContentItems(accessToken, contentItemId, displayWithTemplate);
}

function bib_getRelatedContentItems(accessToken, contentItemId, successCallback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            var response = JSON.parse(xmlhttp.responseText);
            successCallback(response.results);
        }
    };
    // URL arguments should be injected but the module only supports these settings now anyway.
    var url = bib_recommendationUrl(contentItemId, 5, 1, ["name", "url", "squareImage"]);
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
    xmlhttp.send();
}

function bib_displayRelatedContent(relatedContentItems, contentItemTemplate) {
    var relatedContentItemCountainer = document.getElementById('bib-related-content-list');
    var relatedContentItemPanels = _.map(relatedContentItems, function (contentItem, index) {
        return bib_renderContentItemTemplate(contentItem, index, contentItemTemplate);
    });
    relatedContentItemCountainer.innerHTML = relatedContentItemPanels.join('');
}

function bib_renderContentItemTemplate(contentItem, contentItemIndex, contentItemTemplate) {
    var compiled = _.template(contentItemTemplate);
    var relatedBy = bib_getRelatedBy(contentItem);
    var varBindings = {
        name: bib_toTitleCase(contentItem.fields.name),
        url: contentItem.fields.url,
        imageUrl: (contentItem.fields.squareImage ? contentItem.fields.squareImage.urlContent : null),
        relatedBy: relatedBy,
        rowNumber: (contentItemIndex + 1)
    };
    return compiled(varBindings);
}

function bib_getRelatedBy(contentItem) {
  var relatedByTerms = _.map(contentItem.relationships.inCommon, function (rel) {
        return rel.text;
    });

  return _.uniq(relatedByTerms).slice(0, 3);
}

function bib_recommendationUrl(contentItemId, limit, page, fields) {
    var querystringFields = _.map(fields, function (field) {
        return "fields=" + field;
    }).join("&");
    return "https://api.bibblio.org/content-items/" + contentItemId + "/recommendations?limit=" + limit + "&page=" + page + "&" + querystringFields;
}

function bib_toTitleCase(str) {
    return str.replace(/\b\w+/g, function (s) {
        return s.charAt(0).toUpperCase() + s.substr(1).toLowerCase();
    });
}
