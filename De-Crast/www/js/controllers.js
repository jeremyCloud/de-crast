//Home of controllers. Most of our logic will go here.
angular.module('decrast.controllers', ['ngOpenFB'])
    
    .controller('HomeCtrl', function ($rootScope, $scope, $ionicModal, $ionicLoading, $ionicPopover, $ionicViewSwitcher, $state, Tasks, $stateParams, ngFB, $ionicHistory, $ionicPopup, Server, TaskFact, Friends, Notif) {
        //$scope.tasks = Tasks.all();
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            
            if(localStorage.getItem('login') == null){
                $state.go('login', {});
            }
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
            Server.getUserTasks().then(function(data){
                $scope.populateTasks(data.data);
            });
            
        });
        $scope.$on('$ionicView.afterEnter', function (event, viewData) {
            // prepare categories list
            $scope.populateCategories();
            // prepare friends list
            $scope.fetchFBfriends();
//////////////// below may be delete if Junwei's notification system setup
            $scope.fakepopulateNotification();
//////////////////////////////////////////////////////////////////////////
            $scope.getViewTask();
        });
        $scope.name = localStorage.getItem('user');

        // function to fetch data from the server
        $rootScope.task_list = {};
        
        var listHold = angular.fromJson(localStorage.getItem('task_list'));

        if (listHold != null) {
            $rootScope.task_list = listHold;
        }


        if($rootScope.sorting != null)
            $scope.sorting = $rootScope.sorting;
        else
            $scope.sorting = "";



        $scope.doSorting = function() {
            var elem_type = document.getElementById('sorting-select');
            var sort_type = elem_type.options[elem_type.selectedIndex].value;

            console.log(sort_type);

            if (sort_type == "Due Date") {
                $scope.sorting = "task_time";
            }
            else if (sort_type == "Category") {
                $scope.sorting = "task_category";
                console.log("here");
            }
            else {
                $scope.sorting = "task_name";
            }
            $rootScope.sorting = $scope.sorting;
        };


        /*
        Function to display Task Detail Page
        */
        $scope.goDetail = function (task) {
            //$stateParams.$state.go('viewTask', {});
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('viewTask', {task: task});
            //console.log(task);
        };

        /*
        Function to transition to adding a task
        */
        $scope.onClick = function () {
            $ionicViewSwitcher.nextDirection('forward');

            $state.go('addTask', {});
        };

        /*
        Transition functions for popover menu
        */
        $scope.goBlock = function() {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('block', {});
            $scope.popover.hide();
        };
        $scope.goNotif = function() {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('manage-notifications', {});
            $scope.popover.hide();
        };
        $scope.goLogout = function() {
            $scope.popover.hide();
            //$state.go('logout', {});
            var confirmPopup = $ionicPopup.confirm({
                title: 'Are You Sure to Quit?'
            });
            confirmPopup.then(function(res) {
            if(res) {
                    ngFB.logout().then(
                        function (response) { 
                                console.log('Facebook logout succeeded');
                                $scope.ignoreDirty = true; //Prevent loop
                                localStorage.clear();
                                $ionicHistory.clearCache();
                                $ionicHistory.clearHistory();
                                $state.go('login'); 
                        });
            } else {
                console.log('You stay');
            }
            });
            //$ionicViewSwitcher.nextDirection('forward');
        };
        $scope.goCategories = function() {
            $ionicViewSwitcher.nextDirection('forward');
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
        /*
        Function to display the task list
        */
        $scope.populateTasks = function(response){
            
            $rootScope.task_list = angular.fromJson(localStorage.getItem('task_list'));
            if ($rootScope.task_list === null) {
                console.log("reset");
                $rootScope.task_list = {};
                localStorage.setItem('task_list', angular.toJson($rootScope.task_list));
            }
            for(i=0;i<response.length;i++) {
                if ($rootScope.task_list[response[i].taskId] === undefined) {
                    Server.getTask(response[i].taskId).then(function(data){
                        var data = data.data[0];
                        
                        Server.getEvidenceType(data.taskId).then(function(res){
                            $rootScope.task_list = angular.fromJson(localStorage.getItem('task_list'));
                            var ddl = new Date(data.deadline*1000);
                            var timezone = new Date().getTimezoneOffset();
                            var date = (ddl.getTime() - timezone*60000)/1000.0;
                            var utcDate = new Date( date*1000);

//                            var myDate = new Date( (data.deadline - 3600.0*10.0) *1000); // correct GMT
//                            var utcDate = new Date(myDate.getUTCFullYear(), myDate.getUTCMonth(), myDate.getUTCDate(), myDate.getUTCHours(), myDate.getUTCMinutes());
                            // myDate.toISOString();// todoo
                            console.log("checktime", utcDate);
                            /*var myEpoch = myDate.getTime() / 1000.0 - 3600.0 * 5.0;
                            myDate = new Date(myEpoch);*/
                            var newTask = (new TaskFact()).addTask(data.taskId, data.name, data.description,
                                data.category, utcDate, $rootScope.friend_list[data.viewer], null, null); // todo
                            $rootScope.task_list[data.taskId] = newTask;
                            
                            $rootScope.task_list[res.data.taskId].task_evidenceType = res.data.type; 
                            localStorage.setItem('task_list', angular.toJson($rootScope.task_list));
                                
                        });
                    });
                }
            }
        };

        $scope.populateCategories = function(){
            $rootScope.category_list = {};
            Server.getCategory().then(function(data){
                if(data.data.length == 0){
                    //$ionicLoading.show({template: 'No categories found', noBackdrop: true, duration: 2500});
                }
                for(i=0;i<data.data.length;i++){
                    $rootScope.category_list[data.data[i].categoryId] = data.data[i];
                }
                localStorage.setItem('category_list', angular.toJson($rootScope.category_list));
            });
        
            $scope.categoryIdConverName = function(cid){
                var taskCategory = $rootScope.category_list[cid];
                if(taskCategory == null){
                    return "None";
                }else{
                    return taskCategory.name;
                }
                
            };
        };

        $scope.fetchFBfriends = function(){
            // prepare friends container
            $rootScope.friend_list = {};
            
            // FB get friends who is also using the app
            ngFB.api({
                path: '/me/friends',
                params: {}
            }).then(
                function (list) {
                    if(list.data.length == 0){
                        $ionicLoading.show({template: 'Cannot find FB friends using the app', noBackdrop: true, duration: 2500});
                    }
                    
                    for(i=0;i<list.data.length;i++){
                        var friendFbId = list.data[i].id;
                        var friendFbName = list.data[i].name;
                        $scope.getUserByFbId(friendFbId, friendFbName);
                    }
                    //localStorage.setItem('friend_list', angular.toJson($rootScope.friend_list));
                },
                function (error) {
                    alert('Facebook error: ' + error.error_description);
                });

            // populate view
            
        };

        $scope.getUserByFbId = function(fbId, fbName){
            Server.getUserByFbId(fbId).then(function(data){
                var userId = data.data[0].userId;
                var username = data.data[0].username;
                var name = null;
                if(username != null){
                    name = username;
                }else{
                    name = fbName;
                }
                var newFriend = (new Friends()).addFriend(userId, name, 'normal');
                $rootScope.friend_list[userId] = newFriend;
                localStorage.setItem('friend_list', angular.toJson($rootScope.friend_list));
            });
            // default status as normal   
            
        };

//////////////// below may be delete if Junwei's notification system setup
        $scope.fakepopulateNotification = function(){
            $rootScope.notif_list = {};
            Server.fakegetNotification().then(function(data){
                for(i=0; i<data.data.length; i++){
                    $scope.fakegetNotificationDetail(data.data[i].notificationId);
                }
            });
        };

        $scope.fakegetNotificationDetail = function(notifId){
            Server.fakegetNotificationDetail(notifId).then(function(data){
                var notif = data.data[0];
                var newNotif = (new Notif()).addNotif(notif.sender, notif.recipient, notif.type, notif.sent_date, notif.notificationId, notif.task, notif.metadata, notif.file, notif.text);
                $rootScope.notif_list[notif.notificationId] = newNotif;
                localStorage.setItem('notif_list', angular.toJson($rootScope.notif_list));
            });
        };
        $scope.populateNotif = function(){
            $rootScope.notif_list = angular.fromJson(localStorage.getItem('notif_list'));
        };
//////////////////////////////////////////////////////////////////////////
        
        $scope.getViewTask = function(){
            $rootScope.viewTask_list = {};
            Server.getViewTask().then(function(data){
                for(i=0; i<data.data.length; i++){
                    Server.getEvidenceType(data.data[i].taskId).then(function(data){
                        $scope.getViewTaskDetail(data.data.taskId, data.data.type);
                    });
                }
            });
        };
        $scope.getViewTaskDetail = function(taskId, evidenceType){
            Server.getTask(taskId).then(function(data){
                var task = data.data[0];
                var newViewTask = (new TaskFact()).addTask(task.taskId, task.name, task.description, null, task.deadline, task.owner, null, evidenceType);
                $rootScope.viewTask_list[taskId] = newViewTask;
                localStorage.setItem('viewTask_list', angular.toJson($rootScope.viewTask_list));
                $rootScope.viewTask_list = angular.fromJson(localStorage.getItem('viewTask_list'));
            });
            
        };
    })

    .controller('AddTaskCtrl', function ($rootScope, $stateParams, $scope, $ionicPlatform, $cordovaLocalNotification, $ionicModal, $ionicLoading, $ionicViewSwitcher, $state, TaskFact, $timeout, Server, EvidenceTypes, $ionicPlatform ) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });
        var myCategory;
        var mySelector;
        var evidenceType;
        $scope.title = "Add";
        $scope.evidenceTypes = EvidenceTypes.all();
        $scope.myFactory = new TaskFact();
        $scope.viewerObject = {}; // used to hold viewer

        $scope.$on('$ionicView.afterEnter', function (event, viewData) {
            // set select viewer if exist
            $scope.viewerObject = angular.fromJson(localStorage.getItem('selectedViewer'));
            if($scope.viewerObject){
                $scope.viewer = $scope.viewerObject.friend_name;
                localStorage.removeItem('selectedViewer');
            }
            
            // fetch exist task draft
            $rootScope.task = angular.fromJson(localStorage.getItem('currentTask'));
            // holder for exist task draft
            if($rootScope.task){
                $scope.taskName = $rootScope.task.task_name;
                $scope.descrip = $rootScope.task.task_descrip;
                $scope.time = $rootScope.task.task_time;
                $scope.category = $rootScope.task.task_category;
                $scope.evidenceType = $rootScope.task.task_evidenceType;
                //document.getElementById('time-textarea').value = new Date($scope.time);
                if($scope.category == ""){
                    document.getElementById('category-select').value = "";    
                }else{
                    document.getElementById('category-select').value = $scope.category;    
                }
                
                if($scope.evidenceType != null){
                    document.getElementById('evidenceType-select').value = $scope.evidenceType;
                }
                localStorage.removeItem('currentTask');
            }
            
        });

        $scope.onSubmit = function() {
            if($scope.taskName == null) {
                $ionicLoading.show({template: 'Please Enter A Task Name', noBackdrop: true, duration: 1000});
            }
            else if($scope.time == null) {
                $ionicLoading.show({template: 'Please Enter A Due Time', noBackdrop: true, duration: 1000});
            }
            else {
                /* Add Task to localStorage
                var newTask = $scope.myFactory.addTask($scope.taskName, $scope.descrip, $scope.category, $scope.time, null, null, null);

                $rootScope.task_list[newTask.task_id] = newTask;
                localStorage.setItem('task_list', angular.toJson($rootScope.task_list));
                */
                /*
                Add Task to localStorage and Server
                */
                // check evidenceType
                evidenceType = document.getElementById('evidenceType-select').value;
                if(evidenceType == null || evidenceType == ""){
                    $ionicLoading.show({template: 'Please Select An Evidence Type', noBackdrop: true, duration: 1000});
                }else{
                    // convert from readable time to UNIX
                    var myDate = new Date($scope.time);
                    var timezone = new Date().getTimezoneOffset();
                    var myEpoch = (myDate.getTime() + timezone*60000)/1000.0;
/*
                    var usertime = new Date($scope.time);
                    var timezone = new Date().getTimezoneOffset();
                    var ddl = new Date(user.getTime() + timezone.getTime());
*/
//                    var myDate = new Date($scope.time); // my Date is GMT, $scope.time is Z, we store GMT
                    // console.log(myDate, $scope.time);
//                    var myEpoch = myDate.getTime()/1000.0;
                    mySelector = document.getElementById('category-select');
                    myCategory = mySelector.options[mySelector.selectedIndex].value;
                    console.log(myDate + "Test timeout" + timezone);
                    Server.addNewTask($scope.taskName, $scope.descrip, myEpoch, myCategory, parseInt(evidenceType)).then(function(data) {
                        //console.log(JSON.stringify(data));
                        if (data.data.detail == "deadline")
                            $ionicLoading.show({template: 'Invalid deadline', noBackdrop: true, duration: 1000});
                        else if (data.status != 200) {
                            var errMsg =  data.data.errorMsg + ": "  + data.data.detail;
                            $ionicLoading.show({template: errMsg, noBackdrop: true, duration: 1000});
                        } else {
//////////////// below may be delete if Junwei's notification system setup
                            if($scope.viewerObject){
                                $scope.fakesendNotification($scope.viewerObject.friend_uid, data.data.taskId);
                            }
//////////////////////////////////////////////////////////////////////////
                            $ionicLoading.show({template: 'Task Saved!', noBackdrop: true, duration: 1000});

                            $ionicPlatform.ready(function () {
                                  // var now = new Date().getTime();
                                  // var _3SecondsFromNow = new Date(now + 3 * 1000);
                                  //var ddl = new Date(myEpoch*1000);
                                  var usertime = new Date($scope.time);
                                  var timezone = new Date().getTimezoneOffset();
                                  var ddl = new Date(usertime.getTime() + timezone*60000);
                                  $cordovaLocalNotification.schedule({
                                    id: 10,
                                    title: $scope.taskName,
                                    text: 'This task is DUE!!!',
                                    at: ddl
                                  }).then(function (result) {
                                    console.log( ddl.getTime + 'a local notification is triggered' + myEpoch*1000);
                                  });
                            });

                            $ionicViewSwitcher.nextDirection('back');
                            $timeout(function () {
                                $state.go('tab.home', {});
                                // todo
                            }, 1000);
                        }
                    });
                }
            }
        };
        
        $scope.populateViewers = function(){
            // get all the setting
            evidenceType = document.getElementById('evidenceType-select').value;
            mySelector = document.getElementById('category-select');
            myCategory = mySelector.options[mySelector.selectedIndex].value;
            // create temporarily task object
            var newTask = $scope.myFactory.addTask(null, $scope.taskName, $scope.descrip, myCategory, $scope.time, null, null, parseInt(evidenceType));
            
            localStorage.setItem('currentTask', angular.toJson(newTask));
// we still need viewer to be posted, otherwise cannot link the task and the viewer            
            $state.go('selectViewer', {task: newTask});
        };

//////////////// below may be delete if Junwei's notification system setup
        $scope.fakesendNotification = function(recipientId, taskId){
            var type = 5; // Viewer invite
            console.log(type, recipientId, taskId);
            Server.fakesendNotification(type, recipientId, taskId).then(function(data){});
        };
//////////////////////////////////////////////////////////////////////////
        
    })

    .controller('EditTaskCtrl', function ($scope, $rootScope, $stateParams, $ionicViewSwitcher, $state, TaskFact, $ionicLoading, Server, $ionicPopup, EvidenceTypes) {
        var taskId;
        var myDate;
        var myEpoch;
        var changeTime = false;
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $scope.task = $stateParams.task;
            $scope.title = "Edit";
            taskId = $scope.task.task_id;
            $scope.taskName = $scope.task.task_name;
            $scope.category = $scope.task.task_category;
            $scope.evidenceTypeName = EvidenceTypes.get($scope.task.task_evidenceType).name;
            $scope.descrip = $scope.task.task_descrip;
            $scope.taskPartner = $scope.task.task_partner;
            
            if($scope.task.task_partner != null){
                $scope.viewer = $scope.task.task_partner.friend_name;
            }else{
                $scope.viewer = "No Viewer";
            }
            
            
            // below are used for deadline change
            $scope.myFactory = new TaskFact();
            myDate = new Date($scope.task.task_time); // $scope.task.task_time is Z (UTC) time
            // myDate.toLocaleString(); // this is the original task deadline translated to GMT
            // add 5 hr to make the time match, may cause bug
            myEpoch = myDate.getTime()/1000.0 + 60.0*60.0*5.0; // add 5 hr to UTC
            // myDate = new Date(myEpoch*1000.0); // convert from epoch, get UTC back
            // myDate.toLocaleString(); // get GMT
        });
        $scope.$on('$ionicView.afterEnter', function (event, viewData) {
            if($scope.category != null){
                document.getElementById('category-select-edit').value = $scope.category;
            }

        });
        

        $scope.editTask = function () {

            if($scope.taskName == null) {
                $ionicLoading.show({template: 'Please Enter A Task Name', noBackdrop: true, duration: 1000});
            }
            else {
                // change within localStorage
                // var tempTask = $scope.myFactory.editTask($scope.task, $scope.taskName, $scope.descrip, $scope.category);
                // $rootScope.task_list[tempTask.id] = tempTask;
                // $scope.time is the new task deadline
                // myEpoch is the old task deadline, newEpoch is the new task deadline
                if(!changeTime){
                    $scope.setTaskLocal();
                }else{
                    if($scope.time == null){
                        $ionicLoading.show({template: 'No new deadline is set, hit back button to discard the deadline change', noBackdrop: true, duration: 1000});
                    }else{
                        var newEpoch = $scope.time.getTime()/1000.0;
                        if(myEpoch == newEpoch){
                            $ionicLoading.show({template: 'Same deadline is set, hit back button to discard the deadline change', noBackdrop: true, duration: 1000});
                            console.log("they are the same");
                        }else{
                            // talk to Server
                            $scope.category = document.getElementById('category-select-edit').value;
                            Server.editTask(taskId, $scope.taskName, $scope.descrip, $scope.category).then(function(data){
                                // var newDate = new Date(newEpoch * 1000.0);
                                if(data.status == 200){ // edit task success, send notification if change of deadline
                                        var type = 3;
                                        var deadline = newEpoch;
                                        Server.sendNotificationThree(type, deadline, taskId).then(function(data){
                                            if(data.status == 200){
                                                $scope.setTaskLocal();
                                            }else{
                                                $ionicLoading.show({template: 'Server error, please try again', noBackdrop: true, duration: 1000});
                                            }
                                        });
                                }else{// display the error twice
                                    $ionicLoading.show({template: 'Server error, please try again', noBackdrop: true, duration: 1000});
                                }
                                
                            });
                        }
                    }
                }
            }

        }
        $scope.setTaskLocal = function(){
                       
            var newTask = (new TaskFact()).addTask(taskId, $scope.taskName, $scope.descrip, 
                    $scope.category, myDate, $scope.task.task_partner, null, $scope.task.task_evidenceType); // todo
            $rootScope.task_list[taskId] = newTask;
            localStorage.setItem('task_list', angular.toJson($rootScope.task_list));

            $ionicLoading.show({template: 'Task Saved!', noBackdrop: true, duration: 1000});
            $ionicViewSwitcher.nextDirection('back');
                        
            /*$timeout(function () {
                $state.go('tab.home', {});
            }, 1000);*/
            $state.go('tab.home');
        }
        $scope.editDeadline = function(){
            console.log('click');
            var editDeadlinePopup = $ionicPopup.confirm({
                title: 'Edit Deadline',
                template: 'You need viewer\'s permission to edit the deadline and a notification of deadline edit will be sent automatically. Do you want to continue?'
            });

            editDeadlinePopup.then(function(res) {
                if (res) {
                    document.getElementById('time-textarea').style.display = "none";
                    document.getElementById('time-input').style.display = "block";
                    changeTime = true;
// TODO: send notification
// how to indicate the deadline is under pending: set the mark?
                    console.log("need send notification function");
                } else {
                    console.log('canecel');
                }
            });
        }
    })

    .controller('ViewTaskCtrl', function ($scope, $state, $stateParams, $ionicViewSwitcher, $ionicPopup, $rootScope, EvidenceTypes) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $scope.task = $stateParams.task;
            $scope.title = "View";
            if($scope.task.task_category == null || $scope.task.task_category == ''){
                document.getElementById('category-textarea').value = 'None';
            }
            $scope.evidenceType = EvidenceTypes.get($scope.task.task_evidenceType);
            $scope.evidenceTypeName = $scope.evidenceType.name;
            if($scope.task.task_partner != null){
                $scope.viewer = $scope.task.task_partner.friend_name;
            }else{
                $scope.viewer = "No Viewer";
            }
        });

        
        $scope.onSubmit = function(task) {
            $ionicViewSwitcher.nextDirection('forward');
            $state.go('editTask', {task: task});
        }
        
        $scope.onComplete = function(){
            if($scope.evidenceType.evidenceTypeId == 0){
                $state.go('camera', {task: $scope.task});
            }
            if($scope.evidenceType.evidenceTypeId == 1){
                $state.go('map', {task: $scope.task});
            }
        }
        $rootScope.category_list = angular.fromJson(localStorage.getItem('category_list'));
    })

    .controller('FtasksCtrl', function ($scope, Ftasks, $ionicLoading, $state, $rootScope) {
        //$ionicLoading.show({template: 'No friends\' Tasks found', noBackdrop: true, duration: 2500});
        console.log("FtasksCtrl", $rootScope.viewTask_list);
        $scope.goDetail = function(task){
            $state.go('viewFTask', {task: task});
        }

        if($rootScope.sorting != null)
        $scope.sorting = $rootScope.sorting;
        else
            $scope.sorting = "";



        $scope.doSorting = function() {
            var elem_type = document.getElementById('sorting-select');
            var sort_type = elem_type.options[elem_type.selectedIndex].value;

            console.log(sort_type);

            if (sort_type == "Due Date") {
                $scope.sorting = "task_time";
            }
            else if (sort_type == "Category") {
                $scope.sorting = "task_category";
                console.log("here");
            }
            else {
                $scope.sorting = "task_name";
            }
            $rootScope.sorting = $scope.sorting;
        };
    })
    .controller('NotifCtrl', function ($scope, $stateParams, $state, $ionicPopup, $ionicLoading, Server, $rootScope) {
        $scope.fakegoNotifDetail = function(currentNotif){
            var notif = currentNotif;
            var type = notif.notif_type;
            $scope.decisionPopup(notif);
        }
        $scope.decisionPopup = function(notif){
            var text = '';
            var title = '';
            switch(notif.notif_type){
                case(3):
                    text = 'Do you want to permit the deadline extension?';
                    title = 'Permission';
                    break;
                case(5):
                    text = 'Do you want to permit the deadline extension?';
                    title = 'Permission';
                    break;
                default:
                    break;
            }
            if(notif.notif_type == 3){
                
            }
            if(notif.notif_type == 5){
                text = 'Do you want to view on the task?';
                title = 'Invitation';
            }
            var myPopup = $ionicPopup.show({
                template: text,
                title: title,
                scope: $scope,
                    
                buttons: [
                    { text: 'Decline',
                        onTap: function(e) {
                            $scope.sendNotification(notif, false);
                        } 
                    }, {
                    text: 'Accept',
                    type: 'button-positive',
                        onTap: function(e) {
                            $scope.sendNotification(notif, true);
                        }
                    }
                ]
            });

            myPopup.then(function(res) {
            });    
        }
// todooo
        $scope.sendNotification = function(notif, decision){
            Server.decideOnInvite(notif.notif_notificationId, decision).then(function(data){
                if(data.status == 200){
                    // succeed
                    delete $rootScope.notif_list[notif.notif_notificationId];
                }else{
                    $ionicLoading.show({template: data.data.errMsg, noBackdrop: true, duration: 1000});
                }
            });
        }
    })
    .controller('FriendsCtrl', function ($scope, Friends, $stateParams, $rootScope, ngFB, Server, $ionicLoading) {
        
        //$scope.friends = Friends.all();
        $scope.$on("$ionicView.beforeEnter", function () {
            
        });
        $scope.turnStar = function (index) {
            //console.log("You turn star");
            var star = "icon ion-ios-star";
            var starOutline = "icon ion-ios-star-outline";
            var starStatus = document.getElementById("starRate" + index).className;
            if(starStatus == star){
                document.getElementById("starRate" + index).className = starOutline;
            }
            if(starStatus == starOutline){
                document.getElementById("starRate" + index).className = star;
            }
        }
    })

    .controller('SettingsCtrl', function ($rootScope, $scope, $ionicModal, $ionicLoading, $ionicViewSwitcher, $state) {

        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });
    })
    
    .controller('LogoutCtrl', function ($scope,$ionicHistory,$state) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        });

    })
    .controller('ManageCategoriesCtrl', function ($scope, $state, $rootScope, Categories, Server, $ionicLoading) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            // populate the category list
            $rootScope.category_list = {};
            
            var categoryHold = angular.fromJson(localStorage.getItem('category_list'));
            console.log(localStorage.getItem('category_list'));
            if (categoryHold != null) {
                $rootScope.category_list = categoryHold;
            }
            
        })
        
        $scope.addCategory = function(name){
            Server.addCategory(name).then(function(data){
                if (data.status == 400) {
                    var errMsg =  data.data.errorMsg + ": "  + "category";
                    $ionicLoading.show({template: errMsg, noBackdrop: true, duration: 1000});
                } else {
                    var newCategory = (new Categories()).addCategory(data.data.categoryId, name);
                    $rootScope.category_list[data.data.categoryId] = newCategory;
                    document.getElementById('categoryName-textarea').value = '';
                }
            });
        }
        
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

    })

    .controller('LoginCtrl', function ($scope, $state, $ionicModal, $cordovaLocalNotification, $ionicPlatform, $timeout, ngFB, $ionicHistory, $http, ApiEndpoint, Server, $ionicPopup, $rootScope, $ionicLoading) {
        /*
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
        })
        */ 
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            $ionicHistory.clearCache();
            $ionicHistory.clearHistory();
        });

        $scope.fbLogin = function () {
            var runningInCordova = false;
            document.addEventListener("deviceready", function () {
                var runningInCordova = true;
            }, false);
            ngFB.login({scope: 'email,user_posts, publish_actions, user_friends'}).then(
                function (response) {
                    if (response.status === 'connected') {
                        localStorage.setItem('login', 'true');
                        localStorage.setItem('fbAccessToken', response.authResponse.accessToken);
                        
												FCMPlugin.getToken(
        									function (token) {
													localStorage.setItem('fcmId', token);
        								},
        								function (err) {
        									alert('error retrieving FCM token: ' + err);
      									});

                        ngFB.api({
                            path: '/me',
                            params: {fields: 'id,name'}
                        }).then(
                            function (user) {
                                localStorage.setItem('user', user.name);
                                $rootScope.userFBId = user.id;
                                console.log(JSON.stringify(user));
                                var userId; // user's De-Crast Id
                                var accessToken;
                                // user facebookId to login user
                                Server.loginUser(user.id).then(function(data) {
                                    console.log(JSON.stringify(data));
                                    userId = data.data.userId;
                                    accessToken = data.data.accessToken;
                                    console.log("test response username\n", JSON.stringify(data.data.username));
                                    localStorage.setItem('userId', userId);
                                    localStorage.setItem('accessToken', accessToken);
                                    if(data.data.username != null){
                                        console.log(data.data.username);
                                        localStorage.setItem('user', data.data.username);
                                        $state.go('tab.home');
                                    }else{
                                        $state.go('setUsername');
                                    }
                                });
                            },
                            function (error) {
                                alert('Facebook error: ' + error.error_description);
                            });

                        console.log('Facebook login succeeded');
                        if (runningInCordova) {
                            $scope.closeLogin();
                        }
                    } else {
                        alert('Facebook login failed');
                    }
                });
            
        };

    })

    .controller('BackCtrl', function ($state, $ionicViewSwitcher, $scope, $ionicHistory) {
        $scope.onClick = function() {
            $ionicViewSwitcher.nextDirection('back');
            $ionicHistory.goBack();

        }
    })
    .controller('setUsernameCtrl', function ($state, $ionicViewSwitcher, $scope, $ionicHistory, Server, $ionicLoading) {
        $scope.onClick = function() {
            $ionicViewSwitcher.nextDirection('back');
            $ionicHistory.goBack();
            console.log()
        }
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            $scope.username = localStorage.getItem('user');
            $scope.username = $scope.username.toLowerCase();
            $scope.username = $scope.username.replace(" ", "_");
        });
        $scope.setUsername = function(){
            $scope.username = document.getElementById('DCname').value;
            console.log($scope.username);
            if($scope.checkCharacter($scope.username)){
                Server.changeUsername($scope.username, 
localStorage.getItem('fcmId')).then(function(data) {
                    console.log(JSON.stringify(data));
                    if (data.data.errorCode == 190)
                        $ionicLoading.show({template: "username already exists", noBackdrop: true, duration: 2500});
                    else {
                        // may need to be put in the server                
                        localStorage.setItem('user', $scope.username);
                        $state.go('tab.home');
                    }
                });
            }else{
                $ionicLoading.show({template: "Only digits, characters and underscores are allowed", noBackdrop: true, duration: 2500});
            }
            
        }

        $scope.checkCharacter = function(username){
            for(i = 0; i < username.length; i++){
                console.log(username[i]);
                if(!username[i].match(/[A-Za-z0-9_]/)){
                    return false;
                }
            }
            return true;
        }
    })
    .controller('mapCtrl', function ($state, $stateParams, $ionicViewSwitcher, $scope, $ionicHistory, $cordovaGeolocation, $ionicLoading, Server) {

        $scope.onClick = function() {
            $ionicViewSwitcher.nextDirection('back');
            $ionicHistory.goBack();
        }
        $scope.task = $stateParams.task;
        $scope.taskId = $scope.task.task_id;

        var options = {timeout: 10000, enableHighAccuracy: true};
        var latLng;
 
        $cordovaGeolocation.getCurrentPosition(options).then(function(position){
        
            latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            var mapOptions = {
                center: latLng,
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            
            $scope.map = new google.maps.Map(document.getElementById('map'), mapOptions);
            
            google.maps.event.addListenerOnce($scope.map, 'idle', function(){
                var marker = new google.maps.Marker({
                    map: $scope.map,
                    animation: google.maps.Animation.DROP,
                    position: latLng
                });
                $scope.getAddressFromLatLang(latLng, $scope.map, marker);
            });

        }, function(error){
            $ionicLoading.show({template: "Could not get location, please check your GPS setting and try again", noBackdrop: true, duration: 1000});
        });

        $scope.getAddressFromLatLang = function(latLng, map, marker){
            var geocoder = new google.maps.Geocoder();

            geocoder.geocode({'latLng': latLng}, function(results, status){
                //console.log(JSON.stringify(results));
                if(status == google.maps.GeocoderStatus.OK){
                    if(results[1]){
                        var infowindow = new google.maps.InfoWindow();
                        infowindow.setOptions({
                            content: '<div>' + results[1].formatted_address + '</div>',
                        });
                        infowindow.open(map, marker);
                    }
                }else{
                    alert("error", JSON.stringify(status));
                }
            })
        };

        $scope.confirmGPS = function(){
            var coordinates = '(' + latLng.lat() + ',' + latLng.lng() + ')';
            console.log("Map post coordinates", coordinates);
// This server is not function correctly            
            Server.submitGPS($scope.taskId, coordinates).then(function(data){
                $ionicHistory.goBack(2);
            });
        }

    })
    .controller('cameraCtrl', function($rootScope, $state, $ionicViewSwitcher, $scope, $ionicLoading, $ionicHistory, $cordovaCamera, $stateParams, Server) {

        $scope.task = $stateParams.task;
        $scope.taskId = $scope.task.task_id;
        $scope.image = null;

        $scope.takePicture = function() {
            var options = {
                quality : 75,
                destinationType : Camera.DestinationType.DATA_URL,
                sourceType : Camera.PictureSourceType.CAMERA,
                allowEdit : false,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 300,
                targetHeight: 300,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: true
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                $scope.imgURI = "data:image/jpeg;base64," + imageData;
                $scope.image = imageData;
            }, function(err) {
                // An error occured. Show a message to the user
            });
        };

        //not functioning yet
        $scope.submitPhoto = function() {

            Server.submitPhoto($scope.taskId, $scope.image);
            $ionicLoading.show({template: 'Function called!', noBackdrop: true, duration: 1000});

            $state.go('home');

        };
    })
    .controller('selectViewerCtrl', function ($stateParams, $rootScope, $state, $ionicViewSwitcher, $scope, $ionicHistory) {
        $scope.onClick = function() {
            $ionicViewSwitcher.nextDirection('back');
            // $ionicHistory.goBack();   
        }
        
        var selectedViewer;
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            $rootScope.friend_list = angular.fromJson(localStorage.getItem('friend_list'));
            $scope.task = $stateParams.task;
        });
        $scope.changeViewer = function(viewer){
            selectedViewer = viewer;
        };
        $scope.data = {
            clientSide: 'ng'
        };
        $scope.confirmViewer = function(){
            localStorage.setItem('selectedViewer', angular.toJson(selectedViewer));
            $ionicHistory.goBack();
        }
    })
    .controller('notifDetailCtrl', function ($state, $ionicViewSwitcher, $scope, $ionicHistory, $stateParams, Server, $rootScope) {
        $scope.onClick = function() {
            $ionicViewSwitcher.nextDirection('back');
            $ionicHistory.goBack();
        }
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $scope.notif = $stateParams.notif;
            console.log($scope.notif);
            Server.getTask($scope.notif.notif_task).then(function(data){
                if(data.status == 200){
                    $scope.task = data.data;
                    console.log("connected to server");
                }else{
                    console.log("fail to connect to the server");
                }
            });
        });
        
        $scope.onDecision = function(decisionInt){
            console.log("You make a decision");
            var decision;
            if(decisionInt == 0){
                decision = false;
            }else{
                decision = true;
            }
            switch($scope.notif.notif_type){
                case 5: // viewer invite
                    console.log("It's a viewer invite");
                    Server.decideOnInvite($scope.notif.notif_notificationId, decision).then(function(data){
                        if(data.status == 200){
                            // succeed
                            delete $rootScope.notif_list[$scope.notif.notif_notificationId];
                            $state.go('tab.notif');
                        }
                    });
                    break;
                default:
                    console.log("notification type falls into default case");
            }
        }
    })
    .controller('viewFTaskCtrl', function ($scope, $state, $stateParams, $ionicViewSwitcher, $ionicPopup, $rootScope, EvidenceTypes, Server) {
        $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
            viewData.enableBack = true;
            $scope.task = $stateParams.task;
            $scope.title = "View Friend's Task";
            $scope.evidenceType = EvidenceTypes.get($scope.task.task_evidenceType);
            $scope.evidenceTypeName = $scope.evidenceType.name;
            $scope.viewer = $rootScope.friend_list[$scope.task.task_partner].friend_name;
            $scope.checkCompletion($scope.task.task_id);
        });

        $scope.checkCompletion = function(taskId){
            Server.getEvidence(taskId).then(function(data){
                if(data.data.file == null){
                    $scope.complete = "Not Complete";
                }else{
                    $scope.complete = "Complete";
                    // document.getElementById('getEvidence-button').classList.add("button-positive");
                }
            });
        }


    })

/* localStorage List:
"userId", decrastId
"userFBId", FBId
"login", true/false
'fbAccessToken'
"user", username, default FB name, specify on De-Crast name
"task_list"
"friend_list"
*/

/* issue on UTC:
The epoch sent to server should add 5 hours
The epoch get from the server minus 5 hours
store the minus five hr UTC to the localstorage of task
*/