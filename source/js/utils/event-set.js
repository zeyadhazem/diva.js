'use strict';

module.exports = EventSet;

function EventSet(options)
{
    this._events = [];
    this.attached = (options && options.attached) || false;
}

EventSet.prototype.on = function (element, event, callback, useCapture)
{
    var record = getRecord(element, event, callback, useCapture);

    this._events.push(record);

    if (this.attached)
        attachEvent(record);

    return this;
};

EventSet.prototype.off = function (element, event, callback, useCapture)
{
    var record = getRecord(element, event, callback, useCapture);

    // FIXME: Would be nice for this not to be linear search
    var i = findIndex(this._events, function (entry)
    {
        return Object.keys(record).every(function (key)
        {
            return record[key] === entry[key];
        });
    });

    if (i !== -1)
    {
        this._events.splice(i, 1);

        if (this.attached)
            detachEvent(record);
    }

    return this;
};

EventSet.prototype.attach = function ()
{
    if (this.attached)
        return;

    this.attached = true;
    this._events.forEach(attachEvent);

    return this;
};

EventSet.prototype.detach = function ()
{
    if (!this.attached)
        return;

    this.attached = false;
    this._events.forEach(detachEvent);

    return this;
};

function getRecord(element, event, callback, useCapture)
{
    return {
        element: element,
        event: event,
        callback: callback,
        useCapture: useCapture || false
    };
}

function attachEvent(record)
{
    record.element.addEventListener(record.event, record.callback, record.useCapture);
}

function detachEvent(record)
{
    record.element.removeEventListener(record.event, record.callback, record.useCapture);
}

function findIndex(arr, predicate)
{
    var arrLen = arr.length;

    for (var i=0; i < arrLen; i++)
    {
        if (predicate(arr[i]))
            return i;
    }

    return -1;
}
