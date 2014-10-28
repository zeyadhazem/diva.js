/*
Bookmark locations in the document.
*/

(function ($)
{
    "use strict";
    window.divaPlugins.push((function()
    {
        var settings = {};
        var retval =
        {
            init: function(divaSettings, divaInstance)
            {
                // Bookmark the current location if event called
                diva.Events.subscribe("BookmarkCurrentLocation",
                    function()
                    {
                        divaInstance.bookmarkCurrentLocation();
                    });

                // Create the pop-up window.
                $(divaSettings.parentSelector).append('<div class="diva-bookmarks-window"></div>');
                var bookmarksDiv = $(".diva-bookmarks-window");

                // Check if the browser can do local storage
                if (typeof(Storage) !== "undefined") {
                    if (localStorage.getItem("diva-bookmarks") === null)
                    {
                        // Set the empty bookmark list
                        localStorage.setItem("diva-bookmarks", JSON.stringify([]));
                    }
                    // Grab the list
                    var bookmarkObject = JSON.parse(localStorage.getItem("diva-bookmarks"));
                    // Print out the list of bookmarks
                    _render_bookmarks_list();
                } else {
                    // User's browser doesn't support local storage
                    console.log("Browser does not support local storage.");
                    return true;
                }

                // Initialize the window
                _render_bookmark_window();

                function _add_bookmark(name, pageIndex, xOffset, yOffset, zoom)
                {
                    // The bookmark object that we will save
                    var bookmark = {
                        page: pageIndex,
                        name: name,
                        xOffset: xOffset,
                        yOffset: yOffset,
                        zoom: zoom
                    };

                    bookmarkObject.unshift(bookmark);
                    diva.Events.publish("BookmarksUpdated", bookmarkObject);
                    return bookmark;
                }

                /**
                 * Persist the bookmarks to the user's browser.
                 *
                 * @private
                 */
                function _save_bookmarks()
                {
                    localStorage.setItem("diva-bookmarks",
                        JSON.stringify(bookmarkObject));
                    _render_bookmarks_list();
                }

                /**
                 * Render the entire bookmarks window.
                 *
                 * @private
                 */
                function _render_bookmark_window()
                {
                    // So that we don't have memory leaks
                    bookmarksDiv.empty();

                    var content = '<div class="diva-bookmarks-window-form"><div class="diva-bookmarks-window-toolbar">' +
                        '<div class="diva-bookmarks-window-close" ' +
                        'title="Close the bookmarks window"></div></div>';

                    content += '<h3>Create Bookmark</h3> <form class="create-bookmark">' +
                        '<input type="text" class="bookmark-name" placeholder="Name">' +
                        '<input type="submit" value="Create"></form></div>';

                    content += '<div class="diva-bookmarks-window-list"></div>';
                    // Fill it with the content
                    bookmarksDiv.html(content);

                    bookmarksDiv.find(".create-bookmark").each(
                        function()
                        {
                            $(this).submit(
                                function(event)
                                {
                                    event.preventDefault();
                                    var name = bookmarksDiv.find(".bookmark-name").val();
                                    divaInstance.bookmarkCurrentLocation(name);
                                    alert('Bookmark "' + name + '" created at current location');
                                }
                            );
                        }
                    );
                    bookmarksDiv.find(".diva-bookmarks-window-close").click(
                        function()
                        {
                            bookmarksDiv.hide();
                        }
                    );

                    // Render the list of bookmarks
                    _render_bookmarks_list();
                }

                /**
                 * Render the bookmarks list.
                 *
                 * @private
                 */
                function _render_bookmarks_list()
                {
                    var listDiv = $(bookmarksDiv.selector + " .diva-bookmarks-window-list");
                    // So that we don't have memory leaks
                    listDiv.empty();

                    var content = '<h3>Bookmarks</h3><table>';

                    for (var i = 0; i < bookmarkObject.length; i++
                        )
                    {
                        content += '<tr><td><a href="' + bookmarkObject[i].page
                            + '" class="visit-bookmark">'
                            + bookmarkObject[i].name
                            + '</a></td>' +
                            '<td><a href="#delete" class="delete-bookmark">' +
                            'Delete</a></td></tr>';
                    }
                    content += "</table>";
                    // Fill it with the content
                    listDiv.html(content);
                    // Now, we need to bind the event handlers.
                    listDiv.find(".visit-bookmark").each(
                        function(index)
                        {
                            // Trigger the page redirection
                            $(this).click(
                                function(event)
                                {
                                    // We don't want the link to trigger
                                    event.preventDefault();
                                    divaInstance.goToBookmark(index);
                                });
                        }
                    );
                    listDiv.find(".delete-bookmark").each(
                        function(index)
                        {
                            // Trigger the page redirection
                            $(this).click(
                                function(event)
                                {
                                    // We don't want the link to trigger
                                    event.preventDefault();
                                    divaInstance.removeBookmark(index);
                                });
                        }
                    );
                }

                /**
                 * Save Diva's current location as a bookmark.
                 */
                divaInstance.bookmarkCurrentLocation = function(name)
                {
                    if (name === undefined || name === "")
                    {
                        name = "Bookmark " + bookmarkObject.length;
                    }

                    var divaOuter = $(divaSettings.parentSelector.selector + " .diva-outer");
                    // Grab the zoom level from Diva
                    var zoomLevel = divaInstance.getZoomLevel();
                    var divaWidth = divaOuter.width();
                    var divaHeight = divaOuter.height();

                    // Calculate the offset values so that we can save the
                    // exact location.
                    // Get the height above top for that box
                    var currentScrollTop = parseInt($(divaOuter).scrollTop(), 10);
                    var currentScrollLeft = parseInt($(divaOuter).scrollLeft(), 10);

                    var xOffset = currentScrollLeft + (divaWidth / 2);
                    var yOffset = currentScrollTop + (divaHeight / 2);

                    _add_bookmark(
                        name,
                        divaInstance.getCurrentPageNumber(),
                        xOffset,
                        yOffset,
                        zoomLevel
                    );
                    _save_bookmarks();
                };

                /**
                 * Remove a bookmark from the list of bookmarks.
                 *
                 * @param index 0-indexed integer
                 */
                divaInstance.removeBookmark = function(index)
                {
                    bookmarkObject.splice(index, 1);
                    _save_bookmarks();
                };

                /**
                 *
                 *
                 * @returns array The bookmark array
                 */
                divaInstance.getBookmarks = function()
                {
                    return bookmarkObject;
                };

                /**
                 * Diva goes to the location of the specified bookmark.
                 *
                 * @param index 0-indexed integer
                 */
                divaInstance.goToBookmark = function(index)
                {
                    var bookmark = bookmarkObject[parseInt(index)];
                    var divaOuter = $(divaSettings.parentSelector.selector + " .diva-outer");

                    var divaWidth = divaOuter.width();
                    var divaHeight = divaOuter.height();

                    divaInstance.setZoomLevel(bookmark.zoom);
                    divaInstance.gotoPageByNumber(bookmark.page);
                    divaOuter.scrollTop(bookmark.yOffset - (divaHeight / 2));
                    divaOuter.scrollLeft(bookmark.xOffset - (divaWidth / 2));
                };

                return true;
            },
            handleClick: function()
            {
                $(".diva-bookmarks-window").show();
                return false;
            },
            pluginName: 'bookmark',
            titleText: 'Bookmark document locations'
        };
        return retval;
    })());
})(jQuery);
