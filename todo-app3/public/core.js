function mainController($window,$scope, $http){
    console.log("hello from index page");
    $scope.formData = {};
    $scope.formData.token = $window.localStorage['token'];
    var isUpdate = {};
    var self = this;

   /* $http.post('/app', $scope.formData).success(function (data) {
        $scope.todos = data;
    });
    */
   // $http.get('/todos', $scope.formData);
    $scope.token =  $window.localStorage['token'];
    console.log('token ' + $scope.token );

    $http.get('/todos/load', {headers: {'x-access-token': $scope.token}} ).success(function (data) {
        console.log('sent req with get');
         $scope.todos = data;
         self.todos = data;
    });

  /*  $scope.init = function () {
        $http.get('/app', $scope.formData).success(function (data) {
            $scope.todos = data;
        });
    }
*/
  /*$http.get({url:'/', headers: {
        'token': $scope.token
    } }).success(function (data) {
        debugger;
        $scope.todos = data;
        $scope.token = token;
        console.log('index data: ' + data);
    }).error(function (data) {
        console.log('Error: ' + data);
    });*/

    $scope.createTodo = function () {
        if(isUpdate.forUpdate == true){
            console.log('text' + $scope.formData.text);
            console.log('update it please' + isUpdate.forUpdate);
            $scope.token =  $window.localStorage['token'];
            var headers = new Headers();
            $http.put('/app/' + isUpdate.id,{'token': $scope.token,'id': isUpdate.id, isUpdate: isUpdate.forUpdate, text: $scope.formData.text},{'headers': headers})
                .success(function (data) {
                    console.log('data' + data);
                    $scope.todos = data;
                   self.todos = data;
                    $scope.formData = '';
                    isUpdate = {};
                });
        }else {
            $scope.formData.token = $window.localStorage['token'];
            $http.post('/app', $scope.formData).success(function (data) {
                $scope.todos = data;
                self.todos = data;
                $scope.formData = '';
            }).error(function (data) {
                console.log('Error: ' + data);
            });
        }
    };
    $scope.deleteTodo = function(id){
        $scope.formData.token= $window.localStorage['token'];
        $scope.token= $window.localStorage['token'];
        $http.delete('/app/' + id ,{params: {'token': $scope.token,'id': id}}).success(function (data) {
            $scope.todos = data;
            self.todos = data;
        }).error(function (data) {
            console.log('Error: ' + data);
        })
    };
    $scope.updateTodo = function(id){
        $scope.token =  $window.localStorage['token'];
        var headers = new Headers();
        document.getElementById('input-for-todos').value = "YES";
        $http.put('/app/' + id,{'token': $scope.token,'id': id},{'headers': headers})
            .success(function (data) {
                console.log(data);
                document.getElementById('input-for-todos').value = data.text;
                isUpdate = {
                    forUpdate: true,
                    id: id
                };
                console.log(isUpdate);
            }).error(function (data) {
                console.log('Error: ' + data);
            })
    };
   /*$http.delete('/app:' + id +'?token=' +  $window.localStorage['token']).success(function (data) {});
   * */
    $scope.deleteTokenR = function () {
            localStorage.removeItem('token');
            $window.location.href = '/signup';
    };
    $scope.deleteTokenA = function (){
        localStorage.removeItem('token');
        $window.location.href = '/login';
    };
}