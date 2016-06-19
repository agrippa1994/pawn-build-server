var app = angular.module("app", ["ngSanitize"]);

app.controller("controller", function($scope, $http) {
    $scope.builds = [];
    
    $http.get("/builds").then(
        function(response) { 
            $scope.builds = response.data; 
            console.log(response); 
        },
        function(error) { alert("An error occured while loading builds"); }
    );
    
    $scope.showStderr = function(build) {
        $scope.modalHeader = "Warnings and Errors";
        $scope.modalData = build.stderr.replace(/^(.*)\/.*\.pwn/gim, "Line ").replace(/\r/g, "").replace(/\n/g, "</br>");
    };

    $scope.showStdout= function(build) {
        $scope.modalHeader = "Compiler-Output";
        $scope.modalData = build.stdout.replace(/\r/g, "").replace(/\n/g, "</br>");
    };

    $scope.generateTableRowColor = function(build) {
        if(build.code == 0) {
            if(build.stderr.length == 0)
                return "success";
            else
                return "warning";
        } else
            return "danger";
    };
});
