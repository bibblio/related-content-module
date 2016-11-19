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

function bib_constructActivityInstrument(type, version, config) {
    return {
        "type": type,
        "version": version,
        "config": config
    };
}

function bib_constructActivityObject(clickedContentItemId) {
    return [["contentItemId", clickedContentItemId]];
}

function bib_constructActivityContext(sourceContentItemId, catalogueIds, relatedContentItems) {
    var context = [];
    context.push(["sourceHref", window.location.href]);
    context.push(["sourceContentItemId", sourceContentItemId]);
    _.map(relatedContentItems, function (contentItem, index) {
        context.push(["recommendations.contentItemId", contentItem.contentItemId]);
    });
    _.map(catalogueIds, function (catalogueId, index) {
        context.push(["recommendations.catalogueId", catalogueId]);
    }, context);
    return context;
}
