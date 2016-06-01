module.exports = CompositeImage;

/**
 * @class CompositeImage
 * @private
 *
 * Utility class to composite tiles into a complete image
 * and track the rendered state of an image as new tiles
 * load.
 *
 * This is a placeholder implementation: it just says to
 * render all available tiles, even if they aren't visible!
 */

/**
 * @param zoomLevel {number}
 * @param tilesByLevel {Array.<Tile>}
 * @constructor
 */
function CompositeImage(tilesByLevel)
{
    this._urls = {};

    var tiles = this._tiles = [];

    tilesByLevel.forEach(function (level)
    {
        tiles.push.apply(tiles, level);
    });
}

CompositeImage.prototype.getTiles = function ()
{
    return this._tiles.filter(function (tile)
    {
        return this._urls[tile.url];
    }, this);
};

/**
 * Update the composite image to take into account all the URLs
 * loaded in an image cache.
 *
 * @param cache {ImageCache}
 */
CompositeImage.prototype.updateFromCache = function (cache)
{
    this._tiles.forEach(function (tile)
    {
        if (cache.has(tile.url))
            this._urls[tile.url] = true;
    }, this);
};

/* TODO: ALGORITHM
 *
 * 1. Take a canvas covering the extent of the image
 * 2. For each zoom level, from best to worst:
 *     a. add every tile which is not completely
 *        covered to the list of tiles to render
 *     b. subtract that tile's bounding box from
 *        the uncovered area
 * 3. If there are uncovered regions, draw a white
 *    box or something? IDK.
 */
CompositeImage.prototype.updateWithLoadedUrls = function (urls)
{
    urls.forEach(function (url)
    {
        this._urls[url] = true;
    }, this);
};
