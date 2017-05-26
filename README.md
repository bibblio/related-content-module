# Bibblio Related Content Module

Get content recommendations quickly and easily with [Bibblio](http://bibblio.org)'s pre-built Related Content Module. It comes with all the JavaScript and CSS you'll need to get content recommendations on the page.

## Signing Up

[Sign up for a free plan](https://developer.bibblio.org/signup?plan_ids=2357355848804) if you haven't already. You'll need to get started with our API to use this module.

[Check out the full docs here](http://developer.bibblio.org/docs).

## Installing the module

The module's JavaScript and CSS can be installed with [Bower](https://bower.io/#install-bower) by running:

```
bower install bibblio-related-content-module
```

## Loading the module files

You will need to load the JavaScript and CSS files in order to use the Related Content Module on your page. If you've installed this as a project dependency and are using asset packaging pipelines then you can safely ignore this step and do it your way.

Include the files by adding these tags to your page:

```html
<!-- CSS -->
<link rel="stylesheet" type="text/css" href="bower_components/bibblio-related-content-module/css/bib-related-content.css">

<!-- JavaScript -->
<script src="bower_components/underscore/underscore-min.js"></script>
<script src="bower_components/bibblio-related-content-module/js/bib-related-content.js"></script>
```

## Using the module

The module can be added to a page by calling the JavaScript function provided:
```javascript
Bibblio.initRelatedContent(...)
```

Typically this would be done on the `pageReady` event, but could also be dropped in a script tag at the bottom of the page.

The function accepts four parameters...


### 1) HTML id
This should be the DOM id of an HTML element you'd like to initialise as a related content panel. For example, this parameter could be 'yourRelatedContentModuleDiv' if the following element exists on the page:
```html
<div id="yourRelatedContentModuleDiv"></div>
```
You will need to drop this (empty) element onto the page yourself so as to position it as you wish.

### 2) Recommendation Key
This allows you to safely connect to the Bibblio API from a page visitor's browser. The recommendation key can be obtained from [our API](http://docs.bibblio.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) or [your management console](https://developer.bibblio.org/admin/account) (click on the _Credentials_ page and then select _Manage my keys_).

### 3) contentItemId
The Bibblio `contentItemId` of the article (or other piece of content) being displayed must be provided in order to retrieve content recommendations. The `contentItemId` is provided when [creating a content item](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/create-a-content-item), and is also retrievable when [listing your content items](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/list-content-items).

### 4) configuration object (optional)
A JavaScript object can be provided to set customisation options on the module. This object can contain the following properties:

`'catalogueIds'`: allows you to specify the [catalogues](http://docs.bibblio.apiary.io/#reference/storing-data/catalogues) that recommendations should draw from. The `catalogueId` of [any catalogues you own](http://docs.bibblio.apiary.io/#reference/storing-data/catalogues/list-catalogues) would be valid. Default is the same catalogue as the source content item specified.

`'userId'`: your own, unique id for the current site visitor. This allows us to apply recommendation personalization. Please do not provide any personally identifiable information for this field. This field is optional.

`'styleClasses'`: allows you to customise the CSS styles applied to the related content module. An interactive configuration wizard is available in the Demos section of your Bibblio management console, which allows you to generate parameters for this option. Default is 'bib--box-6 bib--wide'.

`'showRelatedBy'`: allows you to specify whether the terms in common should be displayed along with recommendations. Default is '_false_'.

`'subtitleField'`: allows you to specify the content item field to use as subtitles on the recommended content panel. Any [valid content item field](http://docs.bibblio.apiary.io/#reference/storing-data/content-items/retrieve-a-content-item) can be used. Providing a value of _false_ will disable the subtitle. Default is '_headline_'.


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
    "config": {'styleClasses': 'bib--grd-4 bib--wide'}}
  "actor": {
    "userId": "anonymous-annie"}} // optional
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
<script src="bower_components/underscore/underscore-min.js"></script>
<script src="bower_components/bibblio-related-content-module/js/bib-related-content.js"></script>
<script>
    // Initialise the related content plugin.
    Bibblio.initRelatedContent("bib_related-content-div", 
        'YOUR_RECOMMENDATION_KEY', 
        'YOUR_CONTENT_ITEM_ID', 
        {
            // catalogueIds: ["a8365ab1-00f9-38f8-af51-4d0ff527856f"], // Default: same as content item. 
            styleClasses: "bib--grd-4 bib--wide", // Default: 'bib--box-6 bib--wide'
            showRelatedBy: true, // Default: false. Will also hide if empty, even if set to true
            subtitleField: 'provider.name',  // Default: 'headline'. A value of false will disable subtitles
            userId: "42" // Default: nil.
        }
    );
</script>
```

## Trying it out

The [example.html](example.html) file provided shows a working demo that gets these values from querystrings. You can save this file and open it in your browser in the following format:

```
example.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID
```
