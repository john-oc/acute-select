/// <reference path="../lib/angular.1.2.6.js" />

"use strict";

angular.module("acuteSelectTest", ["acute.select"])

.run(function (acuteSelectService) {

    // Use the acute select service to set the template path for all instances
    acuteSelectService.updateSetting("templatePath", "/acute.select/template");

}).controller("MainCtrl", function ($scope, $http, $filter, $window, $timeout, safeApply) {

    $scope.textItems = ['Square', 'Circle', 'Triangle', 'Pentagon', 'Hexagon'];
    $scope.data = {
        selectedTextItem: 'Triangle'
    };

    $scope.flags = {
        refresh: false
    };

    $scope.colours = [
      { name: 'black', shade: 'dark' },
      { name: 'white', shade: 'light' },
      { name: 'red', shade: 'dark' },
      { name: 'blue', shade: 'dark' },
      { name: 'yellow', shade: 'light' }
    ];

    $scope.things = [];
    $scope.selectedThing = null;
    $scope.serverItems = [];

    $scope.message = "Ready.";

    $scope.selectedColour = $scope.colours[2]; // red.

    $scope.disconnectedColour = { name: 'blue', shade: 'dark' };
    
    $scope.getColours = function(callback) {
        callback($scope.colours);
    };

    $scope.colourChanged = function (value) {
        var colourName = value ? value.name : "none";
        $scope.message = "ac-change event fired for colour. New colour: " + colourName;
    }

    $scope.independentState = { "name": "Delaware", "id": "DE" };

    $scope.allStates = [
        { "name": "Alabama", "id": "AL" },
        { "name": "Alaska", "id": "AK" },
        { "name": "Arizona", "id": "AZ" },
        { "name": "Arkansas", "id": "AR" },
        { "name": "California", "id": "CA" },
        { "name": "Colorado", "id": "CO" },
        { "name": "Connecticut", "id": "CT" },
        { "name": "Delaware", "id": "DE" },
        { "name": "District of Columbia", "id": "DC" },
        { "name": "Florida", "id": "FL" },
        { "name": "Georgia", "id": "GA" },
        { "name": "Hawaii", "id": "HI" },
        { "name": "Idaho", "id": "ID" },
        { "name": "Illinois", "id": "IL" },
        { "name": "Indiana", "id": "IN" },
        { "name": "Iowa", "id": "IA" },
        { "name": "Kansas", "id": "KS" },
        { "name": "Kentucky", "id": "KY" },
        { "name": "Lousiana", "id": "LA" },
        { "name": "Maine", "id": "ME" },
        { "name": "Maryland", "id": "MD" },
        { "name": "Massachusetts", "id": "MA" },
        { "name": "Michigan", "id": "MI" },
        { "name": "Minnesota", "id": "MN" },
        { "name": "Mississippi", "id": "MS" },
        { "name": "Missouri", "id": "MO" },
        { "name": "Montana", "id": "MT" },
        { "name": "Nebraska", "id": "NE" },
        { "name": "Nevada", "id": "NV" },
        { "name": "New Hampshire", "id": "NH" },
        { "name": "New Jersey", "id": "NJ" },
        { "name": "New Mexico", "id": "NM" },
        { "name": "New York", "id": "NY" },
        { "name": "North Carolina", "id": "NC" },
        { "name": "North Dakota", "id": "ND" },
        { "name": "Ohio", "id": "OH" },
        { "name": "Oklahoma", "id": "OK" },
        { "name": "Oregon", "id": "OR" },
        { "name": "Pennsylvania", "id": "PA" },
        { "name": "Rhode Island", "id": "RI" },
        { "name": "South Carolina", "id": "SC" },
        { "name": "South Dakota", "id": "SD" },
        { "name": "Tennessee", "id": "TN" },
        { "name": "Texas", "id": "TX" },
        { "name": "Utah", "id": "UT" },
        { "name": "Vermont", "id": "VT" },
        { "name": "Virginia", "id": "VA" },
        { "name": "Washington", "id": "WA" },
        { "name": "West Virginia", "id": "WV" },
        { "name": "Wisconsin", "id": "WI" },
        { "name": "Wyoming", "id": "WY" }
    ];

    $scope.state1 = null;
    $scope.state2 = null;
    $scope.state3 = null;
    $scope.state4 = $scope.allStates[4];
    $scope.state5 = null;
    $scope.state6 = null;
    $scope.state7 = $scope.allStates[22];
    $scope.state8 = null;

    $scope.getStates = function (callback, searchText) {
        //var data = $filter("filter")($scope.allStates, searchText);
        var data = $filter("filter")($scope.allStates, function (state) {
            // Find states that *start with* the search text
            return state.name.substr(0, searchText.length).toLowerCase() === searchText.toLowerCase();
        });
        callback(data);
    };

    // Return all states when dropdown first opens
    $scope.getAllStates = function (callback) {
        callback($scope.allStates);
    };

    $scope.getStatesPaged = function (callback, searchText, offset) {
        // Get states that contain the search text
        var filteredData = $filter("filter")($scope.allStates, searchText);
        // Get 10 states, starting at the specified offset
        var data = filteredData.slice(offset, offset + 10);
        if (offset === 0) {
            // Return data, searchtext + offset
            callback(data, searchText, filteredData.length);
        }
        else {
            // Set a short delay to simulate server response time
            $timeout(function() {
                callback(data, searchText, offset);
            }, 400);
        }
    };

    $scope.ngSwitchValue = "value";

    $scope.selectedServerItem = null;

    // Web Service call
    $http.post("TestWS.asmx/GetItemData", {})
    .success(function(result) {
        $scope.serverItems = result.d;
        $scope.flags.refresh = true;
    })
    .error(function(a,b,c) {
        alert("Web service call failed!");
    });

});
