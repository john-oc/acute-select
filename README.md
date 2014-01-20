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
        "loadOnCreate": true,
        "loadOnOpen": false,      
        "initialText": null,
        "allowCustomText": false,
        "minSearchLength": 1,
        "filterType": "contains",    // or "start"
        "allowClear": true
    };

**Note:-** if both *loadOnCreate* and *loadOnOpen* are *false*, the list will only be populated when search text is entered.

Settings are specified using the *ac-settings* attribute.

### Load on demand ###

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

###Combo Mode###

As an alternative to the separate search box, acute-select can also act as a combined textbox and dropdown list. If the allowCustomText option is set, this will allow a user to enter text that is not in the list.

See the **[demo page](http://john-oc.github.io/)** for an example.

### ac-key attribute ###

The ac-key attribute allows you to specify a property name which will be used to match the ac-model object against the data array.

One shortcoming of the standard angular select directive is that when bound to an array of objects, the initial model value must be one of those objects in order for it to be initially selected. An object with the same properties and values is not sufficient. This can be awkward when the current value is delivered to the client separately from the array of values for the list.

E.g. consider the following example, using the same list of US states shown above:-

	$scope.currentState = { "name": "Alaska", "id": "AL" };

Then suppose we define a standard select as follows:-

	<select ng-model="currentState" ng-options="state.name for state in states"></select>

You would expect "Alaska" to be initially selected, but this won't happen, because currentState isn't the
same copy of the Alaska object as the one in the array. There is a workaround, which is to convert the array of states to a single object, with the ids as keys, then use the select directive's (key, value) syntax, but it's not very intuitive.

With the acute select directive you can avoid this problem altogether by simply setting ac-key to 'id':-

	<ac-select ac-model="currentState" ac-options="state.name for state in states" ac-key="id"></select>

### Global settings ###

If required, settings can be updated for all instances on a page, by using the acuteSelectService in the application "run" function, as in this example:-

	angular.module("myModule", ["acute.select"])
	.run(function (acuteSelectService) {
	    // Set the template path for all instances
	    acuteSelectService.updateSetting("templatePath", "/js/templates");
	})

**John O'Connor**