# Bibblio Related Content Module

Get content recommendations quickly and easily with [Bibblio](http://bibblio.org)'s pre-built Related Content Module. It comes with all the JavaScript and CSS you'll need to get content recommendations on the page.

## Signing Up

[Sign up for a free plan](https://developer.bibblio.org/signup?plan_ids=2357355848804) if you haven't already. You'll need to get started with our API to use this module.

[Check out the full docs here](http://developer.bibblio.org/docs).

## Installing the assets

### CDN (recommended)
The easiest way to use the module is via our CDN. There is no need to install anything since the assets can be retrieved directly from Bibblio's servers. Simply include them in your page as follows:

```html
<head>
    <!-- CSS -->.
    <link rel="stylesheet" type="text/css" href="https://cdn.bibblio.org/rcm/4.5/bib-related-content.min.css">

    <!-- JavaScript -->
    <script src="https://cdn.bibblio.org/rcm/4.5/bib-related-content.min.js"></script>
</head>
```

If you would like to host the assets yourself instead they can be installed via [Bower](https://bower.io/#install-bower) and [npm](https://www.npmjs.com/get-npm).

### Bower
The Bower package can be installed with the following command:
```
bower install bibblio-related-content-module
```

And included like this:
```html
<head>
    <!-- CSS -->
    <link rel="stylesheet" type="text/css" href="bower_components/bibblio-related-content-module/css/bib-related-content.css">

    <!-- JavaScript -->
    <script src="bower_components/bibblio-related-content-module/js/bib-related-content.js"></script>
</head>
```

### NPM
The NPM package can be installed with the following command:
```
npm install bibblio-related-content-module
```

And included like this:
```html
<head>
    <!-- CSS -->
    <link rel="stylesheet" type="text/css" href="node_modules/bibblio-related-content-module/css/bib-related-content.css">

    <!-- JavaScript -->
    <script src="node_modules/bibblio-related-content-module/js/bib-related-content.js"></script>
</head>
```

If using NPM you may also want to require the module with NodeJS:
```javascript
var Bibblio = require("bibblio-related-content-module");
```

## Using the module

Once the assets are included, the module can be added to a page by calling the JavaScript function provided:
```javascript
Bibblio.initRelatedContent(...)
```

Typically this would be done on the `pageReady` event, but could also be dropped in a script tag at the bottom of the page.

The function accepts a JavaScript object as its only parameter. This object can contain the following properties:

#### `'targetElementId'` _(required)_
The DOM id of an HTML element you'd like to initialise as a related content panel. For example, this parameter could be 'yourRelatedContentModuleDiv', provided the following element exists on the page:
```html
<div id="yourRelatedContentModuleDiv"></div>
```
You will need to drop this (empty) HTML element onto the page yourself and position it as you wish.

#### `'recommendationKey'` _(required)_
Allows you to safely connect to the Bibblio API from a page visitor's browser. The recommendation key can be obtained from [our API](http://docs.bibblio.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) or [your management console](https://developer.bibblio.org/admin/account) (click on the _Credentials_ page and then select _Manage my keys_).

#### `'contentItemId'` _(required unless customUniqueIdentifier is provided instead)_
The Bibblio `contentItemId` of the content item being displayed. Content recommendations will be based on this Bibblio content item. The `contentItemId` is provided when [creating a content item](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/create-a-content-item), and is retrievable when [listing your content items](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/list-content-items).

**NB**: You must provide either a `contentItemId` **or** a `customUniqueIdentifier`.

#### `'customUniqueIdentifier'` _(required if no contentItemId is provided)_
It is possible to use your own id to retrieve recommendations, thereby avoiding the need to store Bibblio's `contentItemId` in your database. To do this, make sure you provide a `customUniqueIdentifier` when [creating a content item](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/create-a-content-item). This allows you to specify the `customUniqueIdentifier` here, when retrieving recommendations. In this case, content recommendations will be based on the Bibblio content item with the `customUniqueIdentifier` specified. If you would prefer to store Bibblio's id simply use `contentItemId` as documented above.

**NB**: You must provide either a `contentItemId` **or** a `customUniqueIdentifier`. A `customUniqueIdentifier` must be supplied if `autoIngestion` is enabled.

#### `'autoIngestion'` _(optional)_
The Related Content Module is able to ingest content automatically. It will attempt to retrieve recommendations for the specified content item. If the item does not exist and `autoIngestion` is set to `true`, the module will attempt to parse the content item from the page. Subsequent page loads will then be able to display recommendations once the item has been ingested and indexed. This saves you the trouble of integrating with Bibblio on your backend systems. There are some things to keep in mind when enabling `autoIngestion`: a `customUniqueIdentifier` must be supplied, the item will be ingested the first time it is viewed in a browser, the domain from which it originates must be [whitelisted](http://docs.bibblio.apiary.io/#reference/related-content-module/auto-ingestion-domains), and future updates to item text will not be considered. If you do require content items to be ingested and synced immediately at the time of publication and update then it would be best to [integrate with the API directly](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/create-a-content-item). Please [contact us](http://www.bibblio.org/contact) if you are uncertain about the choice.

#### `'autoIngestionCatalogueId'` _(optional)_
When auto-ingesting, this property allows you to specify the catalogueId that a content item should be assigned to. This will only take effect on initial ingestion. Module loads subsequent to ingestion will disregard this property. Cannot be supplied if autoIngestionCustomCatalogueId is present.

#### `'autoIngestionCustomCatalogueId'` _(optional)_
When auto-ingesting, this property allows you to specify your own label for catalogue assignment. This allows you to avoid storing Bibblio's catalogueId since your own, pre-existing label can be used instead. The specified catalogue will be created if it does not exist. Thereafter it will be reused. Catalogue assignment will only take effect on initial ingestion. Module loads subsequent to ingestion will disregard this property. Cannot be supplied if autoIngestionCatalogueId is present.

#### `'catalogueIds'` _(optional)_
The [catalogues](http://docs.bibblio.apiary.io/#reference/storing-data/catalogues) that recommendations should draw from. The `catalogueId` of [any catalogues you own](http://docs.bibblio.apiary.io/#reference/storing-data/catalogues/list-catalogues) would be valid. Accepts an array of strings. Default is the same catalogue as the source content item specified. Cannot be supplied if customCatalogueIds is present.

#### `'customCatalogueIds'` _(optional)_
The customCatalogueIds that a recommendation should draw from. This allows you to retrieve recommendations for a particular [catalogue](http://docs.bibblio.apiary.io/#reference/storing-data/catalogues) without having to store Bibblio's catalogueIds (see `autoIngestionCustomCatalogueId` above). If you have ingested using customCatalogueIds then you can specifies these here. Accepts an array of strings. Default is the same catalogue as the source content item specified. Cannot be supplied if catalogueIds is present.

#### `'hidden'` _(optional)_
Allows you to perform a full integration without visually displaying the module. This is useful for testing and during initial auto-ingestion, before items have been indexed for the first time. Entering `Bibblio.showModules();` in the developer console will show all hidden modules on the page. Default is `false`.

#### `'queryStringParams'` _(optional)_
Allows you to append additional query string params to the target url of recommended items. This is particularly useful for specifying analytics params such as _utm_source_. The value should be a JavaScript object. Each property will be added as a param to the url. e.g. `{ "utm_source" : "BibblioRCM", "utm_campaign" : "SiteFooter" }` would append `utm_source=BibblioRCM&utm_campaign=SiteFooter` to the url query string of all recommended items.

#### `'recommendationType'` _(optional)_
Allows you to specify the type of recommendations to serve. Options are 'optimised', 'related' or 'popular'. _Optimised_ recommendations are rooted in relevance but will also learn from user behaviour and continuously adapt to attain better engagement. _Related_ recommendations ignore user behaviour and are based purely on relatedness. _Popular_ recommendations ignore relatedness and are based purely on user behaviour. We suggest starting with _optimised_ recommendations and adding _related_ or _popular_ modules elsewhere on the page to fit the site experience you desire. Default is 'optimised'.

#### `'styleClasses'` _(optional)_
Allows you to customise the CSS styles applied to the related content module. An interactive configuration wizard is available in the Demos section of your Bibblio management console, which allows you to generate parameters for this option. If you plan to place the module on an area of your page that has a dark background color you can append 'bib--invert' to your parameters to be sure everything remains legible. If most of your content item images are portrait sized, consider appending 'bib--portrait' to your parameters so the images resize nicely in the tiles.

#### `'subtitleField'` _(optional)_
Allows you to specify the content item field to use as subtitles on the recommended content panel. Any [valid content item field](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/retrieve-a-content-item) can be used. Providing a value of _false_ will disable the subtitle. Default is '_headline_'.

#### `'truncateTitle'` _(optional)_
Allows you to specify a character length for truncating recommended titles. If this field is omitted we will automatically truncate titles to fit the style configuration you have specified with `styleClasses`.

#### `'userId'` _(optional)_
Your own, unique id for the current site visitor. This allows us to apply recommendation personalization. Please do not provide any personally identifiable information for this field.


## Tracking data

The module will automatically submit user interaction data. By default all interaction data is completely anonymous. You are, however, able to provide an optional userId when the module is initialised, which will allow us to personalize recommendations for the requested user.

Here is a sample of the tracking data submitted from within the Related Content Module:
```javascript
{ "type": "Clicked",
  "object": [["contentItemId", "123"]],
  "context": [
    ["sourceContentItemId", "012"],
    ["sourceHref", "https://example.com/the/page/url"],
    ["recommendations.contentItemId", "456"],
    ["recommendations.contentItemId", "789"],
    ["recommendations.contentItemId", "101"],
    ["recommendations.contentItemId", "123"]],
  "instrument": {
    "type": "BibblioRelatedContent",
    "version": "1.1.0",
    "config": {'styleClasses': 'bib--row-3 bib--hover bib--recency-show'}}
  "actor": {
    "userId": "42"}} // optional
```

## An example

The following snippet shows the initialisation of a related content module. You will need to replace `YOUR_RECOMMENDATION_KEY` and `YOUR_CONTENT_ITEM_ID` with [a recommendation key](http://docs.bibblio.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) and the `contentItemId` returned when [creating a content item](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/create-a-content-item) or [listing your content items](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/list-content-items).

```html
<head>
    <!-- * Related Content Styles -->
    <link rel="stylesheet" type="text/css" href="bower_components/bibblio-related-content-module/css/bib-related-content.css">
</head>

<!-- * Related Content HTML -->
<!-- Provide an enclosing element with an id. Position and size it as you wish. -->
<div id="bib_related-content"></div>

<!-- * Related Content Javascript -->
<script src="bower_components/bibblio-related-content-module/js/bib-related-content.js"></script>
<script>
    // Initialise the related content plugin.
    window.addEventListener("load", function() {
        Bibblio.initRelatedContent({
            targetElementId: 'bib_related-content',
            recommendationKey: 'YOUR_RECOMMENDATION_KEY',
            contentItemId: 'YOUR_CONTENT_ITEM_ID'
        });
    });
</script>
```

## Google AMP (Accelerated Mobile Pages)

Bibblio's Related Content Module can be implemented on Google AMP using an `amp-iframe`. The html page that will render inside the iframe is hosted on our servers so all you would need to do is place the following snippet in your AMP template instead of the example above.

```html
<amp-iframe width="1" height="1" layout="responsive" resizable sandbox="allow-scripts allow-top-navigation allow-same-origin" src="https://cdn.bibblio.org/rcm/4.5/amp.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID">
    <div overflow tabindex=0 role=button aria-label="See more">See more!</div>
    <amp-img layout="fill" src="" placeholder></amp-img>
</amp-iframe>
```

All the usual parameters are supported and can be passed in as querystring parameters to the amp-iframe `src` as above. The format of some parameters will vary due to the constraint of passing data through an iframe url. These variances are described below.

Some things to note:

* Providing an `<amp-img layout="fill" src="" placeholder></amp-img>` within the amp-iframe tag is necessary [to avoid restrictions on module placement](https://www.ampproject.org/docs/reference/components/amp-iframe#iframe-with-placeholder).
* Providing a `<div overflow ...>` child element is necessary to [allow resizing](https://www.ampproject.org/docs/reference/components/amp-iframe#iframe-resizing).
* `width` and `height` properties are required by AMP. It's safe to use placeholder values of `1` as long as `layout="responsive" resizable` is also included since the iframe will then scale to the module once rendered.
* `sandbox="allow-scripts allow-top-navigation allow-same-origin"` is required. This enables Bibblio's JavaScript within the iframe, allows recommendation clicks to open, and let's the iframe update its size in the parent window.
* `styleClasses` are comma-separated when supplied to the iframe.
* `queryStringParams` take a different format when supplied to the iframe. They can be supplied directly in the `src` property without an enclosing `queryStringParams=__` container.

The following example includes all format variances. It will add `utm_source=Bibblio` and `utm_campaign=related` to your recommendation links and include the `bib--row-3` and `bib--hover` styleClasses.

```html
<amp-iframe width="1" height="1" layout="responsive" resizable sandbox="allow-scripts allow-top-navigation allow-same-origin" src="https://cdn.bibblio.org/rcm/4.5/amp.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID&utm_source=Bibblio&utm_campaign=related&styleClasses=bib--row-3,bib--hover">
    <div overflow tabindex=0 role=button aria-label="See more">See more!</div>
    <amp-img layout="fill" src="" placeholder></amp-img>
</amp-iframe>
```

## Trying it out

The [example.html](example.html) file provided shows a working demo that gets these values from querystrings. You can save this file and open it in your browser in the following format:

```
example.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID
```
