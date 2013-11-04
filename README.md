acute-select
============

Dropdown select for AngularJS, with no external dependencies.

Features:-<br/>
<ul>
<li>Search box - to filter items</li>
<li>Syntax in line with angular's ngOptions:-<br/>

e.g. &lt;ac-select ac-model='selectedColour' ac-options='colour.name for colour in colours'&gt;&lt;/ac-select&gt;

<li>Load on demand:-<br/>

'colours' in the above example can be replaced with 'colours()' which is a function to load the required data.
</li>
<li>Paging</li>

<li>Keyboard navigation (requires AngularJS 1.2.0)</li>

<li>Combo Mode</li> - i.e. textbox combined with dropdown list.
</ul>

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

