'use strict';

angular.module('linagora.esn.account')

  .factory('AccountRestangular', function(Restangular) {
    return Restangular.withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('/account/api');
      RestangularConfigurer.setFullResponse(true);
    });
  })

  .factory('accountService', function(AccountRestangular) {

    function getAccounts() {
      return AccountRestangular.all('accounts').getList();
    }

    return {
      getAccounts: getAccounts
    };

  });