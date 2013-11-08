acute-select
============

Dropdown select for AngularJS, with no external dependencies.

Features:-<br/>
Search box, to filter results<br/>
Syntax in line with angular's ngOptions:-

e.g. &lt;ac-select ac-model='selectedColour' ac-options='colour.name for colour in colours'&gt;&lt;/ac-select&gt;

Load on demand:-

'colours' in the above example can be replaced with 'colours()' which is a function to load the required data.

Paging

Keyboard navigation

Combo Mode - i.e. textbox combined with dropdown list.

settings
========

Default values:

{<br/>
  "showSearchBox": true,
  "comboMode": false,       // If true, the search textbox is shown in-line, instead in the dropdown
  "loadOnCreate": false,    
  "loadOnOpen": false,      // If true, load function will be called when dropdown opens, i.e. before any search text is entered
  "allowCustomText": false, // If true,
  "minSearchLength": 1,
  "filterType": "start",    // or "contains"
  "allowClear": true
<br/>}

Settings are specified using the ac-settings attribute

