# Bibblio Related Content Module

Display content recommendations quickly and easily with [Bibblio](http://bibblio.org)'s pre-built Related Content Module (RCM). To get started you must [set up an account](https://www.bibblio.org/plans).

## Installing the assets

### CDN (recommended)
The easiest way to use the module is via our CDN. Simply include the assets in your webpage as follows:

```html
<head>

    <!-- CSS -->
    <link rel="preload" type="text/css" href="https://cdn.bibblio.org/rcm/4.28/bib-related-content.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'"/>

    <!-- JavaScript -->
    <script type="application/javascript" charset="UTF-8" src="https://cdn.bibblio.org/rcm/4.28/bib-related-content.min.js" defer></script>

</head>
```

If you would like to host the assets yourself they can be installed via [Bower](https://bower.io/#install-bower) and [NPM](https://www.npmjs.com/get-npm).

### Bower
The Bower package can be installed like this:
```shell
bower install bibblio-related-content-module
```

And included on a webpage like this:
```html
<head>

    <!-- CSS -->
    <link rel="preload" type="text/css" href="bower_components/bibblio-related-content-module/css/bib-related-content.css" as="style" onload="this.onload=null;this.rel='stylesheet'"/>

    <!-- JavaScript -->
    <script type="application/javascript" charset="UTF-8" src="bower_components/bibblio-related-content-module/js/bib-related-content.js" defer></script>

</head>
```

### NPM
The NPM package can be installed like this:
```shell
npm install bibblio-related-content-module
```

And included on a webpage like this:
```html
<head>

    <!-- CSS -->
    <link rel="preload" type="text/css" href="node_modules/bibblio-related-content-module/css/bib-related-content.css" as="style" onload="this.onload=null;this.rel='stylesheet'"/>

    <!-- JavaScript -->
    <script type="application/javascript" charset="UTF-8" src="node_modules/bibblio-related-content-module/js/bib-related-content.js" defer></script>

</head>
```

If using NodeJS you may also want to require the module like this:
```javascript
var Bibblio = require("bibblio-related-content-module");
```

## Importing Content
Once the JS & CSS assets are included, content can be imported to your Bibblio account.

To start importing, the `import` function needs to be executed. The `import` function should execute on any page you wish to import to your Bibblio account. Under normal circumstances the `import` function should be executed upon page load. However, given that there are different implementation constraints, Bibblio does not assume when the `import` function should be executed, therefore `import` is not executed on page load by default. Additionally, only one `import` function is required per page, regardless of how many modules you plan to display.

###### Example: Initiate a request to Bibblio’s [URL ingestion endpoint](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-url-ingestion), on page load, using custom catalogue and content item ids.
```html
<script type="application/javascript" charset="UTF-8">

    window.addEventListener("load", function() {
        Bibblio.import({
            recommendationKey: "YOUR_RECOMMENDATION_KEY",
            autoIngestionCustomCatalogueId: "YOUR_CUSTOM_CATALOGUE_ID",
            customUniqueIdentifier: "YOUR_CUSTOM_UNIQUE_IDENTIFIER"
        });
    });

</script>
```

### Options Fields
The `options` object is the first and only parameter supplied to the `import` function. It is used to tailor the page ingestion to your specifications. It is a required parameter, must be a JavaScript object, and can contain the following properties:

#### Required

#### `recommendationKey` _(required)_
Safely connect to the Bibblio API from a page visitor's browser using a recommendation key. This can be [obtained from our API](https://bibblio.docs.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) or [your management console](https://developer.bibblio.org/admin/account) (click on the _Credentials_ page and then select _Manage my keys_).

###### Example: Safely connect to the Bibblio API using your recommendation key.
```javascript
{
    recommendationKey: "YOUR_RECOMMENDATION_KEY"
}
```

#### Optional

#### `autoIngestionCatalogueId` _(optional)_
When auto-ingesting, this property allows you to specify the catalogueId to which a content item should be assigned. This will only take effect on initial ingestion. Imports subsequent to ingestion will disregard this property. It cannot be supplied if `autoIngestionCustomCatalogueId` is present.

###### Example: Ingesting to a specific catalogue by id.
```javascript
{
    autoIngestionCatalogueId: "YOUR_CATALOGUE_ID"
}
```

#### `autoIngestionCustomCatalogueId` _(optional)_
Specify your own label to identify the catalogue that a content item should be assigned to when auto-ingesting. The specified catalogue will be created if it does not exist. Thereafter it will be reused. Catalogue assignment will only take effect on initial ingestion; imports subsequent to ingestion will disregard this property. It cannot be supplied if `autoIngestionCatalogueId` is present.

###### Example: Ingesting to a specific catalogue by custom id.
```javascript
{
    autoIngestionCustomCatalogueId: "YOUR_CUSTOM_CATALOGUE_ID"
}
```

#### `autoIngestionUrl` _(optional)_
Specify which URL should be used for page scraping, as well as determine the URL property of a content item. This can be useful if the import function is added to a page where the canonical value links to an external domain. In this case, the canonical value will still be used as a `customUniqueIdentifier`.

###### Example: Ingesting to a specific catalogue by custom id.
```javascript
{
    autoIngestionUrl: "YOUR_URL_FOR_PAGE_SCRAPING"
}
```

#### `customUniqueIdentifier` _(optional)_
It is possible to use your own identifier when creating a content item. If not supplied, Bibblio will default to the canonical value of a page to assign a customUniqueIdentifier to a content item.

###### Example: Using your own identifier when creating a content item.
```javascript
{
    customUniqueIdentifier: "YOUR_CUSTOM_UNIQUE_IDENTIFIER"
}
```

## Displaying Recommendations

Once the JS & CSS assets are included and content items have been imported, the display module can be added to your page(s).

To display recommendation, the `init` function needs to be executed. The `init` function accepts an array of JavaScript objects as input. When displaying recommendations the `type` field should be set to `rcm`. In this example, only one module is required, so a single Javascript object sits within the array, however it is possible to supply multiple objects to initialize more than one module.

###### Example A: Initializing one related content module.
```html
<div id="bib--rcm-element"></div>

<script type="application/javascript" charset="UTF-8">

    window.addEventListener("load", function() {
        Bibblio.init([{
            type: "rcm",
            options: {
                targetElementId: "bib--rcm-element",
                recommendationKey: "YOUR_RECOMMENDATION_KEY",
                customUniqueIdentifier: "YOUR_CUSTOM_UNIQUE_ID",
                customCatalogueIds: ["YOUR_CUSTOM_CATALOGUE_ID"],
                recommendationType: "related",
                styleClasses: "bib--box-5 bib--square bib--font-georgia bib--author-show"
            },
            callbacks: {
                onRecommendationsRendered: function (recommendedItems) {
                    console.log(recommendedItems);
                },
                onRecommendationViewed: function (viewedTrackingData) {
                    console.log(viewedTrackingData);
                }
            }
        }]);
    });

</script>
```

###### Example B: Initializing two related content modules.
```html
<div id="bib--rcm-element-one"></div>

<div id="bib--rcm-element-two"></div>

<script type="application/javascript" charset="UTF-8">

    window.addEventListener("load", function() {
        Bibblio.init([
            {
                type: "rcm",
                options: {
                    targetElementId: "bib--rcm-element-one",
                    recommendationKey: "YOUR_RECOMMENDATION_KEY",
                    recommendationType: "popular",
                    styleClasses: "bib--row-3 bib--split bib--recency-show",
                    subtitleField: "description",
                    dateFormat: "DMY"
                },
                callbacks: {
                    onRecommendationClick: function (clickedItem, clickEvent) {
                        console.log(clickedItem);
                        console.log(clickEvent);
                    }
                }
            },
            {
                type: "rcm",
                options: {
                    targetElementId: "bib--rcm-element-two",
                    recommendationKey: "YOUR_RECOMMENDATION_KEY",
                    customUniqueIdentifier: "YOUR_CUSTOM_UNIQUE_ID",
                    recommendationType: "personalised",
                    customCatalogueIds: ["YOUR_CUSTOM_CATALOGUE_ID"],
                    styleClasses: "bib--grd-6 bib--tall bib--image-only bib--shine",
                    userId: "INSERT_USER_ID",
                    userMetadata: {
                        occupation: "Nurse",
                        location: "England"
                    },
                    queryStringParams: {
                        itm_source: "Bibblio",
                        itm_medium: "sidebar_widget"
                    }
                }
            }
        ]);
    });

</script>
```

### Options Field
The `options` field is used to tailor the module to your specifications. It is required, must be a JavaScript object, and can contain the following properties:

#### Required

#### `recommendationKey` _(required)_
Safely connect to the Bibblio API from a page visitor's browser using a recommendation key. This can be [obtained from our API](https://bibblio.docs.apiary.io/#reference/authorization/recommendation-keys/list-recommendation-keys) or [your management console](https://developer.bibblio.org/admin/account) (click on the _Credentials_ page and then select _Manage my keys_).

###### Example: Safely connect to the Bibblio API using your recommendation key.
```javascript
{
    recommendationKey: "YOUR_RECOMMENDATION_KEY"
}
```

#### `targetElementId` _(required)_
The DOM id of an HTML element you'd like to initialize as a related content module. (Nb. This will delete any pre-existing content in that element, replacing it solely with the module.) For example, this parameter could have the value `bib--rcm-element`, provided the following element exists on the page:

###### Example: Initialize the related content module in a div with an id of `bib-rcm-element`.
```html
<div id="bib--rcm-element"></div>
```
#### Optional

#### `contentItemId` _(optional)_
The Bibblio `contentItemId` of the content item being displayed. Content recommendations will be based on this Bibblio content item. The `contentItemId` is provided after [creating a content item](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-content-item), and is retrievable when [listing your content items](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/list-content-items).

###### Example: Retrieve recommendations using the Bibblio content identifier.
```javascript
{
    contentItemId: "THE_BIBBLIO_CONTENT_ITEM_IDENTIFIER"
}
```

#### `customUniqueIdentifier` _(optional)_
It is possible to use your own id to retrieve recommendations. To do this, make sure you provide a `customUniqueIdentifier` when [creating a content item](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/create-a-content-item). You can then specify the `customUniqueIdentifier` here, when retrieving recommendations.

**Nb**: It is advisable to provide either a `contentItemId` **or** a `customUniqueIdentifier`. If neither is provided the module will attempt to retrieve recommendations using the canonical value of the page it has loaded on. This could result in no recommendations being retrieved if the canonical is not present or altered.

###### Example: Retrieve recommendations using your own content identifier.
```javascript
{
    customUniqueIdentifier: "YOUR_CUSTOM_UNIQUE_IDENTIFIER"
}
```

#### `catalogueIds` _(optional)_
The [catalogues](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues) that recommendations should be retrieved from. The `catalogueId` of [any catalogues you own](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues/list-catalogues) would be valid. Accepts an array of strings. If not supplied, the default is the same catalogue as the source content item specified upon ingestion. It cannot be supplied if customCatalogueIds is present.

###### Example A: Retrieve recommendations from one catalogue.
```javascript
{
    catalogueIds: ["YOUR_CATALOGUE_ID"]
}
```

###### Example B: Retrieve recommendations from two catalogues.
```javascript
{
    catalogueIds: ["YOUR_CATALOGUE_ID_1", "YOUR_CATALOGUE_ID_2"]
}
```

#### `customCatalogueIds` _(optional)_
The `customCatalogueIds` that a recommendation should be retrieved from. This allows you to retrieve recommendations for a particular [catalogue](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues) without having to store a Bibblio `catalogueId` (see `autoIngestionCustomCatalogueId` above). Accepts an array of strings. If not supplied, the default is the same catalogue as the source content item specified. It cannot be supplied if `catalogueIds` is present.

###### Example A: Retrieve recommendations from one catalogue.
```javascript
{
    customCatalogueIds: ["YOUR_CUSTOM_CATALOGUE_ID"]
}
```

###### Example B: Retrieve recommendations from two catalogues.
```javascript
{
    customCatalogueIds: ["YOUR_CUSTOM_CATALOGUE_ID_1", "YOUR_CUSTOM_CATALOGUE_ID_2"]
}
```

#### `autoIngestion` _(optional)_
The Related Content Module is able to ingest content automatically. If the item does not exist and `autoIngestion` is set to `true`, the module will request that Bibblio's servers retrieve the page and parse a content item from it. This saves you the trouble of integrating with Bibblio on your backend systems, at the cost of a more complex set of interations and less control when creating content items. When `autoIngestion` is enabled, a `customUniqueIdentifier` can be supplied, otherwise the module will assign its own custom unique identifier value to the page using the canonical value.

The item will be ingested the first time it is viewed in a browser. The domain from which it originates must be [whitelisted](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/whitelist-a-domain-for-url-ingestion), and future updates to the page text or image will not be recognized or auto-ingested. If you require more thorough integration with your backend systems then it would be best to [integrate with the API directly](https://bibblio.docs.apiary.io/#reference/storing-data) instead.

###### Example: Have the content automatically ingested if it doesn't exist in Bibblio.
```javascript
{
    autoIngestion: true
}
```

#### `dateFormat` _(optional)_
Change the format of the content items' published date when being displayed on the Related Content Module. `DMY` will display the date as `3 July 2021`, `MDY` as `July 3, 2021` and `YMD` as `2021 July 3`. The default is `DMY`.

###### Example: Format the content items' published date.
```javascript
{
    dateFormat: "DMY"
}
```

#### `hidden` _(optional)_
This lets you perform a full integration without visually displaying the module. This is useful for testing display on a live environment without disrupting the user experience. Entering `Bibblio.showModules();` in the developer console will show all hidden modules on the page. The default is `false`.

More nuanced, device-specific show-and-hide capabilities for displaying modules are available using the Hide add-on. See the Add-ons section below for more.

###### Example: Don't render the recommendations upon module load.
```javascript
{
    hidden: true
}
```

#### `lazyload` _(optional)_
By default, all modules will load their images the moment a user starts scrolling the page, unless the module is already visible on page load, whereupon it will load its images immediately, without listening for an interaction. This lazy loading feature can be disabled by setting this parameter to `false`.

###### Example: Disable lazy loading.
```javascript
{
    lazyLoad: false
}
```

#### `offset` _(optional)_
Offset the recommendations list before rendering, thereby skipping a specified number of items. This is useful if you'd like to put multiple modules using the same recommendation type on the page without displaying duplicate items. Simply offset the second module by the number of items displayed in the first. The supplied value must be an integer between `1` and `14`.

###### Example: Skip 2 recommendations and start from the 3rd in the list.
```javascript
{
    offset: 2
}
```

#### `placeholders` _(optional)_
Replace module tiles with empty placeholder HTML elements at predefined locations. `placeholders` accepts an array of integer values between `1` and `6` so that, for example, `[2,4]` will render two empty placeholder elements in the _second_ and _fourth_ tile positions. When rendered, these empty placeholder HTML elements have a distinct CSS class of `bib__placeholder` that can be used as a lookup when dynamically injecting ad slots or other content in-between recommendations. You can also replace module tiles with populated placeholder HTML elements at predefined locations by supplying the `placeholders` parameter with a Javascript object. This object needs one or more keys, each being integer values between `1` and `6`, which describe the placeholder positions, and each key being assigned a Javascript object with the following fields, `title`, `url`, `author`, `description`, `moduleImage`,`date`. When using the JSON version `title` and `url` are required fields.

###### Example A: Provision two blank placeholder elements in the second and fourth tile positions
```javascript
{
    placeholders: [2,4]
}
```

###### Example B: Provision two populated placeholder elements in the first and third tile positions.
```javascript
{
    placeholders: {
        1: {
                title: "Click me!",
                url: "https://click.me/to/go/somewhere",
                author: "F. Realz",
                description: "You should really click this.",
                moduleImage: "https://www.example.com/people-happily-clicking.jpg", date: "Today"
            },
        3:  {
                title: "And me!",
                url: "https://click.me/to/go/elsewhere",
                description: "Click me too please.",
                moduleImage: "https://www.example.com/happy-face.jpg",
                date: "Yesterday"
            }
    }
}
```

#### `queryStringParams` _(optional)_
Append additional query string parameters to the target URL of recommended items. This is particularly useful for specifying analytics parameters such as `utm_source`. The value should be a JavaScript object. Each property will be added as a parameter to the URL.

###### Example: Append `utm_source=BibblioRCM&utm_campaign=SiteFooter` to the URL of all recommended items.
```javascript
{
    utm_source: "BibblioRCM",
    utm_campaign: "SiteFooter"
}
```

#### `recommendationType` _(optional)_
Specify the type of recommendations to serve. The types are:

`related` - Recommendations ignore user behavior and are based purely on relatedness. Requires the `contentItemId` or `customUniqueIdentifier` fields.

`optimised` - Recommendations are rooted in relevance but will also learn from user behavior and continuously adapt to attain better engagement. Requires the `contentItemId` or `customUniqueIdentifier` fields.

`latest` - Recommendations ignore relatedness and are based purely on the `datePublished` field set, returning those most recently published. Doesn't require the `contentItemId` or `customUniqueIdentifier` fields.

`popular` - Recommendations ignore relatedness and are based purely on aggregated user behaviour. Doesn't require the `contentItemId` or `customUniqueIdentifier` fields.

`personalised` - Recommendations are tailored to a specific user. Requires the `userId` field. Doesn't require the `contentItemId` or `customUniqueIdentifier` fields.

It is best to start with `related` recommendations, then add `optimised`, `popular` or `personalised` modules elsewhere on the page to fit the site experience you desire. If `recommendationType` is not supplied, the module will default to `optimised`. If no optimised recommendations are available, it will fall back to `related`, and if no related recommendations are available, it will fall back to `latest`.

###### Example A: Retrieve related recommendations.
```javascript
{
    recommendationType: "related",
    contentItemId: "YOUR_CONTENT_ITEM_ID"
}
```

###### Example B: Retrieve optimised recommendations.
```javascript
{
    recommendationType: "optimised",
    contentItemId: "YOUR_CONTENT_ITEM_ID"
}
```

###### Example C: Retrieve latest recommendations.
```javascript
{
    recommendationType: "latest"
}
```

###### Example D: Retrieve popular recommendations.
```javascript
{
    recommendationType: "popular"
}
```

###### Example E: Retrieve personalised recommendations.
```javascript
{
    recommendationType: "personalised",
    userId: "YOUR_SPECIFIC_USER_ID"
}
```

#### `corpusType` _(optional)_
By specifying `syndicated` as the corpusType, you could retrieve optimised recommendations across several [catalogues](https://bibblio.docs.apiary.io/#reference/storing-data/catalogues) from different Bibblio accounts. Syndication requires some setup on Bibblio's part. Please get in touch if you'd like to share traffic directly with other publishers or your own network of sites.

###### Example: Retrieve syndicated recommendations (requires some setup on Bibblio's part).
```javascript
{
    corpusType: "syndicated"
}
```

#### `styleClasses` _(optional)_
Select pre-defined CSS classes that govern the layout, features and interactivity of the Related Content Module. The classes cover everything from the module's tile arrangement, image ratio and text formatting, to the metadata display and mouse interaction effects. A full list of available classes can be found in the [CSS directory's readme](https://github.com/bibblio/related-content-module/blob/master/css/README.md).

###### Example A: Simple Related Article Module. A row of three recommendation tiles, with the title beneath the featured images (each image is a 4:3 ratio by default), displaying the dates published.
```javascript
{
    styleClasses: "bib--row-3 bib--split bib--recency-show"
}
```

###### Example B: Content Showcase Module. Two rows of recommendation tiles (two above, three below), each in a square ratio (1:1), with titles overlaid in the Georgia system font, displaying the content authors.
```javascript
{
    styleClasses: "bib--box-5 bib--square bib--font-georgia bib--author-show"
}
```

###### Example C: Book Cover Display Module. A grid of six recommendation tiles (three above, three below), each in a tall (2:3) ratio, displaying the image only until a pointer hover reveals the title and a shine effect.
```javascript
{
    styleClasses: "bib--grd-6 bib--tall bib--image-only bib--shine"
}
```

#### `subtitleField` _(optional)_
Specify the content item field you want to use to populate the description value of each recommendation item. This description will be revealed when a pointer hovers over a module tile and the class `bib__hover` has been added to `styleClasses`. Any [valid content item field](https://bibblio.docs.apiary.io/#reference/storing-data/content-items/retrieve-a-content-item) can be used. Nested fields are accessed using a period symbol. Providing a value of `false` will disable the subtitle. The default is `headline`.

###### Example A: Use a top level field for the subtitle.
```javascript
{
    subtitleField: "description"
}
```

###### Example B: Use a nested field for the subtitle.
```javascript
{
    subtitleField: "author.name"
}
```

###### Example C: Disable the subtitle.
```javascript
{
    subtitleField: false
}
```

#### `truncateTitle` _(optional)_
Set a character length for truncating the titles of recommendations. The minimum value is `1` and maximum is `100`. If this field is omitted, the titles are automatically truncated for best fit, based on the module tile arrangement and image ratio, if any, you have specified via `styleClasses`.

###### Example: Truncate the recommendation titles to 20 characters.
```javascript
{
    truncateTitle: 20
}
```

#### `userId` _(optional)_
Your own unique id for the current site visitor. This allows Bibblio to compute personalized recommendations. This can be supplied for any `recommendationType` to generate additional training data for Bibblio's personalization algorithms. Please do not provide any personally identifiable information for this field.

###### Example: Provide a user id.
```javascript
{
    userId: "YOUR_SPECIFIC_USER_ID"
}
```

#### `userMetadata` _(optional)_
Allows you to supply additional properties pertaining to the user specified by `userId`. This will be taken into account when training algorithms that produce personalized recommendations. The value should be a Javascript object and can contain any keys. Be sparing with this data and only include things that are specific to your user and pertinent to your domain. This could include the user's occupation or their field of interest. This cannot be supplied if `userId` is not present.

###### Example: Provide user specific metadata.
```javascript
{
    userMetadata: {
        occupation: "Nurse",
        location: "England"
    }
}
```

### Callbacks Field
The `callbacks` field is optional. It allows you to supply your own functionality in the render chain. If supplied, it must be a JavaScript object, must specify only the following callback hooks, and each hook must be a Javascript function:

#### Optional

#### `onRecommendationsRendered` _(optional)_
The supplied function will be called once the module has rendered recommendations. This can be useful for toggling any visual elements that should only be displayed when recommendations have rendered successfully. An array of recommendations returned by Bibblio's API will be passed to this function.
```javascript
{
  onRecommendationsRendered: function (recommendedItems) {
    console.log(recommendedItems);
  }
}
```

#### `onRecommendationViewed` _(optional)_
The supplied function will be called when the module has scrolled into view. A JavaScript object containing Bibblio's tracking data for the view event will be passed to this function.
```javascript
{
  onRecommendationViewed: function (viewedTrackingData) {
    console.log(viewedTrackingData);
  }
}
```

#### `onRecommendationClick` _(optional)_
The supplied function will be called when a specific recommendation is clicked. This function will receive two parameters. The first parameter will be the specific recommendation that was clicked, and the second parameter will be the DOM click event itself.
```javascript
{
  onRecommendationClick: function (clickedItem, clickEvent) {
    console.log(clickedItem);
    console.log(clickEvent);
  }
}
```

## Add-ons
The functionality of Bibblio's Related Content Module can be extended by using add-ons. These can include different layouts or display controls, allowing added flexibility when implementing modules. The add-ons are declared within HTML elements that wrap the RCM's element, and can contain parameters to further customize them. No additional JavaScript or CSS is required to enable an add-on.

### Hide Add-on
This add-on can stop an RCM rendering on either desktop and tablet or mobile. This is useful if you would like to show a certain module layout on desktop but use another layout on mobile that better fits the screen shape. Hiding an RCM means it does not render in your page DOM, which ensures no API calls or tracked events are made, keeping your usage and activity data clean.

Wrap your module's HTML element in a new element with an id of your choosing, such as `bib--hide-element`. Within the `init` function, add a JavaScript object with the `type` field set to `hide`. The `options` field must contain a `targetElementId`, the value of which must match the id of your wrapping element. Within `options`, to hide an RCM on mobile devices so that it only displays on desktop and tablets, use `hidden: ‘mobile’`. Conversely, to hide an RCM on desktop and tablet devices so that it only displays on mobile, use `hidden: ‘web’`. To hide an RCM on all device types, omit the `hidden` key from `options` altogether.

###### Example: Hiding the related content module on mobile browsers.
```html
<div id="bib--hide-element">
  <div id="bib--rcm-element"></div>
</div>

<script type="application/javascript" charset="UTF-8">

    window.addEventListener("load", function() {
        Bibblio.init([
            {
                type: "rcm",
                options: {
                    targetElementId: "bib--rcm-element",
                    recommendationKey: "YOUR_RECOMMENDATION_KEY"
                }
            },
            {
                type: "hide",
                options: {
                    targetElementId: "bib--hide-element",
                    hidden: "mobile"
                }
            }
        ]);
    });

</script>
```

### Takeover Add-on
Related Content Modules can be rendered within a takeover panel. This panel slides into view when a tab, attached to the side of the viewport, is tapped. One or more modules can be revealed inside the panel. A takeover panel is helpful when displaying recommendations on a page with limited available space, or for rendering on smaller screen sizes.

Wrap your module's HTML element in a new element with an id of your choosing, such as `bib--takeover-element`. Within the `init` function, add a JavaScript object with the `type` field set to `takeover`. The `options` field must contain a `targetElementId`, the value of which must match the id of your wrapping element. The tab's label can be changed using `tabText` within `options`. The default label reads "Related articles".

###### Example: Placing the related content module within a takeover panel.
```html
<div id="bib--takeover-element">
  <div id="bib--rcm-element"></div>
</div>

<script type="application/javascript" charset="UTF-8">

    window.addEventListener("load", function() {
        Bibblio.init([
            {
                type: "rcm",
                options: {
                    targetElementId: "bib--rcm-element",
                    recommendationKey: "YOUR_RECOMMENDATION_KEY",
                    styleClasses: "bib--col-3"
                }
            },
            {
                type: "takeover",
                options: {
                    targetElementId: "bib--takeover-element",
                    tabText: "Related articles"
                }
            }
        ]);
    });

</script>
```

### Combining the Add-ons

A takeover add-on can be inserted within a hide add-on. This is useful if you would like a takeover panel to appear only on mobile. Simply nest your three HTML elements so that the hide add-on element wraps the takeover element which in turn wraps the RCM element.

###### Example: Placing the related content module within a takover panel that is only visible on mobile browsers.
```html
<div id="bib--hide-element">
  <div id="bib--takeover-element">
    <div id="bib--rcm-element"></div>
  </div>
</div>

<script type="application/javascript" charset="UTF-8">

    window.addEventListener("load", function() {
        Bibblio.init([
            {
                type: "rcm",
                options: {
                    targetElementId: "bib--rcm-element",
                    recommendationKey: 'YOUR_RECOMMENDATION_KEY',
                    styleClasses: 'bib--col-3'
                }
            },
            {
                type: "takeover",
                options: {
                    targetElementId: "bib--takeover-element",
                    tabText: 'Related articles'
                }
            },
            {
                type: "hide",
                options: {
                    targetElementId: "bib--hide-element",
                    hidden: 'web'
                }
            }
        ]);
    });

</script>
```

### Google AMP (Accelerated Mobile Pages)
Bibblio's Related Content Module can be implemented on Google AMP using an amp-iframe. The HTML page that will render inside the iframe is hosted on Bibblio's servers.

######  Example: Using the related content module with Google AMP.
```html
<amp-iframe width="1" height="1" layout="responsive" resizable sandbox="allow-scripts allow-top-navigation allow-same-origin" src="https://cdn.bibblio.org/rcm/4.28/amp.html?recommendationKey=YOUR_RECOMMENDATION_KEY&customUniqueIdentifier=YOUR_CUSTOM_UNIQUE_IDENTIFIER">
    <div overflow tabindex=0 role=button aria-label="See more">See more!</div>
    <amp-img layout="fill" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" placeholder></amp-img>
</amp-iframe>
```

All parameters are supported and can be passed in as querystring parameters to the amp-iframe `src` as above. The format of some parameters will vary due to the constraint of passing data through an iframe URL. These variances are described below.

Some things to note:

* Providing an `<amp-img layout="fill" src="..." placeholder></amp-img>` within the amp-iframe tag is necessary [to avoid restrictions on module placement](https://www.ampproject.org/docs/reference/components/amp-iframe#iframe-with-placeholder).
* Providing a `<div overflow ...>` child element is necessary to [allow resizing](https://www.ampproject.org/docs/reference/components/amp-iframe#iframe-resizing).
* `width` and `height` properties are required by AMP. It's safe to use placeholder values of `1` so long as `layout="responsive" resizable` is also included ,since the iframe will then scale to the module once rendered.
* `sandbox="allow-scripts allow-top-navigation allow-same-origin"` is required. This enables Bibblio's JavaScript within the iframe, allows recommendation clicks to open, and lets the iframe update its size in the parent window.
* `styleClasses` are comma-separated when supplied to the iframe.
* `queryStringParams` take a different format when supplied to the iframe. They can be supplied directly in the `src` property without an enclosing `queryStringParams=__` container.

###### Example: Appending `utm_source=Bibblio` and `utm_campaign=related` to your recommendation links and using the `bib--row-3` and `bib--hover` styleClasses.
```html
<amp-iframe width="1" height="1" layout="responsive" resizable sandbox="allow-scripts allow-top-navigation allow-same-origin" src="https://cdn.bibblio.org/rcm/4.28/amp.html?recommendationKey=YOUR_RECOMMENDATION_KEY&contentItemId=YOUR_CONTENT_ITEM_ID&utm_source=Bibblio&utm_campaign=related&styleClasses=bib--row-3,bib--hover">
    <div overflow tabindex=0 role=button aria-label="See more">See more!</div>
    <amp-img layout="fill" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" placeholder></amp-img>
</amp-iframe>
```
