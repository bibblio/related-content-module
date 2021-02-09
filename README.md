# Bibblio Related Content Module

Display content recommendations quickly and easily with [Bibblio](http://bibblio.org)'s pre-built Related Content Module. [Sign up for a plan](https://developer.bibblio.org/signup?plan_ids=2357355848804) if you haven't already. You'll need to [get started with our API](http://developer.bibblio.org/docs) to use this module.

## Installing the assets

### CDN (recommended)
The easiest way to use the module is via our CDN. Simply include the assets in your page as follows:

```html
<head>
    <!-- CSS -->.
    <link rel="stylesheet" type="text/css" href="https://cdn.bibblio.org/rcm/4.21/bib-related-content.min.css">

    <!-- JavaScript -->
    <script src="https://cdn.bibblio.org/rcm/4.21/bib-related-content.min.js"></script>
</head>
```

If you would like to host the assets yourself they can be installed via [Bower](https://bower.io/#install-bower) and [npm](https://www.npmjs.com/get-npm).

### Bower
The Bower package can be installed like this:
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
The NPM package can be installed like this:
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

Once the assets are included, the module can be added to a page.

This can be done by calling the JavaScript function provided:
```javascript
Bibblio.initRelatedContent(
    {
        targetElementId: 'bib_related-content',
        recommendationKey: 'YOUR_RECOMMENDATION_KEY',
        contentItemId: 'YOUR_CONTENT_ITEM_ID'
    }, 
    {
        // optional callbacks
    });
```

Typically this would be done on the `pageReady` event. Alternatively, the module can be initialised entirely as a div for convenience. This method does not support callbacks, but all other properties can be supplied as data attributes on the div, provided the div has a `bib--rcm-init` class. Bibblio uses this method to generate quick start snippets but if you're comfortable with JavaScript we would recommend using the function directly. See the React snippets further down the page for examples on div-based implementations.

The initialisation function accepts two JavaScript objects as input.

### Module Options

The first parameter supplies the options required to render the module to your specifications. It is a required parameter, must be a JavaScript object, and can contain the following properties:

#### `'targetElementId'` _(required)_
The DOM id of an HTML element you'd like to initialise as a related content panel. For example, this parameter could be 'yourRelatedContentModuleDiv', provided the following element exists on the page:
```html
<div id="yourRelatedContentModuleDiv"></div>
```

#### `'recommendationKey'` _(required)_
Allows you to safely connect to the Bibblio API from a page visitor's browser. The recommendation key can be obtained from [our API](https://bibblio.docs.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) or [your management console](https://developer.bibblio.org/admin/account) (click on the _Credentials_ page and then select _Manage my keys_).

#### `'contentItemId'` _(required unless customUniqueIdentifier is provided instead)_
The Bibblio `contentItemId` of the content item being displayed. Content recommendations will be based on this Bibblio content item. The `contentItemId` is provided when [creating a content item](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-content-item), and is retrievable when [listing your content items](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/list-content-items).

**NB**: You must provide either a `contentItemId` **or** a `customUniqueIdentifier`.

#### `'customUniqueIdentifier'` _(required if no contentItemId is provided)_
It is possible to use your own id to retrieve recommendations, thereby avoiding the need to store Bibblio's `contentItemId` in your database. To do this, make sure you provide a `customUniqueIdentifier` when [creating a content item](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-content-item). You can then specify the `customUniqueIdentifier` here, when retrieving recommendations.

**NB**: You must provide either a `contentItemId` **or** a `customUniqueIdentifier`. A `customUniqueIdentifier` must be supplied if `autoIngestion` is enabled.

#### `'autoIngestion'` _(optional)_
The Related Content Module is able to ingest content automatically. If the item does not exist and `autoIngestion` is set to `true`, the module will request that our servers retrieve the page and parse a content item from it. This saves you the trouble of integrating with Bibblio on your backend systems, at the cost of a more complex set of interations and less control when creating content items. When `autoIngestion` is enabled, a `customUniqueIdentifier` must be supplied, the item will be ingested the first time it is viewed in a browser, the domain from which it originates must be [whitelisted](https://bibblio.docs.apiary.io/#reference/related-content-module/auto-ingestion-domains), and future updates to item text will not be recognised. If you require more thorough integration with your backend systems then it would be best to [integrate with the API directly](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-content-item) instead.

#### `'autoIngestionCatalogueId'` _(optional)_
When auto-ingesting, this property allows you to specify the catalogueId that a content item should be assigned to. This will only take effect on initial ingestion. Module loads subsequent to ingestion will disregard this property. Cannot be supplied if `autoIngestionCustomCatalogueId` is present.

#### `'autoIngestionCustomCatalogueId'` _(optional)_
This property allows you to specify your own label to identify the catalogue that a content item should be assigned to when auto-ingesting, much like `customUniqueIdentifier` above. The specified catalogue will be created if it does not exist. Thereafter it will be reused. Catalogue assignment will only take effect on initial ingestion; module loads subsequent to ingestion will disregard this property. Cannot be supplied if `autoIngestionCatalogueId` is present.

#### `'catalogueIds'` _(optional)_
The [catalogues](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues) that recommendations should draw from. The `catalogueId` of [any catalogues you own](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues/list-catalogues) would be valid. Accepts an array of strings. Default is the same catalogue as the source content item specified. Cannot be supplied if customCatalogueIds is present.

#### `'customCatalogueIds'` _(optional)_
The `customCatalogueId`s that a recommendation should draw from. This allows you to retrieve recommendations for a particular [catalogue](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues) without having to store a Bibblio `catalogueId` (see `autoIngestionCustomCatalogueId` above). Accepts an array of strings. Default is the same catalogue as the source content item specified. Cannot be supplied if `catalogueIds` is present.

#### `'hidden'` _(optional)_
Allows you to perform a full integration without visually displaying the module. This is useful for testing and during initial auto-ingestion, before items have been indexed for the first time. Entering `Bibblio.showModules();` in the developer console will show all hidden modules on the page. Default is `false`.

#### `'offset'` _(optional)_
Allows you to offset the recommendations list before rendering, thereby skipping a specified number of items. This is useful if you'd like to put multiple modules using the same recommendation type on the page without displaying duplicate items. Simply offset the second module by the number of items displayed in the first. The supplied value must be an integer between `1` and `14`.

#### `'queryStringParams'` _(optional)_
Allows you to append additional query string params to the target url of recommended items. This is particularly useful for specifying analytics params such as _utm_source_. The value should be a JavaScript object. Each property will be added as a param to the url. e.g. `{ "utm_source" : "BibblioRCM", "utm_campaign" : "SiteFooter" }` would append `utm_source=BibblioRCM&utm_campaign=SiteFooter` to the url of all recommended items.

#### `'recommendationType'` _(optional)_
Allows you to specify the type of recommendations to serve. Options are 'optimised', 'related', 'popular' or 'personalised'. _Optimised_ recommendations are rooted in relevance but will also learn from user behaviour and continuously adapt to attain better engagement. _Related_ recommendations ignore user behaviour and are based purely on relatedness. _Popular_ recommendations ignore relatedness and are based purely on aggregated user behaviour. _Personalised_ recommendations are tailored to a specific user. We suggest starting with _optimised_ recommendations and adding _personalised_, _related_ or _popular_ modules elsewhere on the page to fit the site experience you desire. Default is 'optimised'.

#### `'styleClasses'` _(optional)_
Allows you select pre-built CSS styles for the module. An interactive configuration wizard that generates these parameters is available in the Demos section of your Bibblio management console. If you plan to place the module on an area of your page that has a dark background color you can append 'bib--invert' to your parameters to be sure everything remains legible. If most of your content item images are portrait sized, consider appending 'bib--portrait' to your parameters to ensure the images resize nicely in the tiles.

#### `'subtitleField'` _(optional)_
Allows you to specify the content item field to use as subtitles on the recommended content panel. Any [valid content item field](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/retrieve-a-content-item) can be used. Providing a value of _false_ will disable the subtitle. Default is '_headline_'.

#### `'truncateTitle'` _(optional)_
Allows you to specify a character length for truncating recommended titles. If this field is omitted we will automatically truncate titles to fit the style configuration you have specified with `styleClasses`.

#### `'userId'` _(optional)_
Your own, unique id for the current site visitor. This allows us to compute personalised recommendations. This can be supplied for any `recommendationType` to generate additional training data for our personalisation algorithms. Please do not provide any personally identifiable information for this field.

#### `'userMetadata'` _(optional)_
Allows you to supply additional properties pertaining to the user specified by `userId`. This will be taken into account when training algorithms that produce personalised recommendations. Value should be a JSON object and can contain any keys. We would advise being sparing with this data and only including things that are specific to your user and pertinent to your domain. This could include the user's occupation or their field of interest. Cannot be supplied if `userId` is not present.

### Callbacks

The second parameter to the initialisation function is optional. It allows you to supply various callbacks to inject your own functionality in the render chain. If supplied, it must be a JavaScript object, must supply functions, and can contain the following properties:

#### `'onRecommendationsRendered'` _(optional)_
The supplied function will be called once the module has rendered recommendations. This can be useful for toggling any visual elements that should only be displayed when recommendations have rendered successfully. An array of recommendations returned by Bibblio's API will be passed to this function.
```javascript
{
  onRecommendationsRendered: function (recommendedItems) {
    console.log(recommendedItems);
  }
}
```

#### `'onRecommendationViewed'` _(optional)_
The supplied function will be called when the module has scrolled into view. A JavaScript object containing Bibblio's tracking data for the view event will be passed to this function.
```javascript
{
  onRecommendationViewed: function (viewedTrackingData) {
    console.log(viewedTrackingData);
  }
}
```

#### `'onRecommendationClick'` _(optional)_
The supplied function will be called when a specific recommendation is clicked. This function will receive two parameters. The first parameter will be the specific recommendation that was clicked, in the format it was supplied by Bibblio's API. The second parameter will be the DOM click event itself.
```javascript
{
  onRecommendationClick: function (clickedItem, clickEvent) {
    console.log(clickedItem);
    console.log(clickEvent);
  }
}
```

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

## HTML Example

The following snippet shows the initialisation of a related content module. You will need to replace `YOUR_RECOMMENDATION_KEY`, and `YOUR_CONTENT_ITEM_ID` with [a recommendation key](https://bibblio.docs.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) and the `contentItemId` returned when [creating a content item](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-content-item) or [listing your content items](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/list-content-items). If a `customUniqueIdentifier` has been stored then this can be supplied instead of `contentItemId`.

```html
<head>
    <meta charset="utf-8">
    <title>Bibblio Related Content Example</title>
    <meta name="description" content="Bibblio Related Content Example">
    <meta name="Bibblio" content="SitePoint">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="http://example.com/bibblio/sample-content-item" />
    <!-- * Related Content Styles -->
    <link rel="stylesheet" type="text/css" href="https://cdn.bibblio.org/rcm/4.21/bib-related-content.min.css">
</head>

<!-- * Related Content HTML -->
<!-- Provide an enclosing element with an id. Position and size it as you wish. -->
<div id="bib_related-content"></div>

<!-- * Related Content Javascript -->
<script src="https://cdn.bibblio.org/rcm/4.21/bib-related-content.min.js"></script>
<script>
    // Initialise the related content plugin.
    window.addEventListener("load", function() {
        Bibblio.initRelatedContent({
            targetElementId: 'bib_related-content',
            contentItemId: 'YOUR_CONTENT_ITEM_ID',
            // customUniqueIdentifier: `YOUR_CUSTOM_UNIQUE_IDENTIFIER`,
            recommendationKey: 'YOUR_RECOMMENDATION_KEY'
        }, 
        {
            onRecommendationsRendered: function (recommendedItems) {
                console.log(recommendedItems);
            },
            onRecommendationViewed: function (viewedTrackingData) {
                console.log(viewedTrackingData); 
            },
            onRecommendationClick: function (clickedItem, clickEvent) {
                console.log(clickedItem);
                console.log(clickEvent); 
            }
        });
    });
</script>
```

## React Example

The following snippets illustrate various ways of implementing the Related Content Module in React. First, include the assets in your project's `index.html` file.

```html
<head>
    <!-- CSS -->.
    <link rel="stylesheet" type="text/css" href="https://cdn.bibblio.org/rcm/4.21/bib-related-content.min.css">

    <!-- JavaScript -->
    <script src="https://cdn.bibblio.org/rcm/4.21/bib-related-content.min.js"></script>
</head>
```

You then have several strategies for registering the module with React...

#### 1) React component as a function

```javascript
import React from 'react';

function RelatedContentModule(props) {
  return (
    <div className="bib--rcm-init"
      data-recommendation-key="YOUR_RECOMMENDATION_KEY"
      // data-content-item-id={props.contentItemId}
      data-custom-unique-identifier={props.contentItemId}
      data-recommendation-type="related"
      data-style-classes="bib--hover bib--col-3">
    </div>
  )
}

export default RelatedContentModule;
```

#### 2) React component as a class

```javascript
import React from 'react';

class RelatedContentModule extends React.Component {
  render() {
    return (
      <div className="bib--rcm-init"
        data-recommendation-key="YOUR_RECOMMENDATION_KEY"
        // data-content-item-id={props.contentItemId}
        data-custom-unique-identifier={this.props.contentItemId}
        data-recommendation-type="related"
        data-style-classes="bib--hover bib--col-3">
      </div>
    )
  }
}

export default RelatedContentModule;
```

#### 3) React component using bibblio initRelatedContent

```javascript
import React from 'react';

class RelatedContentModule extends React.Component {
  componentDidMount() {
    window.Bibblio.initRelatedContent({
      targetElementId: "bibblio-related-module",
      recommendationKey: "YOUR_RECOMMENDATION_KEY",
      customUniqueIdentifier: this.props.contentItemId,
      styleClasses: "bib--hover bib--col-3"
    });
  }

  render() {
    return (
      <div id="bibblio-related-module"></div>
    )
  }
}
```

#### Using the related content module component
Once registered, the related content module component can be initialised as follows.

```html
<RelatedContentModule 
  contentItemId="YOUR_CONTENT_ITEM_ID" />
```

## Google AMP (Accelerated Mobile Pages) Example

Bibblio's Related Content Module can be implemented on Google AMP using an `amp-iframe`. The html page that will render inside the iframe is hosted on our servers. All you need to do is place the following snippet in your AMP template:

```html
<amp-iframe width="1" height="1" layout="responsive" resizable sandbox="allow-scripts allow-top-navigation allow-same-origin" src="https://cdn.bibblio.org/rcm/4.21/amp.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID">
    <div overflow tabindex=0 role=button aria-label="See more">See more!</div>
    <amp-img layout="fill" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" placeholder></amp-img>
</amp-iframe>
```

All the usual parameters are supported and can be passed in as querystring parameters to the amp-iframe `src` as above. The format of some parameters will vary due to the constraint of passing data through an iframe url. These variances are described below.

Some things to note:

* Providing an `<amp-img layout="fill" src="..." placeholder></amp-img>` within the amp-iframe tag is necessary [to avoid restrictions on module placement](https://www.ampproject.org/docs/reference/components/amp-iframe#iframe-with-placeholder).
* Providing a `<div overflow ...>` child element is necessary to [allow resizing](https://www.ampproject.org/docs/reference/components/amp-iframe#iframe-resizing).
* `width` and `height` properties are required by AMP. It's safe to use placeholder values of `1` as long as `layout="responsive" resizable` is also included since the iframe will then scale to the module once rendered.
* `sandbox="allow-scripts allow-top-navigation allow-same-origin"` is required. This enables Bibblio's JavaScript within the iframe, allows recommendation clicks to open, and let's the iframe update its size in the parent window.
* `styleClasses` are comma-separated when supplied to the iframe.
* `queryStringParams` take a different format when supplied to the iframe. They can be supplied directly in the `src` property without an enclosing `queryStringParams=__` container.

The following example includes all format variances. It will add `utm_source=Bibblio` and `utm_campaign=related` to your recommendation links and include the `bib--row-3` and `bib--hover` styleClasses.

```html
<amp-iframe width="1" height="1" layout="responsive" resizable sandbox="allow-scripts allow-top-navigation allow-same-origin" src="https://cdn.bibblio.org/rcm/4.21/amp.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID&utm_source=Bibblio&utm_campaign=related&styleClasses=bib--row-3,bib--hover">
    <div overflow tabindex=0 role=button aria-label="See more">See more!</div>
    <amp-img layout="fill" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" placeholder></amp-img>
</amp-iframe>
```

## Trying it out locally

The [example.html](example.html) file provided shows a working demo that gets its parameters from the query string. It loads assets from this project with relative paths so you'll need to clone the repo to try it. You can open it in your browser in the following format:

```
example.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID
```
