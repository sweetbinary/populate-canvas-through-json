# populate-canvas-through-json
Populate canvas with images and text through a json file


The json file has two main nodes, 'fonts' and 'assets'. Fonts contains the paths and names of the fonts and assets contains the text and images.


The asset nodes are loaded sequentially so the last asset will be the one on the top of the canvas. The subnodes for the assets are as follows (the ones with asterisk are mandatory)


type*: Whether it's text or img

url*:  the image's location (img only)

x*: Asset's left value

y*: Asset's top value

composition: the canvas globalCompositeOperation value (img only)

alpha: the canvas globalAlpha value (img only)

color*: the text's color (text only)

font*: The font name (related to the value in the font name node) (text only)

font_size*: The size of the font (text only)

baseline: the canvas textBaseline value (text only)

firefox_y_offset: Additional top value for Firefox browsers (text only)

chrome_y_offset: Additional top value for Chrome browsers (text only)

edge_y_offset:  Additional top value for Edge browsers (text only)

