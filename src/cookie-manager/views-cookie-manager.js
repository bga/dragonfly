﻿window.cls || (window.cls = {});

cls.CookieManagerView = function(id, name, container_class)
{
  this._cookies = {};
  this._rts = {};
  this.createView = function(container)
  {
    var cookieData = [];
    for (var domain in this._cookies)
    {
      var domains_cookies = this._cookies[domain];
      if (domains_cookies.cookie_list)
      {
        for (var i=0; i < domains_cookies.cookie_list.length ;i++)
        {
          var current_cookie = domains_cookies.cookie_list[i];
          
          // Instead of creating a new cookie ob that just uses most of the old one,
          // info should probably just be added to it. When editing it, there should be only one list
          // that's globally accessible from actions.
          
          cookieData.push({
            runtimes:      domains_cookies.runtimes,
            host:          domains_cookies.host,
            hostname:      domains_cookies.hostname,
            domain:        current_cookie.domain,
            path:          current_cookie.path,
            name:          current_cookie.name,
            value:         current_cookie.value,
            expires:       current_cookie.expires,
            isSecure:      current_cookie.isSecure,
            isHTTPOnly:    current_cookie.isHTTPOnly,
            objectref:     current_cookie.objectref
          });
        };
        // Add button that removes cookies of this domain
        // render_array.push(["button","RemoveCookiesOfDomain", "href", "#", "handler", "cookiemanager-delete-domain-cookies"]);
      }
    }
    
    var tabledef = {
      groups: {
        runtimes: {
          label: "Runtime",
          grouper: function(obj) {
            var str="";
            for (var i=0; i < obj.runtimes.length; i++) {
              // runtimes could be displayed smarter..
              // 'title (url)' OR 'title (url1, url2)' OR 'title (url)(2)' OR 'title (url), title (url)'
              var rt = window.views.cookie_manager._rts[""+obj.runtimes[i]];
              var title = rt.title;
              var href = rt.href;
              var hostname = rt.hostname;
              if(title)
              {
                str += title+" ("+href+"), ";
              }
              else
              {
                href+", ";
              }
            };
            return str;
          },
        },
        domain: {
          label: "Domains",
          grouper: function(obj) {
            return obj.domain;
          },
        },
        hostname: {
          label: "Hostname",
          renderer: function(obj) {
            return 
              ["p",window.views.cookie_manager._rts[""+obj.runtimes[0]].hostname,
                [
                  "button",            "Remove",
                  "class",             "delete_cookie",
                  "data-cookie-domain", obj.domain,
                  "handler",           "cookiemanager-delete-cookies"
                ]
              ];
          },
          grouper: function(obj) {
            return window.views.cookie_manager._rts[""+obj.runtimes[0]].hostname;
          }
        }
      },
      columns: {
        domain: {
          label: "Domain"
        },
        path: {
          label: "Path",
          getter: function(obj) { return "/"+obj.path; }
        },
        name: {
          label: "Name",
          getter: function(obj) {
            if(!obj.isHTTPOnly)
            {
              return ["span", obj.name+" ",
                  [
                    "a",    "Edit",
                    "href", "#",
                    "foo", "bar",
                    "data-objectref", obj.objectref,
                    /* "data-cookie-domain", "obj.domain",
                    "data-cookie-name", "obj.name", */
                    "handler", "cookiemanager-edit-name"
                  ]
              ];
            }
            else
            {
              return obj.name;
            }
          }
        },
        value: {
          label: "Value"
        },
        expires: {
          label: "Expires",
          getter: function(obj) {
            var parsedDate=new Date(obj.expires*1000);
            if(new Date().getTime() < parsedDate.getTime())
            {
              return parsedDate.toUTCString();
            }
            return "(when session is closed)";
          },
          sorter: function(obj1, obj2) {
            return obj1.expires < obj2.expires;
          }
        },
        isSecure: {
          label: "Secure",
          getter: function(obj) { return ""+obj.isSecure; }
        },
        isHTTPOnly: {
          label: "HTTP only",
          getter: function(obj) { return ""+obj.isHTTPOnly; }
        },
        remove: {
          label: "",
          getter: function(obj) {
            return [
              "button",
              "Remove",
              "class",             "delete_cookie",
              "data-cookie-domain", obj.domain,
              "data-cookie-path",   obj.path,
              "data-cookie-name",   obj.name,
              "handler",           "cookiemanager-delete-cookie"]
          }
        }
      }
    }
    container.clearAndRender(new SortableTable(tabledef, cookieData).render());
    
    var table = document.getElementsByClassName("sortable-table")[0];
    var obj = ObjectRegistry.get_instance().get_object(table.getAttribute("data-object-id"));
    // group by runtime
    // obj.group("runtimes");
    // or domain
    // obj.group("domain");
    // or hostname
    obj.group("hostname");
    
    table.re_render(obj.render());
    
    // Add clear button
    container.render(["button", "RemoveAllCookies", "handler", "cookiemanager-delete-all"]);
    // Add update button
    container.render(["button", "Update", "handler", "cookiemanager-update"]);
  };
  
  this._on_active_tab = function(msg)
  {
    // cleanup view
    this.clearAllContainers();
    // console.log(msg.activeTab);
    
    // cleanup runtimes directory
    for(var item in this._rts)
    {
      // item is a string, rt_id is a number which can now be compared with what's in msg.activeTab
      var rt_id = this._rts[item].rt_id;
      if(msg.activeTab.indexOf(rt_id) === -1)
      {
        // runtime was not active and is to be removed from this._rts
        delete this._rts[rt_id];
        
        // loop over existing cookies to remove the rt_id from the runtimes of each
        for(var domain in this._cookies)
        {
          if(this._cookies[domain].runtimes && (this._cookies[domain].runtimes.indexOf(rt_id) !== -1))
          {
            var index = this._cookies[domain].runtimes.indexOf(rt_id);
            this._cookies[domain].runtimes.splice(index,1);
          }
        }
      }
    }
    
    for (var i=0; i < msg.activeTab.length; i++)
    {
      var rt_id = msg.activeTab[i];
      if(!this._rts[rt_id])
      {
        this._rts[rt_id]={rt_id: rt_id, get_domain_is_pending: true};
      }
      this._request_runtime_details(this._rts[rt_id]);
    };
  };
  
  this._request_runtime_details = function(rt_object) {
    var script = "return JSON.stringify({host: location.host || '', hostname: location.hostname || '', title: document.title || '', href: location.href || ''})";
    var tag = tagManager.set_callback(this, this._handle_get_domain,[rt_object.rt_id]);
    services['ecmascript-debugger'].requestEval(tag,[rt_object.rt_id, 0, 0, script]);
  }
  
  this._update = function() {
    for (var rt_id in this._rts) {
      this._rts[rt_id].get_domain_is_pending = true;
      this._request_runtime_details(this._rts[rt_id]);
    };
  }
  
  this._handle_get_domain = function(status, message, rt_id)
  {
    var status = message[0];
    var type = message[1];
    
    var data = JSON.parse(message[2]);
    var host = data.host;
    var hostname = data.hostname;
    var title = data.title;
    var href = data.href;

    this._rts[rt_id].get_domain_is_pending = false;
    this._rts[rt_id].hostname = hostname;
    this._rts[rt_id].host = host;
    this._rts[rt_id].title = title;
    this._rts[rt_id].href = href;
    
    this._check_all_members_of_obj_to_be(this._rts, "get_domain_is_pending", false, this._clean_domains_and_ask_for_cookies);
  }
  
  this._clean_domains_and_ask_for_cookies = function(runtime_list)
  {
    // check this._cookies for domains that aren't in any runtime anymore, modifies "this._cookies" directly
    this._clean_domain_list(this._cookies, runtime_list);
    // go over runtimes and ask for cookies once per domain
    for (var str_rt_id in runtime_list)
    {
      var runtime = runtime_list[str_rt_id];
      var rt_domain = runtime.hostname;
      if(rt_domain) // avoids "" values occuring on opera:* pages for example
      {
        if(!this._cookies[rt_domain])
        {
          this._cookies[rt_domain] = {
            runtimes: [runtime.rt_id]
          }
        }
        else
        {
          if(this._cookies[rt_domain].runtimes.indexOf(runtime.rt_id) === -1)
          {
            this._cookies[rt_domain].runtimes.push(runtime.rt_id);
          }
        }
        
        // avoid repeating cookie requests for domains being in more than one runtime
        if(!this._cookies[rt_domain].get_cookies_is_pending)
        {
          this._cookies[rt_domain].get_cookies_is_pending = true;
          var tag = tagManager.set_callback(this, this._handle_cookies,[rt_domain]);
          services['cookie-manager'].requestGetCookie(tag,[rt_domain]);
        }
      }
    }
  }
  
  this._handle_cookies = function(status, message, domain)
  {
    this._cookies[domain].get_cookies_is_pending=false;
    if(message.length > 0)
    {
      var cookies = message[0];
      this._cookies[domain].cookie_list=[];
      for (var i=0; i < cookies.length; i++) {
        var cookie_info = cookies[i];
        this._cookies[domain].cookie_list.push({
          domain:     cookie_info[0],
          path:       cookie_info[1],
          name:       cookie_info[2],
          value:      cookie_info[3],
          expires:    cookie_info[4],
          isSecure:   cookie_info[5],
          isHTTPOnly: cookie_info[6],
          objectref:  cookie_info[0] + cookie_info[1] + cookie_info[2];
        });
      };
      window.views.cookie_manager.update();
    }
  };
  
  this._handle_removed_cookies = function(status, message, domain, path, name)
  {
    // console.log("_handle_removed_cookies",status,message,domain);
    
    // TODO: try to be smart and delete the ones that fit from table or just throw away and re-fetch all.
    // delete window.views.cookie_manager._cookies[domain];
    window.views.cookie_manager._update();
  };
  
  this._handle_changed_cookies = function(status, message)
  {
    console.log("_handle_changed_cookies");
    window.views.cookie_manager._update();
  };
  
  this._init = function(id, update_event_name, title)
  {
    this.title = title;
    window.messages.addListener('active-tab', this._on_active_tab.bind(this));    
    this.init(id, name, container_class);
  };
  
  // Helpers
  this._check_all_members_of_obj_to_be = function(list, member_name, val, callback)
  {
    // checks for all members of 'list' to have a member 'member_name'
    // with a value of 'val' and in that case calls 'callback' with 'list'
    var good_to_go = true;
    for (var iterator in list)
    {
      if(list[iterator][member_name] !== val)
      {
        good_to_go = false;
      }
    };
    if(good_to_go)
    {
      callback.call(this,list);
    }
  };
  
  this._clean_domain_list = function(cookies, runtime_list)
  {
    for (var checkdomain in cookies)
    {
      var was_found_in_runtime = false;
      for (var _tmp_rtid in runtime_list)
      {
        if(runtime_list[_tmp_rtid].domain === checkdomain)
        {
          was_found_in_runtime = true;
        }
      };
      if(!was_found_in_runtime)
      {
        delete cookies[checkdomain];
      }
    };
  }
  // End Helpers
  this._init(id, name, container_class);
};

cls.CookieManagerView.prototype = ViewBase;
