# CSS

The style and layout is extremely customizable. Use the following classes in the CSS class string to determine the layout you require. Default styles do not need to be declared, but are listed here for reference.

## Required

### Layouts (Required)

A layout is an arrangement of recommendations in a module. Where applicable, the suffixed number indicates the quantity of recommendations that will be displayed. Choose one layout only.

* _Row:_ `bib--row-1`, `bib--row-2`, `bib--row-3`, `bib--row-4`
* _Carousel:_ `bib--car-6`
* _Column:_ `bib--col-2`, `bib--col-3`, `bib--col-4`, `bib--col-5`, `bib--col-6`
* _Showcased Box:_ `bib--box-3`, `bib--box-5`, `bib--box-6`
* _Grid:_ `bib--grd-4`, `bib--grd-6`, `bib--grd-6v`
* _Text-only:_ `bib--txt-1`, `bib--txt-3`, `bib--txt-6`
* _Next Article:_ `bib--nxt-title`, `bib--nxt-thumb`, `bib--nxt-overlay`, `bib--nxt-label`, `bib--nxt-side`

## Optional

### Headline font family

Choose one font family to change the headline font of all recommendations in a module. By default, the module uses the font assigned to the containing element in your page. If you have a particular font that is neither assigned to the containing element within which you've placed the module or is one of the common system fonts listed below, you can declare it in your own CSS. For legibility, all other text in the recommendation is set to Arial. This can also be overridden within your own CSS.

* _Inherit page's own font:_ `bib--font-inherit` _(default)_
* _Arial:_ `bib--font-arial`
* _Arial Black:_ `bib--font-arialblack`
* _Comic Sans:_ `bib--font-comic`
* _Courier New:_ `bib--font-courier`
* _Georgia:_ `bib--font-georgia`
* _Palatino Linotype:_ `bib--font-palatino`
* _Tahoma:_ `bib--font-tahoma`
* _Times New Roman:_ `bib--font-times`
* _Trebuchet MS:_ `bib--font-trebuchet`
* _Verdana:_ `bib--font-verdana`

### Headline text size

Choose one headline text size only.

* _14px:_ `bib--size-14`
* _16px:_ `bib--size-16`
* _18px:_ `bib--size-18` _(default)_
* _20px:_ `bib--size-20`
* _22px:_ `bib--size-22`

### Hide

You can hide a module from view for testing purposes. Be aware that despite the module not being visible, it will still call the Bibblio API, which could impact your recommendation call allowance and metrics. To avoid this you can use the [Hide Add-on](https://github.com/bibblio/related-content-module-source/blob/master/public/README.md#add-ons) instead.

* _Hide module:_ `bib--hide`

### Hover combinations

Choose a combination of these classes to display and reveal information when a pointer hovers over a recommendation. (These do not apply to Text-only or Next Article layouts.)

* _Show title and properties_ _(default)_
* _Show image only, hover for title:_ `bib--image-only`
* _Show image only, hover for title and properties:_ `bib--image-only bib--title-only`
* _Show image only, hover for title, properties and preview:_ `bib--image-only bib--hover`
* _Show title, hover for properties:_ `bib--title-only`
* _Show title, hover for properties and preview:_ `bib--title-only bib--hover`
* _Show title and properties, hover for preview:_ `bib--hover`

### Image alignment

By default, images are cropped to their center to fit within a chosen tile ratio. All images can be set so that they are cropped to their top or bottom instead. (Nb. The image file itself is not cropped and resaved - it is only its appearance within the tile that gives the effect of being cropped.)

* _Crop from the top:_ `bib--image-top`
* _Crop to the middle:_ `bib--image-middle` _(default)_
* _Crop from the bottom:_ `bib--image-bottom`

### Image hovers

Set an effect if a pointer hovers over a tile image. Choose one effect only. 

* _Shine effect:_ `bib--shine`
* _Spectrum effect:_ `bib--spectrum`

### Invert text

Choose one invert text setting only.

* _Automatically invert the text color if the user's OS is set to dark mode and the website is designed to switch to this mode:_ `bib--mode-dark`
* _Manually invert the text color for darker webpage designs:_ `bib--invert`

### Properties

Choose one or more these content recommendation properties to display.

* _Show author:_ `bib--author-show`
* _Show date published:_ `bib--recency-show`
* _Show domain name:_ `bib--site-show`

### Properties - custom

You can display up to five custom properties on your recommendations. (These custom properties are defined using the `customFields` property when importing your content items via the [Bibblio API](https://developer.bibblio.org/docs).) 

Each custom property's name and value can be displayed separately. E.g. A content item's custom property 1 has the name "Genre" and the value "Drama". When both `bib--custom1-name-show` and `bib--custom1-value-show` style classes are used, "_Genre_ Drama" is displayed when that item is recommended. When only the `bib--custom1-value-show` style class is used, only "Drama" is displayed.

* _Show custom property 1 - name:_ `bib--custom1-name-show`
* _Show custom property 1 - value:_ `bib--custom1-value-show`
* _Show custom property 2 - name:_ `bib--custom2-name-show`
* _Show custom property 2 - value:_ `bib--custom2-value-show`
* _Show custom property 3 - name:_ `bib--custom3-name-show`
* _Show custom property 3 - value:_ `bib--custom3-value-show`
* _Show custom property 4 - name:_ `bib--custom4-name-show`
* _Show custom property 4 - value:_ `bib--custom4-value-show`
* _Show custom property 5 - name:_ `bib--custom5-name-show`
* _Show custom property 5 - value:_ `bib--custom5-value-show`

### Ratios

The majority of layouts use a tile arrangement, wherein each tile contains a recommendation. The ratio of all tiles in a module can be set with the following. If a tile has an image, this image will be cropped within the `bib__image` HTML element to the desired ratio. Choose one ratio only.

* _Standard (4:3):_ `bib--4by3` _(default)_
* _Widescreen (16:9):_ `bib--wide`
* _Square (1:1):_ `bib--square`
* _Tall (2:3):_ `bib--tall`

### Text alignment

The following classes align all tile text horizontally. Choose one horizontal alignment only.

* _Left:_ `bib--text-left` _(default)_
* _Center:_ `bib--text-center`
* _Right:_ `bib--text-right`
* _Justify:_ `bib--text-justify`

When using a tile arrangement where the image is displayed to the left or right side of the text, use the following classes to align all tile text vertically in relation to the image. Choose one vertical alignment only.

* _Top:_ `bib--text-top` _(default)_
* _Middle:_ `bib--text-middle`
* _Bottom:_ `bib--text-bottom`

### Tile arrangement

By default, all tiled layouts display the recommendation text overlaid upon a background image (or fallback gray background). Alternatively, the image can be separated from the text overlay, and displayed above or to the side of its corresponding information.

* _Image above:_ `bib--split`
* _Image to the left:_ `bib--split-left`
* _Image to the right:_ `bib--split-right`

