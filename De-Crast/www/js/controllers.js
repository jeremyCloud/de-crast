//Home of controllers. Most of our logic will go here.
angular.module('decrast.controllers', [])

    .controller('HomeCtrl', function ($rootScope, $scope, $ionicModal, $ionicLoading, $ionicPopover, $ionicViewSwitcher, $state, Tasks, $stateParams) {
    $scope.tasks = Tasks.all();
    $scope.name = "De-Crast User";


    $scope.goDetail = function (task) {
        //$stateParams.$state.go('viewTask', {});
        $state.go('viewTask', {task: task});
        //console.log(task);
    }
/*
    // function to fetch data from the server
    $rootScope.task_list = {};
    var listHold = angular.fromJson(localStorage.getItem('task_list'));

    if (listHold != null) {
        $rootScope.task_list = listHold;
    }*/


    $scope.onClick = function () {

        $state.go('addTask', {});
    };

    $scope.goBlock = function() {
        $state.go('block', {});
        $scope.popover.hide();
    };
        $scope.goNotif = function() {
            $state.go('manage-notifications', {});
            $scope.popover.hide();
        };
        $scope.goLogout = function() {
            $state.go('logout', {});
            $scope.popover.hide();
        };
        $scope.goCategories = function() {
            $state.go('manage-categories', {});
            $scope.popover.hide();
        };



    //Settings popover
        $ionicPopover.fromTemplateUrl('templates/settings.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popover = popover;
        });

        $scope.openPopover = function($event) {
            $scope.popover.show($event);
        };
        $scope.closePopover = function() {
            $scope.popover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.popover.remove();
        });
        // Execute action on hidden popover
        $scope.$on('popover.hidden', function() {
            // Execute action
        });
        // Execute action on remove popover
        $scope.$on('popover.removed', function() {
            // Execute action
        });
})

    .controller('AddTaskCtrl', function ($rootScope, $scope, $ionicModal, $ionicLoading, $ionicViewSwitcher, $state, TaskFact) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });
        $scope.pagename = "Add";


        $scope.myFactory = new TaskFact();


    })

    .controller('EditTaskCtrl', function ($scope) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })
        $scope.pagename = "Edit";

        $scope.editTask = function () {

        }
    })

    .controller('ViewTaskCtrl', function ($scope, $state, $stateParams) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })
        $scope.task = $stateParams.task;
        $scope.pagename = "View";
    })

    .controller('FtasksCtrl', function ($scope, Ftasks) {
        $scope.ftasks = Ftasks.all();
    })
    .controller('NotifCtrl', function ($scope, $stateParams, Notifications) {
        $scope.notifications = Notifications.all();
    })
    .controller('FriendsCtrl', function ($scope, Friends, $stateParams) {
        $scope.friends = Friends.all();
        $scope.$on("$ionicView.afterEnter", function () {
            for (var i = 0; i < $scope.friends.length; i++) {
                $scope.currentFriend = Friends.get(i);
                if ($scope.currentFriend.star == 'on') {
                    console.log("star on");
                    document.getElementById("starRate" + i).className = "icon ion-ios-star";
                }

            }
        });
        $scope.turnStar = function (index) {
            //console.log("You turn star");
            document.getElementById("starRate" + index).className =
                (document.getElementById("starRate" + index).className == "icon ion-ios-star") ? "icon ion-ios-star-outline" : "icon ion-ios-star";

        }
    })

    .controller('SettingsCtrl', function ($rootScope, $scope, $ionicModal, $ionicLoading, $ionicViewSwitcher, $state) {

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });
    })
/*
    .controller('MainCtrl', function($scope, $ionicPopover) {

        // // .fromTemplate() method
        // var template = '<ion-popover-view><ion-header-bar><h1 class="title">My Popover Title</h1></ion-header-bar><ion-contentHello!</ion-content></ion-popover-view>';
        //
        // $scope.popover = $ionicPopover.fromTemplate(template, {
        //     scope: $scope
        // });

        // .fromTemplateUrl() method
        $ionicPopover.fromTemplateUrl('templates/settings.html', {
            scope: $scope
        }).then(function(popover) {
            $scope.popover = popover;
        });

        $scope.openPopover = function($event) {
            $scope.popover.show($event);
        };
        $scope.closePopover = function() {
            $scope.popover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            $scope.popover.remove();
        });
        // Execute action on hidden popover
        $scope.$on('popover.hidden', function() {
            // Execute action
        });
        // Execute action on remove popover
        $scope.$on('popover.removed', function() {
            // Execute action
        });
    })
    */
    .controller('LogoutCtrl', function ($scope, $state) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })

    })
    .controller('ManageCategoriesCtrl', function ($scope, $state) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })

    })
    .controller('ManageNotificationsCtrl', function ($scope, $state) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })

    })
    .controller('BlockCtrl', function ($scope, $state) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })

    });
