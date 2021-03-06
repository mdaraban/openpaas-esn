'use strict';

var q = require('q');
var _ = require('lodash');
var features = require('../features');
var Features = require('mongoose').model('Features');
var CONFIGURATIONS = 'configurations';

function _findConfigForDomain(domainId) {
  return q.ninvoke(features, 'findFeaturesForDomain', domainId)
    .then(function(feature) {
      if (!feature) {
        return q.reject(new Error('Feature not found for domain: ' + domainId));
      }

      var configurations = _.find(feature.modules, { name: CONFIGURATIONS });

      if (!configurations || !configurations.features) {
        return q.reject(new Error('Configurations not found for domain: ' + domainId));
      }

      return configurations.features;
    });
}

function getAllConfigs(configName) {
  return q.ninvoke(features, 'getAllFeatures')
    .then(function(features) {
      if (!features) {
        return q.reject(new Error('Feature not found'));
      }
      return features.map(function(feature) {
        var configurations = _.find(feature.modules, { name: CONFIGURATIONS });

        if (configurations && configurations.features) {
          var config = _.find(configurations.features, { name: configName });

          if (config && config.value) {
            return config.value;
          }
        }
      }).filter(Boolean);
    });
}

function get(domainId, configNames) {
  return _findConfigForDomain(domainId).then(function(configurations) {
    if (_.isArray(configNames)) {
      return configNames.map(function(configName) {
        return _.find(configurations, { name: configName });
      }).filter(Boolean);
    }

    var config = _.find(configurations, { name: configNames });

    if (!config || !config.value) {
      return q.reject(new Error('No configuration found for type: ' + configNames));
    }

    return config.value;
  });
}

function set(domainId, configs) {
  return q.ninvoke(features, 'findFeaturesForDomain', domainId)
    .then(function(feature) {
      var configModuleTemplate = {
        name: 'configurations',
        features: []
      };

      feature = feature || new Features({
        domain_id: domainId,
        modules: [configModuleTemplate]
      });

      var configModule = _.find(feature.modules, { name: CONFIGURATIONS });

      if (!configModule) {
        feature.modules.push(configModuleTemplate);
        configModule = _.find(feature.modules, { name: CONFIGURATIONS });
      }

      configs.forEach(function(config) {
        var conf = _.find(configModule.features, { name: config.name });

        if (conf) {
          conf.value = config.value;
        } else {
          configModule.features.push(config);
        }
      });

      return q.ninvoke(features, 'updateFeatures', feature)
        .then(function() {
          return configs;
        });
    });
}

module.exports = {
  get: get,
  set: set,
  getAllConfigs: getAllConfigs
};
