function mainController($window, $scope, $http){
    console.log("hello auth contr");
    $scope.formData = {};

    var self = this;

/*
    self.parseJwt = function(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse($window.atob(base64));
    };
    function authService($window) {
        var self = this;

        // Add JWT methods here
        self.saveToken = function(token) {
            $scope.localStorage['jwtToken'] = token;
        };

        self.getToken = function() {
            return $window.localStorage['jwtToken'];
        }
    }
*/

/*
    function loadConnections(req, res) {
        getConnections(req.user)
            .then(function(results){
                console.log('here');
                console.log(results);
                console.log(results.length);

                var returnObject = {}
                returnObject.count = results.length;
                //returnObject.results = results[0]; // PROBLEM LINE
                res.status(200).send(returnObject);
            });
    }
*/

    $scope.checkUser = function () {
        $scope.formData =  {
            name: self.name,
            password: self.password};
        $http.post('/auth', $scope.formData).success(function (data) {
                self.name = "";
                self.password = "";
                self.message = "";
                $scope.formData = {};
                self.token = data.token;
                localStorage.setItem('token', self.token + '' );
                console.log('redirect');
                $window.location.href = '/todos?token=' + self.token;
        }).error(function (data) {
            self.name = "";
            self.password = "";
            $scope.formData = {};
            console.log('Error: ' + data);
            self.message = data.message;
        });
    }
}