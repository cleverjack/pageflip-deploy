'use strict';

angular.module('myApp.view', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view', {
    templateUrl: 'view/view.html',
    controller: 'ViewCtrl'
  });
}])

.controller('ViewCtrl', ['$scope', '$http', function($scope, $http) {

  $scope.file = null;
  $scope.audioFile = null;
  $scope.videoFile = null;

  $scope.pdfFiles = [];
  $scope.audio = null;
  $scope.videos = [];

  $scope.init = function () {
    let req = {
      method: 'GET',
      url: 'http://52.53.215.21:3002'
    };

    $http(req).then(function (res) {
      $scope.pdfFiles = res.data;
    }, function () {

    })

    let req2 = {
      method: 'GET',
      url: 'http://52.53.215.21:3002/get-audio'
    };

    $http(req2).then(function (res) {
      $scope.audio = res.data;
    }, function () {

    })
    
    let req3 = {
      method: 'GET',
      url: 'http://52.53.215.21:3002/videos'
    };

    $http(req3).then(function (res) {
      $scope.videos = res.data;
    }, function () {

    })
  }

  $scope.init();

  $scope.changeFile = function (el) {
    $scope.file = el.files[0];
    console.log($scope.file);
  }

  $scope.changeAudioFile = function (el) {
    $scope.audioFile = el.files[0];
  }

  $scope.changeVideoFile = function (el) {
    $scope.videoFile = el.files[0];
  }

  $scope.uploadFile = function () {
    console.log('submit');
    let formdata = new FormData();

    if (!$scope.file) {
      alert('Select PDF File First');
      return;
    }

    formdata.append('file', $scope.file);

    var req = {
      method: 'POST',
      url: 'http://52.53.215.21:3002/upload',
      headers: {
        'Content-Type': undefined
      },
      data: formdata
     }
     
     $http(req).then(function(res){
      $scope.pdfFiles.push(res.data);
     }, function(){
       
     });
  }

  $scope.uploadAudioFile = function () {
    console.log('submit');
    let formdata = new FormData();

    if (!$scope.audioFile) {
      alert('Select Audio File First');
      return;
    }

    formdata.append('file', $scope.audioFile);

    var req = {
      method: 'POST',
      url: 'http://52.53.215.21:3002/upload-audio',
      headers: {
        'Content-Type': undefined
      },
      data: formdata
     }
     
     $http(req).then(function(res){
      $scope.audio = res.data;
     }, function(){
       
     });
  }

  $scope.uploadVideoFile = function () {
    console.log('submit');
    let formdata = new FormData();

    if (!$scope.videoFile) {
      alert('Select Video File First');
      return;
    }

    formdata.append('file', $scope.videoFile);

    var req = {
      method: 'POST',
      url: 'http://52.53.215.21:3002/upload-video',
      headers: {
        'Content-Type': undefined
      },
      data: formdata
     }
     
     $http(req).then(function(res){
      $scope.videos.push(res.data);
     }, function(){
       
     });
  }

  $scope.deletePdf = function (file) {
    var req = {
      method: 'DELETE',
      url: 'http://52.53.215.21:3002/delete-pdf/' + file._id,
    }

    $http(req).then(function (res) {
      let index = $scope.pdfFiles.indexOf(file);
      $scope.pdfFiles.splice(index, 1);
    }, function () {

    })
  }

  $scope.deleteVideo = function (video) {
    var req = {
      method: 'DELETE',
      url: 'http://52.53.215.21:3002/delete-video/' + video._id
    }

    $http(req).then(function (res) {
      let index = $scope.videos.indexOf(video);
      $scope.videos.splice(index, 1);
    }, function () {

    })
  }

  $scope.createFlipBook = function () {
  }
}]);