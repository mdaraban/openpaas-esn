'use strict';

function isValidLink(link) {
  return (link.target && link.target.objectType && link.target.id && link.source && link.source.objectType && link.source.id && link.type);
}
module.exports.isValidLink = isValidLink;
