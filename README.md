# Installation

The Bibblio "related content module" (JS and CSS) can be installed with [Bower](https://bower.io/#install-bower) by running:

```
bower install bibblio-related-content-module
```

# Example

The following snippet shows related content module initialisation. See `example.html` for a full, working demo that uses querystring arguments for access token and ids.

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
        'superSecret', // an access token obtained from the bibblio api
        '123-456-789', // the id of the content item to recommend from
        {
            stylePreset: "box-6", // Options: grid-4, box-5, box-6. Default: box-6,
            showRelatedBy: true, // default false. Will also hide if empty, even if true
            subtitleField: 'provider.name',  // default: headline. passing a value of false will disable the subtitle
        }
    );
</script>
```

## CSS

The style and layout is extremely customisable. We've currently implemented 3 presets, which simply provide a css class string on the generated `<ul>` tag as per the full config options below.

### Layouts
* _Row layout:_ bib--row-2, bib--row-3, bib--row-4
* _Grid layout:_ bib--grd-4, bib--grd-6
* _Box layout:_ bib--box-4, bib--box-5, bib--box-6
* _Column layout:_ bib--col-1, bib--col-2, bib--col-3, bib--col-4, bib--col-5, bib--col-6

### Ratios
* _Standard ratio:_ _default_
* _Widescreen ratio:_ bib--wide
* _Square ratio:_ bib--square

### Info text
* _Overlaid text:_ _default_
* _Separate text:_ bib--split
* _Show all text:_ _default_
* _Show title only:_ bib--title-only
* _Reveal secondary text:_ bib--hover

### Extras
* _Hover 'shine' effect:_ bib--shine
* _Retina quality:_ bib--retina
* _If a tile has a background image, this class is added to the anchor 'bib__link':_ bib__link--image
