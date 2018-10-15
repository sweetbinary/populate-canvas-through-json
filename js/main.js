//populate canvas through json - sweet binary

class CanvasTest {
    
    constructor() {                
        this.canvas = document.getElementById('canvas');
        this.ctx = canvas.getContext('2d');
        this.loading_bar = document.getElementById('canvas-loading');
        this.error_list = document.getElementById('canvas-errors');
        this.browser = this.get_browser();
    }

    //helper functions

    update_errors(str) {
        this.error_list.innerHTML += `${str} <br />`;
    }

    clog(str) {
        if (this.browser != 'ie') {
            console.log(str);
        }
    }

    clog_table(str) {
        if (this.browser != 'ie') {
            console.table(str);
        }
    }
    
    update_loading(str) {
        this.loading_bar.innerHTML = str;
        if (str === 'done!') {
            this.loading_bar.classList.add("hide");        
        }
    }

    get_browser(){        

        const t = this;        

        const user = navigator.userAgent.toLowerCase();        
        let browser = 'other';

        if ( user.includes('edge') ) {
            browser = 'edge';
        }
        else if ( user.includes('firefox') ) {
            browser = 'firefox';
        }
        else if ( user.includes('chrome') ) {
            browser = 'chrome';
        }
        else if ( user.includes('trident') ) {
            browser = 'ie';
        }  

        t.clog(`${browser} browser detected\n\n`);
        
        return browser;  
    }


    //============================================================================
    //============================================================================
    //============================================================================  


    //1. load json file, once loaded start processing fonts
    load_json(json_url) {

        const t = this;

        fetch(json_url)
        .then(response => response.json())
        .then(ze_data => {            
            t.clog(`json ${json_url} loaded! :)`);        
            //t.clog_table(ze_data);
            t.process_json_fonts(ze_data);
        }).catch(ze_error => {                    
            t.update_errors(`could not load json ${json_url} ${ze_error}`)
        });

    }


    //============================================================================
    //============================================================================
    //============================================================================  


    //2. process json fonts, once loaded start processing assets
    process_json_fonts(json_file){

        const t = this;

        let fonts_all = [];
        let fonts_no = 0;
        let fonts_no_total = 0;

        let fonts_preload_html = '';

        //get all font urls
        json_file.fonts.forEach( (font) => {
            //console.log(font.font_urls);   
            fonts_preload_html += `<span style="font-family: '${font.name}'">${font.name}</span>`
            Object.keys(font.font_urls).forEach( (key) => {
                fonts_all.push({all_fonts_url: font.font_urls[key]});                
                fonts_no_total++;
            });
        });

        //t.clog_table(fonts_all);
        
        //load fonts into DOM
        let css_fonts = document.createElement('style');
        css_fonts.type = "text/css";
        let css_fonts_preload = document.createElement('div');
        css_fonts_preload.classList.add("font-preload");
        css_fonts_preload.innerHTML = fonts_preload_html;        

        json_file.fonts.forEach( (font) => {
            
            const font_urls = font.font_urls;
            const font_name = font.name;
            const font_weight = font.weight;      

            css_fonts.innerHTML += `@font-face {
                font-family: '${font_name}';
                src: url('${font_urls.url_eot}');
                src: url('${font_urls.url_eot}?#iefix') format('embedded-opentype'),
                    url('${font_urls.url_woff2}') format('woff2'),
                    url('${font_urls.url_woff}') format('woff'),
                    url('${font_urls.url_ttf}') format('truetype'),
                    url('${font_urls.url_svg}#HomepageBaukasten-Book') format('svg');
                font-weight: ${font.weight};
                font-style: normal;
            }
            `;            
        });



        fonts_all.forEach( (font_all) => {
            const font_url = font_all.all_fonts_url;            
            fonts_no ++;   
            fetch(font_url)
            .then(ze_data => {            
                if( ze_data.status === 200 ){
                    t.clog(`font ${font_url} loaded :)`);
                    t.update_loading(`loading fonts ( ${fonts_no} of ${fonts_no_total} )`);                    
                }
                else{                
                    t.update_errors(`could not load font ${font_url} :( (${ze_data.status})`);
                }
            }).catch(ze_error => {                        
                t.update_errors(`could not load font ${font_url} :( ${ze_error}`);            
            });
        });

        //once all fonts are loaded, start loading the assets
        let promise = new Promise( (resolve, reject) => {     
            if (fonts_no == fonts_no_total) {
                resolve();
            }               
        });
        promise.then( () => {        
            document.body.appendChild(css_fonts);
            document.body.appendChild(css_fonts_preload);            
            setTimeout( () => {            
                this.process_json_assets(json_file);            
            }, 100);
        });
        
    }


    //============================================================================
    //============================================================================
    //============================================================================  

    
    //3. process json assets
    process_json_assets(json_file) {
        
        const t = this;

        let json_assets_processed = 0;  
        const json_assets_processed_total = json_file.assets.length;

        let json_assets_no = 0;
        const json_assets_no_total = json_file.assets.length - 1;  
        
        let json_assets = [];

        //to prevent load order issues, each asset is loaded seperately and placed on canvas once loaded
        const process_json_asset = (asset) => {   
    
            const asset_type = asset.asset_type;

            if (asset_type === 'img')
            {        
                const img_url = asset.img_url;
                const img_x = asset.img_x;
                const img_y = asset.img_y;
                const img_composition = asset.img_composition;
                const img_alpha = asset.img_alpha;       

                let img = new Image();
                img.onload = () => {
                    
                    if (img_alpha != undefined){
                        t.ctx.globalAlpha = img_alpha;
                    }
                    else {
                        t.ctx.globalAlpha = 1;
                    }
                    
                    if (img_composition != undefined){
                        t.ctx.globalCompositeOperation = img_composition;
                    }
                    else {                    
                        t.ctx.globalCompositeOperation = 'source-over';
                    }
                    t.ctx.drawImage(img, img_x, img_y);

                    t.clog(`img ${img_url} loaded :)`);
                    t.update_loading(`loading assets (${json_assets_no} of ${json_assets_no_total})` );
                    
                    next_json_asset();
                }
                img.onerror = () => {
                    t.update_errors(`could not load img ${img_url}`);
                    next_json_asset();
                };

                img.src = img_url;
            }
            else if (asset_type === 'text') {

                const text_font = asset.text_font;
                const text_font_size = asset.text_font_size;
                const text_copy = asset.text_copy;
                const text_color = asset.text_color;
                const text_x = asset.text_x;                                
                let text_y = asset.text_y;                
                const text_baseline = asset.text_baseline;
                const text_align = asset.text_align;                              
                t.ctx.fillStyle = text_color;
                t.ctx.font = `${text_font_size} ${text_font}`;                          

                if (text_baseline != undefined){
                    t.ctx.textBaseline = text_baseline; 
                    
                }
                else {
                    t.ctx.textBaseline = "top";
                }

                if (text_align != undefined){
                    t.ctx.textAlign = text_align; 
                    
                }
                else {
                    t.ctx.textAlign = 'left';
                }

                //get browser related offset if available
                if (asset[`text_${t.browser}_y_offset`] != undefined){                    
                    text_y = parseFloat(text_y) + parseFloat(asset[`text_${t.browser}_y_offset`]);                    
                }

                t.ctx.fillText(text_copy, text_x, text_y);
                
                next_json_asset();
            }
        }

        //load next asset if there are more assets
        const next_json_asset = () => {
            if (json_assets_no < json_assets_no_total) {
                json_assets_no ++;
                process_json_asset(json_assets[json_assets_no]);
            }
            else {
                t.update_loading('done!');
            }
        }

        //get all info on indivudual assets
        json_file.assets.forEach( (asset) => {
            
            let json_asset;        
            const asset_type = asset.type;

            if (asset_type === 'img')
            {
                json_asset = {
                    asset_type : asset.type,
                    img_url : asset.url, 
                    img_x : asset.x, 
                    img_y : asset.y, 
                    img_composition : asset.composition, 
                    img_alpha : asset.alpha 
                }
                
            }
            else if (asset_type === 'text') {
                json_asset = {
                    asset_type : asset.type,
                    text_font: asset.font,
                    text_font_size: asset.font_size,
                    text_copy: asset.copy,
                    text_color: asset.color,
                    text_x : asset.x, 
                    text_y : asset.y,
                    text_baseline : asset.baseline,
                    text_align : asset.align,
                    text_firefox_y_offset : asset.firefox_y_offset,
                    text_chrome_y_offset : asset.chrome_y_offset,
                    text_edge_y_offset : asset.edge_y_offset,
                    text_ie_y_offset : asset.ie_y_offset
                }
            }   

            json_assets.push(json_asset);
            json_assets_processed++;
            if (json_assets_processed === json_assets_processed_total){
                //process first asset
                process_json_asset(json_assets[0]);
            }

        });
    }//process_json_assets
}

const populate_canvas = new CanvasTest().load_json('json/test.json');