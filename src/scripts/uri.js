﻿"use strict";

var URI = function(uri)
{
  this._init(uri);
};

var URIPrototype = function(uri_prop_name)
{
  /*
    interface
    
    hash
    host
    pathname
    protocol
    search
    filename
    dir_pathname // pathname minus filename
    abs_dir // protocol plus hostname plus dir_pathname
  */

  [
    "hash",
    "host",
    "pathname",
    "protocol",
    "search"
  ].forEach(function(prop)
  {
    this.__defineGetter__(prop, function()
    {
      if (!this._is_parsed)
        this._init();

      return this["_" + prop];  
    });
    this.__defineSetter__(prop, function() {});
    
  }, this);

  this.__defineGetter__("filename", function()
  {
        
    if (!this._filename && (this._is_parsed || this[uri_prop_name]))
    {
      var pos = this.pathname.lastIndexOf("/");
      if (pos > -1)
        this._filename = this.pathname.slice(pos + 1);
      else
        this._filename = this.pathname;
    }

    return this._filename;  
  });

  this.__defineSetter__("filename", function() {});

  this.__defineGetter__("dir_pathname", function()
  {
    if (!this._dir_pathname && (this._is_parsed || this[uri_prop_name]))
    {
      var pos = this.pathname.lastIndexOf("/");
      if (pos > -1)
        this._dir_pathname = this.pathname.slice(0, pos + 1);
      else
        this._dir_pathname = "";
    }

    return this._dir_pathname;  
  });

  this.__defineSetter__("dir_pathname", function() {});

  this.__defineGetter__("abs_dir", function()
  {
    if (!this._abs_dir && (this._is_parsed || this[uri_prop_name]))
      this._abs_dir = (this.protocol ? this.protocol + "//" : "") +
                      this.host + this.dir_pathname;

    return this._abs_dir;  
  });

  this.__defineSetter__("abs_dir", function() {});

  this.__defineGetter__("origin", function()
  {
    if (!this._origin && (this._is_parsed || this[uri_prop_name]))
      this._origin = this.protocol + "//" + this.host;

    return this._origin;  
  });
  
  this.__defineSetter__("origin", function() {});

  this.__defineGetter__("params", function()
  {
    if (!this._params && (this._is_parsed || this[uri_prop_name]))
    {
      this._params = [];
      if (this._search[0] === "?")
      {
        var pairs = this._search.slice(1).split("&");
        pairs.forEach(function(pair) {
          var first_eq = pair.indexOf("=");
          if (first_eq === -1) { first_eq = pair.length; }
          var key = pair.slice(0, first_eq);
          if (key)
          {
            var value = pair.slice(first_eq + 1);
            this._params.push({"key": decodeURIComponent(key),
                               "value": decodeURIComponent(value)});
          }
        }, this);
      }
    }
    return this._params;  
  });

  this.__defineSetter__("last_part", function() {});

  this.__defineGetter__("last_part", function()
  {
    if (!this._last_part && (this._is_parsed || this[uri_prop_name]))
    {
      var parts = this._uri.split("/");
      // last_part is either after the last /, or if that is "", between the last 2 slashes.
      var accessor = parts.length - 1;
      this._last_part = parts[accessor] || parts[accessor - 1];
    }
    return this._last_part;
  });

  this._init = function(uri)
  {
    if (!uri && this[uri_prop_name])
      uri = this[uri_prop_name];

    if (uri)
    {
      this._uri = uri;
      var val = uri;

      var pos = val.indexOf("#");
      if (pos > -1)
      {
        this._hash = val.slice(pos);
        val = val.slice(0, pos);
      }
      else
        this._hash = "";

      pos = val.indexOf("?");
      if (pos > -1)
      {
        this._search = val.slice(pos);
        val = val.slice(0, pos);
      }
      else
        this._search = "";

      pos = val.indexOf(":");
      if (pos > -1)
      {
        this._protocol = val.slice(0, pos + 1);
        val = val.slice(pos + 1);
        while (val.indexOf("/") === 0)
          val = val.slice(1);
      }
      else
        this._protocol = "";

      pos = val.indexOf("/");
      if (pos > -1)
      {
        this._host = val.slice(0, pos);
        val = val.slice(pos);
      }
      else if (this._protocol)
      {
        this._host = val
      }
      else
        this._host = "";

      if (val)
        this._pathname = val;
      else
        this._pathname = "";
    }

    this._is_parsed = true;
  };

};

URI.prototype = new URIPrototype();
