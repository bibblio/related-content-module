
var bib_relatedContentItemTemplate = "<li class=\"bib-accordion-row\" style=\"background-image: url(<%= imageUrl %>)\">\
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
                                      </li>"


function bib_initRelatedContent(accessToken, contentItemId) {
    // this uses partial function application to bind the template variable as an argument to a
    // new (partially applied) version of the bib_displayRelatedContent function. That function can
    // then be passed around as a callback without worrying about the template argument.
    // i.e. the template is at this point bound to the rest of the function call chain.
    // modify the global bib_relatedContentItemTemplate variable if you want to change the template.
    var displayWithTemplate = _.partial(bib_displayRelatedContent, _, bib_relatedContentItemTemplate);

    // gets the related content items and passes the partially-applied display function as a callback.
    var relatedContentItems = bib_getRelatedContentItems(accessToken, contentItemId, displayWithTemplate);
}

function bib_getRelatedContentItems(accessToken, contentItemId, successCallback) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
      // alert("onreadystatechange");
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            alert("success hook");
            var contentItems = JSON.parse(xmlhttp.responseText);
            successCallback(contentItems);
        }
    };

    // url arguments should be injected but the plugin only supports these settings now anyway.
    var url = bib_recommendationUrl(contentItemId, 5, 1, ["name", "url", "squareImage"]);
    xmlhttp.open("GET", url, true);
    xmlhttp.setRequestHeader("Authorization", "Bearer " + accessToken);
    alert("making call to: " + url);
    xmlhttp.send();
}

function bib_displayRelatedContent(relatedContentItems, contentItemTemplate) {
    alert("display content");
    var relatedContentItemCountainer = document.getElementById('bib_relatedContentList');
    var relatedContentItemPanels = _.map(relatedContentItems, function(contentItem) { return bib_renderContentItemTemplate(contentItem, contentItemTemplate); });
    relatedContentList.innerHTML = relatedContentItemPanels;
}

function bib_renderContentItemTemplate(contentItem, contentItemTemplate) {
    var compiled = _.template(contentItemTemplate);
    var relatedBy = _.map(contentItem.relationships.inCommon.slice(0,2), function(rel) { return rel.text; });
    var varBindings = {
        name: contentItem.fields.name,
        url: contentItem.fields.url,
        imageUrl: contentItem.fields.squareImage.urlContent,
        relatedBy: relatedBy
    };
    return compiled(varBindings);
}

function bib_recommendationUrl(contentItemId, limit, page, fields) {
    var fields = _.map(fields, function(field) { return "fields=" + field; }).join("&");
    return "https://api.bibblio.org/content-items/" + contentItemId + "/recommendations?limit=" + limit + "&page=" + page + "&" + fields;
}