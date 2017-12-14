function mainController($window,$scope, $http){
    console.log("Hello from registration controller");
    $scope.formData = {};

    var self = this;

    $http.get('/signup', $scope.formData);

    $scope.createUser = function () {
            $scope.formData = {
                name: self.name,
                password: self.password
            };
            $http.post('/registration', $scope.formData).success(function (data) {
                self.name = undefined;
                self.password = undefined;
                self.message = data.message;
                console.log(' $scope.formData.success ' + data.success );
                if(data.success  == true ) {
                    $scope.formData = {};
                     $window.location.href = '/auth';
                }
            }).error(function (data) {
                self.name = "";
                self.password = "";
                $scope.formData = {};
                console.log('Error: ' + data);
                self.message = data.message;
            });
    }
}