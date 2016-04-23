(function(window) {
  /**
   * Duck Namespace
   */
  window.duck = window.duck || {};

  /**
   * Calculate text patterns
   * @constructor
   * @param {string} str Text to match the pattern
   */
  duck.PatternMatcher = function(str) {
    this.str = str;
  };

  duck.PatternMatcher.prototype.toString = function() {
    return this.str;
  };

  duck.PatternMatcher.prototype.toClauses = function() {
    var clause, _i, _len, _ref, _results;
    _ref = this.str.split(this.clauseBoundryRegex());
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      clause = _ref[_i];
      _results.push(new duck.PatternMatcher(clause));
    }
    return _results;
  };

  duck.PatternMatcher.prototype.toLikelyNouns = function() {
    var found_nouns, match, noun, _i, _len, _ref;
    found_nouns = [];
    _ref = this.toClauses();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      match = _ref[_i];
      noun = match.findNoun();
      if (!this.disqualifyNoun(noun)) {
        found_nouns.push(noun);
      }
    }
    return found_nouns;
  };

  duck.PatternMatcher.prototype.findNoun = function() {
    var match;
    match = this.str.match(this.ownedItemRegex());
    if (match && match[1]) {
      return this.invertOwner(match[1]);
    }
    return false;
  };

  duck.PatternMatcher.prototype.invertOwner = function(noun) {
    return noun.replace(this.ownerRegex(), 'your ');
  };

  duck.PatternMatcher.prototype.ownerRegex = function() {
    return /(?: |^)(my|the|this|that|our|a|an) /i;
  };

  duck.PatternMatcher.prototype.ownedItemRegex = function() {
    return /(?: |^)((?:my|the|this|that|our|a|an) .+)/i;
  };

  duck.PatternMatcher.prototype.clauseBoundryRegex = function() {
    return /(?:\. |- |, | and | or | but | which | that | although | except | with | is | isn'?t | ain'?t | will | won'?t | can | can'?t | does | doesn'?t | are | aren'?t)/i;
  };

  duck.PatternMatcher.prototype.notNouns = function() {
    return /^(it|this|that|(?:my|this|the) app(?:lication)?)$/i;
  };

  duck.PatternMatcher.prototype.disqualifyNoun = function(noun) {
    if (!noun) {
      return true;
    }
    if (noun === '') {
      return true;
    }
    return noun.match(this.notNouns());
  };
})(typeof window == 'undefined' ? global : window);
