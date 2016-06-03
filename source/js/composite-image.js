module.exports = CompositeImage;

/**
 * @class CompositeImage
 * @private
 *
 * Utility class to composite tiles into a complete image
 * and track the rendered state of an image as new tiles
 * load.
 */

/**
 * @param levels {Array.<Tile>}
 * @constructor
 */
function CompositeImage(levels)
{
    this._levels = levels;  // Assume levels sorted high-res first
    var urlsToTiles = this._urlsToTiles = {};

    levels.forEach(function (level, levelIndex)
    {
        level.tiles.forEach(function (tile)
        {
            urlsToTiles[tile.url] = {
                levelIndex: levelIndex,
                row: tile.row,
                col: tile.col
            };
        });
    });

    this._resetLoadTracking();
}

CompositeImage.prototype._resetLoadTracking = function ()
{
    this._loadedByLevel = this._levels.map(function (level)
    {
        return new TileLoadMap(level.rows, level.cols);
    });
};

CompositeImage.prototype.getTiles = function ()
{
    var tiles = [];

    // TODO: Handle non-contiguous scale factors

    this._levels.forEach(function (level, levelIndex)
    {
        var priorLoaded = levelIndex > 0 ? this._loadedByLevel[levelIndex - 1] : null;
        var loaded = this._loadedByLevel[levelIndex];

        var additionalTiles = level.tiles.filter(function (tile)
        {
            return loaded.isLoaded(tile.row, tile.col);
        });

        // FIXME: Is it better to draw all of a partially covered tile,
        // with some of it ultimately covered, or to pick out the region
        // which needs to be drawn?
        if (priorLoaded)
        {
            // Detect covered tiles
            additionalTiles = additionalTiles.filter(function (tile)
            {
                var highResRow = tile.row * 2;
                var highResCol = tile.col * 2;

                return !(
                    priorLoaded.isLoaded(highResRow, highResCol) &&
                    priorLoaded.isLoaded(highResRow + 1, highResCol) &&
                    priorLoaded.isLoaded(highResRow, highResCol + 1) &&
                    priorLoaded.isLoaded(highResRow + 1, highResCol + 1)
                );
            });
        }

        tiles.push.apply(tiles, additionalTiles);
    }, this);

    return tiles;
};

/**
 * Update the composite image to take into account all the URLs
 * loaded in an image cache.
 *
 * @param cache {ImageCache}
 */
CompositeImage.prototype.updateFromCache = function (cache)
{
    this._resetLoadTracking();

    this._levels.forEach(function (level, levelIndex)
    {
        var loaded = this._loadedByLevel[levelIndex];

        level.tiles.forEach(function (tile)
        {
            if (cache.has(tile.url))
                loaded.set(tile.row, tile.col, true);
        });
    }, this);
};

CompositeImage.prototype.updateWithLoadedUrls = function (urls)
{
    urls.forEach(function (url)
    {
        var entry = this._urlsToTiles[url];
        this._loadedByLevel[entry.levelIndex].set(entry.row, entry.col, true);
    }, this);
};

function TileLoadMap(rows, cols)
{
    this._rows = rows;
    this._cols = cols;

    this._map = fill(rows).map(function ()
    {
        return fill(cols, false);
    });
}

TileLoadMap.prototype.isLoaded = function (row, col)
{
    // Return true for out of bounds tiles because they
    // don't need to load. (Unfortunately this will also
    // mask errors.)
    if (row >= this._rows || col >= this._cols)
        return true;

    return this._map[row][col];
};

TileLoadMap.prototype.set = function (row, col, value)
{
    this._map[row][col] = value;
};

function fill(count, value)
{
    var arr = new Array(count);

    for (var i=0; i < count; i++)
        arr[i] = value;

    return arr;
}
