'use strict';

angular.module('myApp.pdfProcess', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/create-flip-book', {
    templateUrl: 'pdfUpload/index.html',
    controller: 'PdfUploadCtrl'
  });
  $routeProvider.when('/edit-flip-book/:id', {
    templateUrl: 'pdfUpload/index.html',
    controller: 'PdfUploadCtrl'
  });
}])

.controller('PdfUploadCtrl', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

  $scope.file = null;
  $scope.audioFile = null;
  $scope.videoFile = null;
  $scope.totalPageNum = 0;
  $scope.currentPageNum = 0;
  $scope.flipBook = null;
  $scope.pdfData = null;
  $scope.bgAudioFile = null;
  $scope.pageAudioFile = null;
  $scope.bgAudio = null;
  $scope.pageAudios = [];

  $scope.pdfId = $routeParams.id;

  $scope.pageAudioObj = new Audio();

  $scope.init = function () {
    if ($scope.pdfId) {
      let req = {
        method: 'GET',
        url: 'http://52.53.215.21:3002/pdf/' + $scope.pdfId
      };
  
      $http(req).then(function (res) {
        $scope.pdfData = res.data;
        $scope.renderFlipPage('http://52.53.215.21:3002/' + $scope.pdfData.url);
      }, function () {
  
      })
  
      let req2 = {
        method: 'GET',
        url: 'http://52.53.215.21:3002/pdf-audios/' + $scope.pdfId
      };
  
      $http(req2).then(function (res) {
        $scope.bgAudio = res.data.bgAudio;
        $scope.pageAudios = res.data.pageAudios;

        // if ($scope.bgAudio) {
        //   let audioObj = new Audio("http://52.53.215.21:3002/audio/" + $scope.bgAudio.url);
        //   audioObj.play();
        // }
      }, function () {
  
      })
    }
  }

  $scope.init();

  $scope.changeFile = function (el) {
    $scope.file = el.files[0];
    console.log($scope.file);
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
      $scope.pdfData = res.data;
      $scope.renderFlipPage('http://52.53.215.21:3002/' + $scope.pdfData.url);
     }, function(){
       
     });
  }

  $scope.changeBackgroundAudioFile = function (el) {
    $scope.bgAudioFile = el.files[0];
  }

  $scope.changePageAudioFile = function (el) {
    $scope.pageAudioFile = el.files[0];
  }

  $scope.uploadAudioFile = function (type) {
    console.log('submit');
    let formdata = new FormData();

    if (!$scope.pdfData || !$scope.pdfData._id) {
      alert("need to upload pdf first");
      return;
    }

    if (type == 0 && !$scope.bgAudioFile) {
      alert('Select Audio File First');
      return;
    }

    if (type == 1 && !$scope.pageAudioFile) {
      alert('Select Audio File First');
      return;
    }

    if (type == 0) {
      formdata.append('file', $scope.bgAudioFile);
    } else {
      formdata.append('file', $scope.pageAudioFile);
      formdata.append('pageNum', $scope.currentPageNum);
    }
    formdata.append('type', type);
    formdata.append('pdfId', $scope.pdfData._id);

    var req = {
      method: 'POST',
      url: 'http://52.53.215.21:3002/upload-audio',
      headers: {
        'Content-Type': undefined
      },
      data: formdata
     }
     
     $http(req).then(function(res){
       if (type == 0) {
        $scope.bgAudio = res.data;
       } else {
        let item = $scope.pageAudios.find(it => it.pageNum == $scope.currentPageNum);
        if (item) {
          let index = $scope.pageAudios.indexOf(item);
          $scope.pageAudios[index] = res.data;
        } else {
          $scope.pageAudios.push(res.data);
        }
       }
     }, function(){
       
     });
  }

  $scope.publishPdf = function () {
    if (!$scope.pdfData || !$scope.pdfData._id) {
      alert("need to upload pdf first");
      return;
    }

    let formdata = new FormData();
    formdata.append('published', !!!$scope.pdfData.published);

    var req = {
      method: 'POST',
      url: 'http://52.53.215.21:3002/publish-pdf/' + $scope.pdfData._id,
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        published: !!!$scope.pdfData.published
      }
     }
     
     $http(req).then(function(res){
      $scope.pdfData = res.data;
      window.location = '#!/view';
     }, function(){
       
     });
  }
  
  $scope.deleteAudio = (item) => {
    var req = {
      method: 'DELETE',
      url: 'http://52.53.215.21:3002/delete-audio/' + item._id,
    }

    $http(req).then(function (res) {
      if (item.type == 0) {
        $scope.bgAudio = null;
      } else {
        let index = $scope.pageAudios.indexOf(item);
        $scope.pageAudios.splice(index, 1);
      }
    }, function () {

    })
  }

  $scope.getPdfImages = (url) => {
    let promiseAll = [];

    return new Promise((resolve, reject) => {
        pdfjsLib.getDocument(url).promise.then(loadedPdf => {
            if (loadedPdf && loadedPdf.numPages) {
                for (let i = 0; i < loadedPdf.numPages; i++) {
                    promiseAll.push(loadedPdf.getPage(i + 1));
                }

                Promise.all(promiseAll).then(pages => {
                    let canvases = [];

                    for (let j = 0; j < pages.length; j++) {
                        let page = pages[j];

                        const viewport = page.getViewport({ scale: 1.5 });
                        const canvas = document.createElement('canvas');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        const renderContext = {
                            canvasContext: canvas.getContext('2d'),
                            viewport: viewport
                        };
                        const div = document.createElement('div');
                        div.className = "page";
                        div.appendChild(canvas);

                        const shadow = document.createElement('div');
                        shadow.className = "shadow";
                        div.appendChild(shadow);

                        canvases.push(div);

                        page.render(renderContext);
                    }
                    resolve({canvases, totalPageNum: loadedPdf.numPages});
                }, function (reason) {
                    reject(reason);
                })
            }
        }, function (reason) {
            console.error(reason);
            reject(reason);
        });
    })
  }

  $scope.renderFlipPage = (url) => {
    $scope.getPdfImages(url).then(data => {
      $scope.totalPageNum = data.totalPageNum;
      // if ($scope.flipBook) {
      //   $scope.flipBook.destroy();
          
        const flipPageRoot = document.createElement('div');
        flipPageRoot.id = "flip-book";

        let flipPageWrapperElement = document.getElementById("flip-book-wrapper");
        flipPageWrapperElement.prepend(flipPageRoot);
      // }
      $scope.flipBook = new St.PageFlip(document.getElementById('flip-book'),
          {
              width: 300, // required parameter - base page width
              height: 500,  // required parameter - base page height
              showCover: true
          }
      );

      if (data.canvases && data.canvases.length) {
        $scope.flipBook.loadFromHTML(data.canvases);
        $scope.flipBook.on('flip', (e) => {
            $scope.currentPageNum = e.data;
            $scope.$apply();
            console.log($scope.currentPageNum);

            let pageAudio = $scope.pageAudios.find(it => it.pageNum == e.data);
            if ($scope.pageAudioObj.readyState != 0)
            $scope.pageAudioObj.pause();

            if (pageAudio) {
              $scope.pageAudioObj.src="http://52.53.215.21:3002/audio/" + pageAudio.url;
              $scope.pageAudioObj.play();
            }
            // audioObj.play();
        });
      }
    });
  }
}]);