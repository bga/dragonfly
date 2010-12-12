﻿window.templates || (window.templates = {});

templates.repl_main = function()
{
  return [
    "div", [[
      ["div", [
         "ol", "class", "repl-lines js-source"
         ], "class", "repl-output"],
      ["div", [[
        ["span", ">>>\xA0", "class", "repl-prefix"],
        ["div", ["textarea",
                 "focus-handler", "repl-textarea",
                 "blur-handler", "blur-textarea",
                 "rows", "1"]]
      ]], "class", "repl-input"]
    ]], "class", "padding"
  ];
};

templates.repl_output_native = function(s)
{
  return ["span", s, "class", "repl-native"];
};

templates.repl_output_native_or_pobj = function(thing)
{
  if (thing.type == "native") {
    return templates.repl_output_native(thing.value);
  }
  else
  {
    return templates.repl_output_pobj(thing);
  };
};

templates.repl_output_pobj = function(data)
{
  var is_element_type = settings.command_line.get("is-element-type-sensitive") && 
                        /(?:Element)$/.test(data.name)
  return [
    'code',
    data.friendly_printed ? this.friendly_print(data.friendly_printed) : data.name,
    'handler', is_element_type ? 'inspect-node-link' : 'inspect-object-link',
    'rt-id', data.rt_id.toString(),
    'obj-id', data.obj_id.toString(),
    'class', 'repl-pobj'
  ];
};

templates.friendly_print = function(value_list)
{
  const 
  TYPE = 0, 
  ELEMENT = 1, 
  ELEMENT_NAME = 1, 
  ELEMENT_ID = 2, 
  ELEMENT_CLASS = 3,
  ELEMENT_HREF = 4,
  ELEMENT_SRC = 5;
  
  var ret = [];
  
  switch (value_list[TYPE])
  {
    case ELEMENT:
    {
      ret.push(['span', value_list[ELEMENT_NAME], 'class', 'element-name']);
      if (value_list[ELEMENT_ID])
      {
        ret.push(['span', '#' + value_list[ELEMENT_ID], 'class', 'element-id']);
      }
      if (value_list[ELEMENT_CLASS])
      {
        ret.push(['span', '.' + value_list[ELEMENT_CLASS].replace(/\s+/g, '.'), 
                  'class', 'element-class']);
      }
      if (value_list[ELEMENT_HREF])
      {
        ret.push(['span', ' ' + value_list[ELEMENT_HREF], 'class', 'element-href']);
      }
      if (value_list[ELEMENT_SRC])
      {
        ret.push(['span', ' ' + value_list[ELEMENT_SRC], 'class', 'element-src']);
      }
      return ret;
    }
      
  }

}

templates.repl_output_traceentry = function(frame, index)
{
    var tpl = ['li',
      ui_strings.S_TEXT_CALL_STACK_FRAME_LINE.
        replace("%(FUNCTION_NAME)s", ( frame.objectValue ? frame.objectValue.functionName : ui_strings.ANONYMOUS_FUNCTION_NAME ) ).
        replace("%(LINE_NUMBER)s", ( frame.lineNumber || '-' ) ).
        replace("%(SCRIPT_ID)s", ( frame.scriptID || '-' ) ),
      'ref-id', index.toString(),
      'script-id', String(frame.scriptID), //.toString(),
      'line-number', String(frame.lineNumber),
      'scope-variable-object-id', String(frame.variableObject),
      'this-object-id', String(frame.thisObject),
      'arguments-object-id', String(frame.argumentObject)
    ];
  return tpl;
};

templates.repl_output_trace = function(trace)
{
  var lis = trace.frameList.map(templates.repl_output_traceentry);
  var tpl = ["div", ["ol", lis, "class", "console-trace",
                     'handler', 'select-trace-frame',
                     'runtime-id', trace.runtimeID.toString()
                    ],
                    "class", "console-trace-container"];
  return tpl;
};

templates.repl_group_line = function(group)
{
  return [["button", "class", "folder-key"+(group.collapsed ? "" : " open" ),
                     "handler", "repl-toggle-group", "group-id", group.id
          ], group.name];
};
