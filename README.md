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

### 2) Access Token
This allows you to safely connect to the BIbblio API from a page visitor's browser. The `access_token` [must be obtained from our API](http://docs.bibblio.apiary.io/#reference/authorization/token/obtain-an-access-token) before you present the page to visitors.

### 3) contentItemId
The Bibblio `contentItemId` of the article (or other piece of content) being displayed must be provided in order to retrieve content recommendations. The `contentItemId` is provided when [creating a content item](http://docs.bibblio.apiary.io/#reference/enrichment/content-items/create-a-content-item), and is also retrievable when [listing your content items](http://docs.bibblio.apiary.io/#reference/enrichment/content-items/list-content-items).

### 4) configuration object (optional)
A JavaScript object can be provided to set customisation options on the module. This object can contain the following properties:

`'stylePreset'`: allows you to specify the layout of the module. Options are '_grid-4_', '_box-5_' and '_box-6_'. Default is '_box-6_'.

`'showRelatedBy'`: allows you to specify whether the terms in common should be displayed along with recommendations. Default is '_false'.

`'subtitleField'`: allows you to specify the content item field to use as subtitles on the recommended content panel. Any [valid content item fields](http://docs.bibblio.apiary.io/#reference/enrichment/content-items/retrieve-a-content-item) can be used. Providing a value of _false_ will disable the subtitle. Default is '_headline_'.


## An example

The following snippet shows the initialisation of the related content module - needing `YOUR_ACCESS_TOKEN` and `YOUR_CONTENT_ITEM_ID` values to be replaced with [an access token for your account](http://docs.bibblio.apiary.io/#reference/authorization/token/obtain-an-access-token) and the "contentItemId" returned when creating an item or from [listing your content items](http://docs.bibblio.apiary.io/#reference/enrichment/content-items/list-content-items).

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
    Bibblio.initRelatedContent("bib_related-content", // the id of the containing element
        'YOUR_ACCESS_TOKEN', // an access token obtained from the bibblio api
        'YOUR_CONTENT_ITEM_ID', // the id of the content item to recommend from
        {
            stylePreset: "box-6", // Options: grid-4, box-5, box-6. Default: box-6,
            showRelatedBy: true, // default false. Will also hide if empty, even if true
            subtitleField: 'provider.name',  // default: headline. passing a value of false will disable the subtitle
        }
    );
</script>
```

## Trying it out

The [example.html](example.html) file provided shows a working demo that gets these values from querystrings. You can save this file and open it in your browser in the following format:

```
example.html?accessToken=YOUR_ACCESS_TOKEN&contentItemId=YOUR_CONTENT_ITEM_ID
```