/**
 * Created by Guofeng on 11/10/16.
 *
 * <cc-multi-selection-dropdown ng-model="selections" category="'Select...'" source-list="sourceList"
 *    label-field="'name'" value-field="'id'" ng-change="onTestChange(selections)" on-close="onClose()"></cc-multi-selection-dropdown>
 *
 */
(function () {
    'use strict';

    angular.module('components').directive('ccMultiSelectionDropdown', ccMultiSelectionDropdown);

    function ccMultiSelectionDropdown($timeout, $document, $window) {
        "ngInject";

        function link($scope, $element, attrs, ngModel) {
            var textInput = $element[0].querySelectorAll("#trigger-btn")[0];
            var dropdown = $element[0].querySelectorAll(".dropdown-list")[0];

            function uisOffset(element) {
                var boundingClientRect = element.getBoundingClientRect();
                return {
                    width: boundingClientRect.width || angular.element(element).prop('offsetWidth'),
                    height: boundingClientRect.height || angular.element(element).prop('offsetHeight'),
                    top: boundingClientRect.top + ($window.pageYOffset || $document[0].documentElement.scrollTop),
                    left: boundingClientRect.left + ($window.pageXOffset || $document[0].documentElement.scrollLeft)
                };
            }

            function onDocumentClick(e) {
                if (!$scope.$ctrl.open) {
                    return;
                }
                var contains = $element[0].contains(e.target);
                if (!contains) {
                    $scope.$ctrl.open = false;
                    $scope.$digest();
                }

                if (angular.isFunction($scope.onClose)) {
                    $scope.onClose();
                }
            }

            function positionDropdown() {
                if (!$scope.$ctrl.open) {
                    return;
                }

                textInput = textInput || $element[0].querySelectorAll("#trigger-btn")[0];
                dropdown = dropdown || $element[0].querySelectorAll(".dropdown-list")[0];
                var offset = uisOffset(textInput);
                var offsetDropdown = uisOffset(dropdown);
                // var scrollTop = $document[0].documentElement.scrollTop || $document[0].body.scrollTop;
                // dropdown.style.top = offset.top + offset.height - scrollTop + "px";
                dropdown.style.top = offset.height + "px";
                dropdown.style.minWidth = offset.width + "px";
            }

            $document.on('click', onDocumentClick);
            window.addEventListener('scroll', positionDropdown, true);
            angular.element($window).on('resize', positionDropdown);

            $scope.$on('$destroy', function() {
                $document.off('click', onDocumentClick);
                window.removeEventListener('scroll', positionDropdown, true);
                angular.element($window).off('resize', positionDropdown);
            });

            $scope.$watch("$ctrl.open", function(newValue) {
                if (newValue) {
                    positionDropdown();
                }
            });

            function modelFilterFunction(item) {
                if ($scope.valueField) {
                    return ngModel.$viewValue.indexOf(item[$scope.valueField]) !== -1;
                } else {
                    return ngModel.$viewValue.indexOf(item) !== -1;
                }
            }

            ngModel.$render = function() {
                if (ngModel.$viewValue) {
                    $scope.$ctrl.selections = $scope.sourceList.filter(modelFilterFunction);
                } else {
                    $scope.$ctrl.selections = [];
                }
            };

            $scope.$watch("$ctrl.selections", function(newValue) {
                var viewValue = [];
                if (newValue) {
                    newValue.forEach(function(item) {
                        viewValue.push($scope.valueField ? item[$scope.valueField] : item);
                    });
                }
                if (!angular.equals(ngModel.$viewValue, viewValue)) {
                    ngModel.$setViewValue(viewValue);
                }
            }, true);
        }

        function controller($scope) {
            var $ctrl = this;
            $ctrl.search = "";
            $ctrl.open = false;
            $ctrl.selections = [];
            $ctrl.selectionMapping = {};

            function syncSelection() {
                $ctrl.selectionMapping = {};
                if (!$scope.sourceList || $scope.sourceList.length <= 0) {
                    $ctrl.selections = [];
                }
                if (!$ctrl.selections || $ctrl.selections.length <= 0) {
                    return;
                }
                var j, i, selection, item;
                for (j = 0; j < $ctrl.selections.length; j++) {
                    selection = $ctrl.selections[j];
                    for (i = 0; i < $scope.sourceList.length; i++) {
                        item = $scope.sourceList[i];
                        if (item === selection) {
                            $ctrl.selectionMapping[$scope.labelField ? item[$scope.labelField] : item] = true;
                            break;
                        }
                        if (angular.equals(selection, item)) {
                            $ctrl.selections.splice(j, 1, item);
                            $ctrl.selectionMapping[$scope.labelField ? item[$scope.labelField] : item] = true;
                            break;
                        }
                    }
                }
            }

            $ctrl.getSelectionText = function(list) {
                var str = "";
                if (list && list.length > 0) {
                    list.forEach(function(item, index) {
                        index === 0 ? str : str = str + ", ";
                        if ($scope.labelField) {
                            str += item[$scope.labelField];
                        } else {
                            str += item;
                        }
                    });
                }
                return str;
            };

            $ctrl.onTrigger = function() {
                $ctrl.open = !$ctrl.open;
            };

            $ctrl.filterFunction = function(item) {
                if ($scope.labelField) {
                    return item[$scope.labelField].indexOf($scope.$ctrl.search) !== -1;
                } else {
                    return item.indexOf($scope.$ctrl.search) !== -1;
                }
            };

            $ctrl.getLabel = function(item) {
                if ($scope.labelField) {
                    return item[$scope.labelField];
                } else {
                    return item;
                }
            };

            $ctrl.selectionChange = function(item) {
                // in case multiple component
                if (!$ctrl.open) {
                    return;
                }
                var index = $ctrl.selections.indexOf(item);
                if (index !== -1) {
                    $ctrl.selections.splice(index, 1);
                } else {
                    $ctrl.selections.push(item);
                }
            };

            $ctrl.findGroupByName = function(name) {
                return $ctrl.orgGroups && $ctrl.orgGroups.filter(function(group) {
                    return group.name === name;
                })[0];
            };

            $scope.$watch("sourceList", function(newValue) {
                if (!newValue || newValue.length === 0) {
                    $ctrl.noSource = true;
                    $ctrl.selections = [];
                    return;
                } else {
                    $ctrl.noSource = false;
                }

                $ctrl.sourceList = $scope.sourceList.filter($ctrl.filterFunction);
                syncSelection();
            });

            $scope.$watch("$ctrl.search", function(newValue) {
                if (!newValue) {
                    $ctrl.sourceList = $scope.sourceList.slice();
                } else {
                    $ctrl.sourceList = $scope.sourceList.filter($ctrl.filterFunction);
                }
            });
        }

        return {
            restrict: 'AE',
            replace: true,
            require: 'ngModel',
            templateUrl: 'common/directive/ccMultiSelectionDropdown/multi.selection.dropdown.view.html',
            controller: ["$scope", controller],
            controllerAs: "$ctrl",
            scope: {
                category: "=",
                sourceList: "=",
                isDisabled: "=",
                labelField: "=",
                valueField: "=",
                onClose: "&"
            },
            link: link
        };

    }

})();
