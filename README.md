# acute-select - No Longer Under Active Development#

## ##
Current work and family commitments mean I don't have time to address outstanding issues for this project. There are a number of forks that have been made, but I don't know their status. If anyone is interested in taking over the project, please let me know. John
## ##

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

## Quick Start Guide ##
This example shows how to get acute-select up and running with a list of string values. It assumes you are familiar with the basics of AngularJS.

- Create two files: AcuteTest.htm and AcuteTest.js
- Set ng-app="AcuteTest" on your html tag and on the body, set ng-controller="MainController"
- Now include angular.min.1.x.x.js, acute.select.js, acute.select.css, and, AcuteTest.js:-

		<script type="text/javascript" src="../lib/angular.1.2.26.js"></script>
		<script type="text/javascript" src="../acute.select/acute.select.js"></script>
		<link href="../acute.select/acute.select.css" rel="stylesheet" />
		<script type="text/javascript" src="AcuteTest.js"></script>
- in AcuteTest.js, define the module and add a dependency for 'acute.select':-

		angular.module("AcuteTest", ['acute.select'])

- in your HMTL add an **ac-select** element (or a div with class="ac-select") and set the **ac-model** and **ac-options** attributes:-

		<ac-select ac-model="data.selectedShape" ac-options="for shape in shapes"></ac-select>

    **Note:-** always close the select tag with &lt;/select> as a self-closing select, i.e. ending in "/>", is not valid.

- Now in your controller, define your model variable and an array of strings for the dropdown values. The .js should then look like this:-

		angular.module("AcuteTest", ['acute.select'])
		.controller("MainController", function("$scope") {
			// Create an object for our model data (it's always wise have a "." in your model)
		    $scope.data = {
				selectedShape: 'Circle'
			};
		    $scope.shapes = ['Square', 'Circle', 'Triangle', 'Pentagon', 'Hexagon'];
		});		

	Fire up the page and you should see the populated dropdown with the Circle item selected.

## Documentation ##
### Settings ###

**Default values:-**

    {
        "templatePath": "/acute.select/",
        "noItemsText": "No items found.",
        "placeholderText": "Please select...",
        "itemHeight": 24,
        "itemsInView": 10,
        "pageSize": null,
        "minWidth": "100px",
        "maxWidth": "",			  // Truncates text if it exceeds this maximum width, but shows the full text as a tooltip
        "showSearchBox": true,
        "comboMode": false,
        "comboSelectOnFocus": true,
        "loadOnCreate": true,
        "loadOnOpen": false,      // If true, while loadOnCreate is false, the load function will be called when the dropdown opens
        "allowCustomText": false,
        "minSearchLength": 0,
        "filterType": "contains", // or "start"
        "allowClear": true
    };

**Note:-** if both *loadOnCreate* and *loadOnOpen* are *false*, the list will only be populated when search text is entered.

Settings are specified using the *ac-settings* attribute.

### Data from the server ###
An example with data received asynchronously using $http: 

		$http.post("MyWebService.asmx/GetStates", {})
		.success(function(result) {
			$scope.colours = result.d;	// (".d" is specific to ASP.NET)
		});

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

	<ac-select ac-model="currentState" ac-options="state.name for state in states" ac-key="id"></ac-select>

### ac-focus-when attribute ###
If present, focus will be given to either the combo or search text box when the expression it is set to evaluates as *true*. e.g.

	<ac-select ac-model="currentState" ac-options="state.name for state in states"
	 ac-focus-when="flags.editMode"></ac-select>

Then in your controller:-

		$scope.flags = {
			editMode: false
		};
	
		...
		// Give ac-select the focus
		$scope.flags.editMode = true;

### Global settings ###

If required, settings can be updated for all instances on a page, by using the acuteSelectService in the application "run" function, as in this example:-

	angular.module("myModule", ["acute.select"])
	.run(function (acuteSelectService) {
	    // Set the template path for all instances
	    acuteSelectService.updateSetting("templatePath", "/js/templates");
	})

**John O'Connor**
