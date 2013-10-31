acute-select
============

Dropdown select for AngularJS, with no external dependencies.

Features:-
Search box, to filter results
Syntax in line with angular's ngOptions:-

e.g. <ac-select ac-model='selectedColour' ac-options='colour.name for colour in colours'></ac-select>

Load on demand:-

'colours' in the above example can be replaced with 'colours()' which is a function to load the required data.

Combo Mode:-

