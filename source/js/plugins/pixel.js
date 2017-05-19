/**
 * This plugin will be used to transform Diva into a layering tool which will be used to provide
 * the ground truth data for the machine learning algorithm
 * that classifies and isolates the different components of old manuscripts and scores.
 *
 * {string} pluginName - Added to the class prototype. Defines the name for the plugin.
 *
 * @method drawHighlights - Used to highlight pages after the tiles are visible
 *
 *
 **/
export default class PixelPlugin
{
    constructor (core)
    {
        this.core = core;
        this.activated = false;
        this.pageToolsIcon = this.createIcon();
        this.activated = false;
        this.handle = null;
    }

    // Is called every time visible tiles are loaded to draw highlights on top of them
    drawHighlights(highlights)
    {
        let core = this.core;

        // This function is only called once (drawHighlights) so it will store the info that were passed the first time drawHighlights was called (Need a fix)
        var handle = Diva.Events.subscribe('VisibleTilesDidLoad', function (pageIndex, zoomLevel)
        {
            highlights.forEach((highlighted) =>
                {
                    let opacity = 0.5;
                    let renderer = core.getSettings().renderer;
                    let scaleRatio = Math.pow(2,zoomLevel);
                    const viewportPaddingX = Math.max(0, (renderer._viewport.width - renderer.layout.dimensions.width) / 2);
                    const viewportPaddingY = Math.max(0, (renderer._viewport.height - renderer.layout.dimensions.height) / 2);

                    // The following absolute values are experimental values to highlight the square on the first page of Salzinnes, CDN-Hsmu M2149.L4
                    // The relative values are used to scale the highlights according to the zoom level on the page itself
                    var absoluteRectOriginX = highlighted.relativeRectOriginX * scaleRatio;
                    var absoluteRectOriginY = highlighted.relativeRectOriginY * scaleRatio;
                    var absoluteRectWidth = highlighted.relativeRectWidth * scaleRatio;
                    var absoluteRectHeight = highlighted.relativeRectHeight * scaleRatio;

                    // This indicates the page on top of which the highlights are supposed to be drawn
                    var highlightPageIndex = highlighted.pageIndex;

                    if (pageIndex === highlightPageIndex)
                    {
                        // Calculates where the highlights should be drawn as a function of the whole webpage coordinates
                        // (to make it look like it is on top of a page in Diva)
                        var highlightXOffset = renderer._getImageOffset(pageIndex).left - renderer._viewport.left + viewportPaddingX + absoluteRectOriginX;
                        var highlightYOffset = renderer._getImageOffset(pageIndex).top - renderer._viewport.top + viewportPaddingY + absoluteRectOriginY;

                        //Draw the rectangle
                        var rgba = null;
                        switch (highlighted.layerType){
                            case 0:
                                rgba = "rgba(51, 102, 255, " + opacity + ")";
                                break;
                            case 1:
                                rgba = "rgba(255, 51, 102, " + opacity + ")";
                                break;
                            case 2:
                                rgba = "rgba(255, 255, 10, " + opacity + ")";
                                break;
                            case 3:
                                rgba = "rgba(10, 255, 10, " + opacity + ")";
                                break;
                            case 4:
                                rgba = "rgba(120, 0, 120, " + opacity + ")";
                                break;
                            default:
                                rgba = "rgba(255, 0, 0, " + opacity + ")";
                        }

                        renderer._ctx.fillStyle = rgba;
                        renderer._ctx.fillRect(highlightXOffset, highlightYOffset,absoluteRectWidth,absoluteRectHeight);
                    }
                }
            )
        });
        return handle;
    }
    /**
     * Enables the layering plugin and stops it from being repetitively called.
     *
     **/
    handleClick (event, settings, publicInstance, pageIndex)
    {
        if (!this.activated)
        {
            var highlight1 = new HighlightArea(10, 10, 10, 10, 0, 0);
            var highlight2 = new HighlightArea(40, 40, 20, 20, 0, 1);
            var highlight3 = new HighlightArea(80, 80, 30, 10, 0, 2);
            var highlight4 = new HighlightArea(10, 80, 40, 20, 0, 3);
            var highlight5 = new HighlightArea(50, 120, 50, 10, 0, 4);
            var highlight6 = new HighlightArea(30, 180, 60, 20, 0, 5);
            var highlighted = [highlight1, highlight2, highlight3, highlight4, highlight5, highlight6];
            this.handle = this.drawHighlights(highlighted);
            this.core.getSettings().renderer._paint();
            this.activated = true;
        }
        else
        {
            Diva.Events.unsubscribe(this.handle);
            this.core.getSettings().renderer._paint();
            this.activated = false;
        }
    }

    createIcon ()
    {
        const pageToolsIcon = document.createElement('div');
        pageToolsIcon.classList.add('diva-pixel-icon');

        let root = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        root.setAttribute("x", "0px");
        root.setAttribute("y", "0px");
        root.setAttribute("viewBox", "0 0 25 25");
        root.id = `${this.core.settings.selector}pixel-icon`;

        let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.id = `${this.core.settings.selector}pixel-icon-glyph`;
        g.setAttribute("transform", "matrix(1, 0, 0, 1, -11.5, -11.5)");
        g.setAttribute("class", "diva-pagetool-icon");

        //Placeholder icon
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('x', '15');
        rect.setAttribute('y', '10');
        rect.setAttribute('width', '25');
        rect.setAttribute('height', 25);

        g.appendChild(rect);
        root.appendChild(g);

        pageToolsIcon.appendChild(root);

        return pageToolsIcon;
    }
}

export class HighlightArea
{
    constructor (relativeRectOriginX, relativeRectOriginY, relativeRectWidth, relativeRectHeight, pageIndex, layerType)
    {
        this.relativeRectOriginX = relativeRectOriginX;
        this.relativeRectOriginY = relativeRectOriginY;
        this.relativeRectWidth = relativeRectWidth;
        this.relativeRectHeight = relativeRectHeight;
        this.pageIndex = pageIndex;
        this.layerType = layerType;
    }
}

PixelPlugin.prototype.pluginName = "pixel";
PixelPlugin.prototype.isPageTool = true;

/**
 * Make this plugin available in the global context
 * as part of the 'Diva' namespace.
 **/
(function (global)
{
    global.Diva.PixelPlugin = PixelPlugin;
})(window);
