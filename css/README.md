## CSS

The style and layout is extremely customisable. We've currently implemented 3 presets, which simply provide a css class string on the generated `<ul>` tag as per the full config options below.

### Layouts
* _Column layout:_ bib--col-2, bib--col-3, bib--col-4, bib--col-5, bib--col-6
* _Grid layout:_ bib--grd-4, bib--grd-6
* _Row layout:_ bib--row-1, bib--row-2, bib--row-3, bib--row-4
* _Showcased Box layout:_ bib--box-3, bib--box-5, bib--box-6
* _Text-only layout:_ bib--txt-1, bib--txt-3, bib--txt-6

### Ratios
* _Standard ratio:_ _default_
* _Widescreen ratio:_ bib--wide
* _Square ratio:_ bib--square
* _Tall ratio:_ bib--tall

### Display options
* _Text on image (not for text-only layout):_ _default_
* _Text beneath image (not for text-only layout):_ bib--split
* _Show explanation of these recommendations via a link beneath the module:_ bib--about

### Properties
* _Show author:_ bib--author-show
* _Show date published:_ bib--recency-show

### Hover combinations (not for text-only layout)
* _Show title and properties:_ _default_
* _Show image only, hover for title:_ bib--image-only
* _Show image only, hover for title and properties:_ bib--image-only bib--title-only
* _Show image only, hover for title, properties and preview:_ bib--image-only bib--hover
* _Show title, hover for properties:_ bib--title-only
* _Show title, hover for properties and preview:_ bib--title-only bib--hover
* _Show title and properties, hover for preview:_ bib--hover

### Headline font family
* _Arial:_ bib--font-arial _(default)_
* _Arial Black:_ bib--font-arialblack
* _Comic Sans:_ bib--font-comic
* _Courier New:_ bib--font-courier
* _Georgia:_ bib--font-georgia
* _Palatino Linotype:_ bib--font-palatino
* _Tahoma:_ bib--font-tahoma
* _Times New Roman:_ bib--font-times
* _Trebuchet MS:_ bib--font-trebuchet
* _Verdana:_ bib--font-verdana

### Headline text size
* _14px:_ bib--size-14
* _16px:_ bib--size-16
* _18px:_ bib--size-18 _(default)_
* _20px:_ bib--size-20
* _22px:_ bib--size-22

### Text alignment
* _Align all tile text to the left:_ bib--text-left
* _Align all tile text to the center:_ bib--text-center
* _Align all tile text to the right:_ bib--text-right
* _Justify all tile text:_ bib--text-justify

### Image alignment
* _Align all images to top of tiles:_ bib--image-top
* _Align all images to middle of tiles:_ _default_
* _Align all images to bottom of tiles:_ bib--image-bottom

### Extras
* _Hover 'shine' effect:_ bib--shine
* _Hover 'spectrum' effect:_ bib--spectrum
* _Invert the text color when it's beneath an image or text-only, for clearer display on dark page backgrounds:_ bib--invert
* _If a tile has a background image, this class is automatically added to the anchor 'bib__link':_ bib__link--image
* _Hide module for testing:_ bib--hide
