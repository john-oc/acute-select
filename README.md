# acute-select #

**acute-select** is a dropdown select component for [AngularJS](http://angularjs.org/), with no external dependencies other than Angular itself.

**[Live Demo](http://john-oc.github.io/)** 

## Features:- ##

- **Search box**
- **Load on demand**
- **Paging**
- **Combo Mode**
- **Keyboard navigation (requires AngularJS 1.2)**
- **Syntax like angular's select**
 
### Example:- ###

	<ac-select ac-model='selectedColour' ac-options='colour.name for colour in colours'
		ac-change='selectionChanged(value)' ac-settings='{ loadOnOpen: true }'></ac-select>

As you can see, this is very similar to the way the angular select directive works.
In the above example *colours* can be replaced with a function *colours()* to load the data either when the dropdown is created, when it is first opened, or when search text is typed.



### Settings ###

**Default values:-**

    {
        "templatePath": "/acute.select/",
        "noItemsText": "No items found.",
        "itemHeight": 24,
        "itemsInView": 10,
        "minWidth": "100px",
        "showSearchBox": true,
        "comboMode": false,
        "loadOnCreate": false,
        "loadOnOpen": false,      
        "initialText": null,
        "allowCustomText": false,
        "minSearchLength": 1,
        "filterType": "contains",    // or "start"
        "allowClear": true
    };

**Note:-** if both *loadOnCreate* and *loadOnOpen* are *false*, the list will only be populated when search text is entered.

Settings are specified using the *ac-settings* attribute.

### Load on demand example ###

In this example, when the user opens the dropdown, the ac-select directive calls the *getStates* function. It passes in a callback function for the app script to return the data. As with a standard angular select, the data can be an array of objects, or simply an array of strings.

HTML:-

	<ac-select ac-model='selectedColour' ac-options='state.name for state in getStates()'
		ac-change='selectionChanged(value)' ac-settings='{ loadOnOpen: true }'></ac-select>

JS:-

    $scope.allStates = [
        { "name": "Alabama", "id": "AL" },
        { "name": "Alaska", "id": "AK" },
        { "name": "Arizona", "id": "AZ" },
		etc...

    // Return all states when dropdown first opens
    $scope.getStates = function (callback) {
        callback($scope.allStates);
    };


As an alternative to the separate search box, acute-select can also act as a combined textbox and dropdown list.

See the **[demo page](http://john-oc.github.io/)** for an example.

### Global settings ###

If required, settings can be updated for all instances on a page, by using the acuteSelectService in the application "run" function, as in this example:-

	angular.module("myModule", ["acute.select"])
	.run(function (acuteSelectService) {
	    // Set the template path for all instances
	    acuteSelectService.updateSetting("templatePath", "/js/templates");
	})

**John O'Connor**