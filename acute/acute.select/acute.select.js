/// <reference path="../lib/angular.1.2.1.js" />

// Directive that creates a searchable dropdown list.

// Associated attributes:-
// ac-model - use instead of ng-model
// ac-options - use instead of ng-options.

// Example:- <select class="ac-select" ac-model="colour" ac-options="c.name for c in colours"></select>

// Note:- ac-options works like ng-options, but does not support option groups

angular.module("acute.select", [])
.directive("acSelect", function ($parse, acuteSelectService) {
    var defaultSettings = acuteSelectService.getSettings();
    return {
        restrict: "EAC",
        scope: {
            "acSettings": "@",
            "acChange": "&",
            "model": "=acModel",
        },
        replace: true,
        templateUrl: defaultSettings.templatePath + "acute.select.htm",
        link: function (scope, element, attrs) {

            scope.settings = acuteSelectService.getSettings();

            scope.searchText = "";
            scope.longestText = "";
            scope.comboText = "";
            scope.items = [];
            scope.allItems = [];        // Unfiltered
            scope.selectedItem = null;
            scope.allDataLoaded = false;
            scope.scrollTo = 0;         // To change scroll position
            scope.scrollPosition = 0;   // Reported scroll position
            scope.listHeight = 0;
            scope.matchFound = false;

            // Check that ac-options and ac-model values are set
            var acOptions = attrs.acOptions;
            if (acOptions === undefined || attrs.acModel === undefined) {
                throw "ac-options and ac-model attributes must be set";
            }

            if (attrs.acSettings != undefined) {
                scope.acSettings = scope.$eval(attrs.acSettings);
                if (typeof scope.acSettings === "object") {
                    // Merge settings with default values
                    angular.extend(scope.settings, scope.acSettings);
                }
            }

            // Parse acOptions

            // Value should be in the form "label for value in array" or "for value in array"
            var words = acOptions.split(' ');
            var len = words.length;
            scope.textField = null;
            scope.dataFunction = null;

            if (len > 3) {
                if (len > 4) {
                    var label = words[len - 5];     // E.g. colour.name
                    scope.textField = label.split(".")[1];
                }
                var dataName = words[len - 1];

                // See if a data load function is specified, i.e. name ends in "()"
                if (dataName.indexOf("()") === dataName.length - 2) {
                    dataName = dataName.substr(0, dataName.length - 2)
                    // Get a reference to the data function
                    var dataFunction = scope.$parent.$eval(dataName);
                    if (typeof dataFunction === "function") {
                        scope.dataFunction = dataFunction;
                        if (scope.settings.loadOnCreate) {
                            // Load initial data (args are callback function, search text and item offset)
                            scope.dataFunction(scope.dataCallback, "", 0);
                        }
                        else if (typeof scope.settings.initialText === 'string') {
                            scope.confirmedItem = { "text": scope.settings.initialText, "value": "" };
                            scope.comboText = scope.settings.initialText;
                        }
                    }
                    else {
                        throw "Invalid data function: " + dataName;
                    }
                }
                else {
                    // Get the data from the parent scope
                    var dataItems = scope.$parent.$eval(dataName);
                    // Create dropdown items
                    scope.loadItems(dataItems, scope.model);
                    // Save selected item
                    scope.confirmedItem = angular.copy(scope.selectedItem);
                    scope.allDataLoaded = true;
                }
            }
        },

        // **************************************************************
        //                          CONTROLLER
        // **************************************************************
        controller: function ($scope, $element, $attrs, $window, $rootScope, $timeout, $filter, navKey, safeApply) {

            // Create dropdown items based on the source data items
            $scope.loadItems = function (dataItems, selectedDataItem) {
                var itemCount, itemIndex, itemID, item;
                if (angular.isArray(dataItems)) {
                    itemCount = $scope.items.length;
                    angular.forEach(dataItems, function (dataItem, index) {
                        itemIndex = itemCount + index;
                        itemID = "item" + $scope.$id + "_" + itemIndex;
                        if ($scope.textField === null) {
                            item = { "text": dataItem, "value": dataItem, "index": itemIndex };
                        }
                        else {
                            item = { "text": dataItem[$scope.textField], "value": dataItem, "index": itemIndex };
                        }
                        $scope.items.push(item);
                        if (dataItem === selectedDataItem) {
                            $scope.selectedItem = item;
                            $scope.confirmedItem = angular.copy($scope.selectedItem);
                        }
                        if (item.text.length > $scope.longestText.length) {
                            $scope.longestText = item.text;
                        }
                    });
                    angular.copy($scope.items, $scope.allItems);
                    $scope.setListHeight();
                }
            };

            // Set height of list according to number of visible items
            $scope.setListHeight = function () {
                var itemCount = $scope.items.length;
                if (itemCount > $scope.settings.itemsInView) {
                    itemCount = $scope.settings.itemsInView;
                }

                $scope.listHeight = $scope.settings.itemHeight * itemCount;
            };

            if ($scope.selectedItem) {
                $scope.comboText = $scope.selectedItem.text;
            }

            // Close all instances when user clicks elsewhere
            $window.onclick = function (event) {
                closeWhenClickingElsewhere(event, function () {
                    $rootScope.$broadcast("ac-select-close-all");
                });
            };

            // Keyboard events
            $scope.keyHandler = function (event) {

                if (!$scope.settings.showSearchBox) {
                    handleCharCodes(event);
                }

                if ($scope.popupVisible) {
                    var stopPropagation = true;
                    switch (event.which || event.keyCode) {
                        case navKey.downArrow:
                            downArrowKey();
                            break;
                        case navKey.upArrow:
                            upArrowKey();
                            break;
                        case navKey.enter:
                            enterKey();
                            break;
                        case navKey.end:
                            endKey();
                            break;
                        case navKey.home:
                            homeKey();
                            break;
                        case navKey.escape:
                            escapeKey();
                            break;
                        case navKey.del:
                            deleteKey(event);
                            break;
                        case navKey.pageUp:
                            pageUpKey();
                            break;
                        case navKey.pageDown:
                            pageDownKey();
                            break;
                        default:
                            stopPropagation = false;
                            break;
                    }

                    if (stopPropagation) event.stopPropagation();
                }
            };

            function handleCharCodes(event) {
                var character, i, item;
                if (event.keyCode) {
                    character = String.fromCharCode(event.keyCode);
                    for (i = 0; i < $scope.items.length; i++) {
                        item = $scope.items[i];
                        if (item.text.length > 0 && item.text.substr(0, 1).toUpperCase() === character) {
                            $scope.selectedItem = item;
                        }
                    }
                }
            }

            // Callback function to receive async data
            $scope.dataCallback = function (data, matchingItemTotal) {

                var selectedDataItem = null;

                $scope.dataItems = data;

                // If we have a selected item, get its value
                if ($scope.selectedItem !== null) {
                    selectedDataItem = $scope.selectedItem.value;
                }
                else {
                    //selectedDataItem = $scope.getModelObject();
                    selectedDataItem = $scope.model;
                }

                $scope.loadItems(data, selectedDataItem);

                // If data function takes only one argument, all data is now loaded
                $scope.allDataLoaded = $scope.dataFunction.length === 1;
                // Clear loadOnOpen flag to avoid re-loading when dropdown next opened
                $scope.settings.loadOnOpen = false;

                // If a matchingItemTotal value is returned, we are in paging mode
                if (matchingItemTotal) {
                    $scope.paging = true;
                    $scope.matchingItemTotal = matchingItemTotal;
                    // If user was scrolling down
                    if ($scope.requestedItemIndex) {
                        // Select first of the newly loaded items (if present)
                        if ($scope.requestedItemIndex < $scope.items.length) {
                            $scope.selectedItem = $scope.items[$scope.requestedItemIndex];
                            ensureItemVisible($scope.selectedItem);
                        }
                        $scope.requestedItemIndex = null;
                    }
                    // Show loading message if not all items yet loaded
                    $scope.showLoadingMessage = $scope.items.length < matchingItemTotal;
                }
                $scope.loading = false;
            };

            $scope.findData = function () {
                filterData($scope.searchText);
            };

            $scope.comboTextChange = function () {
                $scope.popupVisible = true;
                $scope.ensureDataLoaded();
                filterData($scope.comboText);
            };

            // Show/hide popup
            $scope.togglePopup = function () {
                $scope.popupVisible = !$scope.popupVisible;
                if ($scope.popupVisible) {
                    if ($scope.settings.comboMode) {
                        $timeout(function () { $scope.comboFocus = true; });
                    }
                    else {
                        $timeout(function () { $scope.searchBoxFocus = true; });
                    }
                    $scope.ensureDataLoaded();
                }
            };

            $scope.ensureDataLoaded = function () {
                if (!$scope.allDataLoaded && $scope.dataFunction && $scope.settings.loadOnOpen) {
                    // Load initial data (args are callback function, search text and item offset)
                    $scope.dataFunction($scope.dataCallback, "", 0);
                }
            };

            // When clicking on the ac-select-main div
            $scope.mainClick = function () {
                // Close any other ac-select instances
                $scope.sentBroadcast = true;
                $rootScope.$broadcast("ac-select-close-all");
            };

            $scope.$on("ac-select-close-all", function () {
                if (!$scope.sentBroadcast) {
                    $scope.popupVisible = false;
                    safeApply($scope);
                }
                else {
                    $scope.sentBroadcast = false;
                }
            });

            $scope.itemClick = function (i) {
                $scope.selectedItem = $scope.items[i];
                selectionConfirmed();
            };

            $scope.getItemClass = function (i) {
                if ($scope.selectedItem && $scope.items[i].value === $scope.selectedItem.value) {
                    return "ac-select-highlight";
                }
                else {
                    return "";
                }
            };

            $scope.addButtonClick = function () {
                if (customAddRequest()) {
                    selectionConfirmed();
                }
            };

            $scope.listScrolled = function (scrollPosition) {
                $scope.scrollPosition = scrollPosition;
                if ($scope.paging) {
                    var totalHeight = $scope.items.length * $scope.settings.itemHeight;
                    // If scrolled past the last item
                    if (scrollPosition > totalHeight - $scope.listHeight) {
                        $scope.loadMore();
                    }
                }
            };

            // Load further data when paging is enabled
            $scope.loadMore = function () {
                if (!$scope.loading && $scope.showLoadingMessage) {
                    $scope.loading = true;
                    var offSet = $scope.items.length;
                    var searchText = $scope.settings.comboMode ? $scope.comboText : $scope.searchText;
                    $scope.dataFunction($scope.dataCallback, searchText, offSet);
                }
            }

            // Private functions

            function selectionConfirmed(forceClose) {
                var close = false;
                if ($scope.selectedItem) {
                    $scope.confirmedItem = angular.copy($scope.selectedItem);
                    $scope.model = $scope.selectedItem.value;
                    $scope.comboText = $scope.selectedItem.text;
                    close = true
                }
                else {
                    // Try adding as a custom item
                    if (customAddRequest()) {
                        close = true;
                    }
                }
                if (close || forceClose) {
                    $scope.popupVisible = false;
                    $scope.wrapperFocus = true;
                    // If all data is loaded
                    if ($scope.allDataLoaded && !$scope.settings.comboMode) {
                        // Clear the search text and filter
                        $scope.searchText = "";
                        clearClientFilter();
                    }
                }

                // Fire acChange function, if specified
                if (typeof $scope.acChange === 'function') {
                    $scope.acChange({ value: $scope.selectedItem ? $scope.selectedItem.value : null });
                }
            }

            function customAddRequest() {
                var customText, dataItem;
                var added = false;
                if ($scope.settings.allowCustomText && !$scope.matchFound) {
                    customText = $scope.settings.comboMode ? $scope.comboText : $scope.searchText;
                    if (customText.length > 0) {
                        // Create new data item
                        dataItem = {};
                        dataItem[$scope.textField] = customText;
                        $scope.model = dataItem;
                        $scope.selectedItem = { "text": customText, "value": dataItem, "index": -1 };
                        added = true;
                    }
                }
                return added;
            }

            function enterKey() {
                selectionConfirmed();
            }

            function downArrowKey() {
                if ($scope.items.length > 0) {
                    var selected = false;
                    if ($scope.selectedItem) {
                        var newIndex = $scope.selectedItem.index + 1;
                        if (newIndex < $scope.items.length) {
                            var targetItem = $scope.items[newIndex];
                            $scope.selectedItem = targetItem;
                            ensureItemVisible($scope.selectedItem);
                            selected = true;
                        }
                        else if ($scope.paging) {
                            $scope.requestedItemIndex = newIndex;
                            $scope.scrollTo += $scope.settings.itemHeight;
                            $scope.loadMore();
                        }
                    }
                    else {
                        // Select first item
                        $scope.selectedItem = $scope.items[0];
                        selected = true;
                    }
                }
            };

            function upArrowKey() {
                if ($scope.items.length > 0) {
                    if ($scope.selectedItem) {
                        var targetItem = $scope.items[$scope.selectedItem.index - 1];
                        if (targetItem) {
                            $scope.selectedItem = targetItem;
                            ensureItemVisible($scope.selectedItem);
                        }
                    }
                    else {
                        if ($scope.comboMode) {
                            $scope.comboFocus = true;
                        }
                        else {
                            $scope.searchBoxFocus = true;
                        }
                    }
                }
            };

            function pageUpKey() {
                if ($scope.items.length > 0 && $scope.selectedItem) {
                    var newIndex = $scope.selectedItem.index - $scope.settings.itemsInView;
                    if (newIndex < 0) newIndex = 0;
                    var targetItem = $scope.items[newIndex];
                    if (targetItem) {
                        $scope.selectedItem = targetItem;
                        ensureItemVisible($scope.selectedItem);
                    }
                }
            };

            function pageDownKey() {
                var newIndex;
                if ($scope.items.length > 0) {
                    if ($scope.selectedItem) {
                        newIndex = $scope.selectedItem.index + $scope.settings.itemsInView;
                    }
                    else {
                        newIndex = $scope.settings.itemsInView - 1;
                    }
                    // If past the end
                    if (newIndex >= $scope.items.length) {
                        if ($scope.allDataLoaded) {
                            newIndex = $scope.items.length - 1;
                        }
                        else {

                        }
                    }
                    var targetItem = $scope.items[newIndex];
                    if (targetItem) {
                        $scope.selectedItem = targetItem;
                        ensureItemVisible($scope.selectedItem);
                    }
                }
            };

            function endKey() {
                if ($scope.items.length > 0) {
                    $scope.selectedItem = $scope.items[$scope.items.length - 1];
                    var totalHeight = $scope.settings.itemHeight * $scope.items.length;
                    $scope.scrollTo = totalHeight - $scope.listHeight;
                }
            }

            function homeKey() {
                if ($scope.items.length > 0) {
                    $scope.selectedItem = $scope.items[0];
                    $scope.scrollTo = 0;
                }
            }

            function escapeKey() {
                // Revert to last confirmed selection
                $scope.selectedItem = $scope.confirmedItem;
                selectionConfirmed(true);
            }

            function deleteKey(event) {
                if ($scope.settings.allowClear) {
                    var srcElement = angular.element(event.target);
                    if (srcElement.hasClass('ac-select-text')) {
                        event.stopPropagation = true;
                    }
                    else {
                        clearSelection();
                    }
                }
            }

            function clearSelection() {
                $scope.selectedItem = null;
                $scope.model = null;
                $scope.scrollTo = 0;
                $scope.comboText = "";
            }

            function ensureItemVisible(item) {
                var itemHeight = $scope.settings.itemHeight;
                var itemTop = itemHeight * item.index;
                if (itemTop + itemHeight > $scope.listHeight + $scope.scrollPosition) {
                    $scope.scrollTo = itemTop + itemHeight - $scope.listHeight;
                }
                else if (itemTop < $scope.scrollPosition) {
                    $scope.scrollTo = itemTop;
                }
            }

            function filterData(searchText) {
                $scope.showLoadingMessage = false;
                $scope.selectedItem = null;
                if ($scope.allDataLoaded) {
                    if ($scope.settings.filterType == "contains") {
                        $scope.items = $filter("filter")($scope.allItems, searchText);
                    }
                    else {
                        $scope.items = $filter("filter")($scope.allItems, function (item) {
                            // Check for match at start of items only
                            return item.text.substr(0, searchText.length).toLowerCase() === searchText.toLowerCase();
                        });
                    }
                    // Update indexes
                    angular.forEach($scope.items, function (item, index) {
                        item.index = index;
                    });
                }
                else {
                    // Pass search text to data function (if it takes 2 or more arguments)
                    $scope.items = [];
                    if ($scope.dataFunction && $scope.dataFunction.length >= 2
                        && searchText.length >= $scope.settings.minSearchLength) {
                        $scope.dataFunction($scope.dataCallback, searchText, 0);
                    }
                }

                $scope.setListHeight();

                // If narrowed down to one item, select it
                if ($scope.items.length === 1) {
                    $scope.matchFound = true;
                    $scope.selectedItem = $scope.items[0];
                }
                else {
                    $scope.matchFound = false;
                }
            }

            // Remove any client filtering of items
            function clearClientFilter() {
                if ($scope.allDataLoaded) {
                    $scope.items = $scope.allItems;
                    $scope.setListHeight();
                }
            }

            function closeWhenClickingElsewhere(event, callbackFn) {

                var element = event.target;
                if (!element) return;

                var clickedOnPopup = false;
                // Check up to 10 levels up the DOM tree
                for (var i = 0; i < 10 && element && !clickedOnPopup; i++) {
                    var elementClasses = element.classList;
                    if (elementClasses.contains('ac-select-wrapper')) {
                        clickedOnPopup = true;
                    }
                    else {
                        element = element.parentElement;
                    }
                }

                if (!clickedOnPopup) {
                    callbackFn();
                }
            }
        }
    };
})

// Directive to set focus to an element when a specified expression is true
.directive('acFocus', function ($timeout, $parse) {
    return {
        restrict: "A",
        link: function (scope, element, attributes) {
            var setFocus = $parse(attributes.acFocus);
            scope.$watch(setFocus, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
            // Set the "setFocus" attribute value to 'false' on blur event
            // using the "assign" method on the function that $parse returns
            element.bind('blur', function () {
                scope.$apply(setFocus.assign(scope, false));
            });
        }
    };
})

// Directive for a scroll container. Set the "ac-scroll-to" attribute to an expression and when its value changes,
// the div will scroll to that position
.directive('acScrollTo', function () {
    return {
        restrict: "A",
        scope: false,
        controller: function ($scope, $element, $attrs) {
            var expression = $attrs.acScrollTo;
            $scope.$watch(expression, function () {
                var scrollTop = $scope.$eval(expression);
                angular.element($element)[0].scrollTop = scrollTop;
            });
        }
    };
})

// Call a function when the element is scrolled
// E.g. ac-on-scroll="listScrolled()" 
// N.B. take care not to use the result to directly update an acScrollTo expression
// as this will result in an infinite recursion!
.directive('acOnScroll', function () {
    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            var callbackName = attrs.acOnScroll;
            if (callbackName.indexOf("()") === callbackName.length - 2) {
                callbackName = callbackName.substr(0, callbackName.length - 2);
            }
            var callback = scope[callbackName];
            if (typeof callback === "function") {
                element.bind("scroll", function () {
                    callback(element[0].scrollTop);
                });
            }
        }
    };
})

.factory('navKey', function () {
    return {
        'backspace': 8,
        'tab': 9,
        'enter': 13,
        'escape': 27,
        'pageUp': 33,
        'pageDown': 34,
        'end': 35,
        'home': 36,
        'leftArrow': 37,
        'upArrow': 38,
        'rightArrow': 39,
        'downArrow': 40,
        'del': 46
    };
})

// safeApply service, courtesy Alex Vanston and Andrew Reutter
.factory('safeApply', [function ($rootScope) {
    return function ($scope, fn) {
        var phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn) {
                $scope.$eval(fn);
            }
        } else {
            if (fn) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    }
}])

// Service to allow host pages to change settings for all instances (in their module.run function)
.factory('acuteSelectService', function () {

    var defaultSettings = {
        "templatePath": "/acute.select/",
        "noItemsText": "No items found.",
        "itemHeight": 24,
        "itemsInView": 10,
        "minWidth": "100px",
        "showSearchBox": true,
        "comboMode": false,
        "loadOnCreate": false,
        "loadOnOpen": false,      // If true, load function will be called when dropdown opens, i.e. before any search text is entered
        "initialText": null,      // Initial text to show if data is not loaded immediately
        "allowCustomText": false,
        "minSearchLength": 1,
        "filterType": "contains",    // or "start"
        "allowClear": true
    };

    return {
        getSettings: function () {
            // Add trailing "/" to template path if not present
            var len = defaultSettings.templatePath.length;
            if (len > 0 && defaultSettings.templatePath.substr(len - 1, 1) !== "/") {
                defaultSettings.templatePath += "/";
            }
            return angular.copy(defaultSettings);
        },
        updateSetting: function (settingName, value) {
            if (defaultSettings.hasOwnProperty(settingName)) {
                defaultSettings[settingName] = value;
            }
        }
    };
});