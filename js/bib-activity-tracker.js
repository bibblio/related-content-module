function bib_trackActivity(activityData) {
    var requestBody = bib_constructRequestBody(activityData);
    var httpClient = bib_constructHttpClient();
    return httpClient.send(requestBody);
}

function bib_constructRequestBody(activityData) {
    return JSON.stringify(activityData)
}

function bib_constructHttpClient() {
    var url = "https://4665tudai1.execute-api.eu-west-1.amazonaws.com/dev/activities";
    var httpClient = new XMLHttpRequest();
    httpClient.open("POST", url, false);
    httpClient.setRequestHeader('Content-Type', 'application/json');
    return httpClient;
}

function bib_constructActivityData(type, sourceContentItemId, clickedContentItemId, catalogueIds, relatedContentItems, instrument) {
    var activityData = {
        "type": type,
        "actor": {},
        "object": bib_constructActivityObject(clickedContentItemId),
        "context": bib_constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems),
        "instrument": bib_constructActivityInstrument(instrument)
    }
    return activityData;
}

function bib_constructActivityInstrument(type, version, stylePreset) {
    return {
        "type": type,
        "version": version,
        "config": {
            "stylePreset": stylePreset
        }
    };
}

function bib_constructActivityObject(clickedContentItemId) {
    return [["contentItemId", clickedContentItemId]];
}

function bib_constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems) {
    var context = [];

    //Construct context tuples
    var sourceHref = ["sourceHref", window.location.href];
    var sourceContentItem = ["sourceContentItemId", sourceContentItemId];
    var recommendationContentItems = _.map(relatedContentItems, function (contentItem, index) {
        return ["recommendations.contentItemId", contentItem.contentItemId];
    });
    var recommendationCatalogues = _.map(catalogueIds, function (catalogueId, index) {
        return ["recommendations.catalogueId", catalogueId];
    });

    //Append tuples to context
    context.push(sourceHref);
    context.push(sourceContentItem);
    if (recommendationContentItems.length > 0) {
        context.push(recommendationContentItems);
    }
    if (recommendationCatalogues.length > 0) {
        context.push(recommendationCatalogues);
    }

    return context;
}
