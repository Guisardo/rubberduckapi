(function(window) {
  /**
   * Duck Namespace
   */
  window.duck = window.duck || {};

  /**
   * State machine instance for duck answers
   * @constructor
   */
  duck.FitnessStateMachine = function() {
    this.history = {
      'firstQuestionAt': null,
      'lastAnswerAt': null,
      'questions': [],
      'answers': []
    };
    this.last_question = null;
    this.visited_states = [];
    this.current_state = false;
    this.what_it_does = null;
    this.potential_nouns = [];
    this.noun = null;

    //re-initialize from parameter
    if (arguments[0]) {
      for (var prop in arguments[0]) {
        this[prop] = arguments[0][prop];
      }
    }
  };

  /**
   * MachineAnswer constants
   * @param {string} code Constant code
   * @return {int} Constant id
   */
  duck.MachineAnswerTypes = function(code) {
    var _defTypes = [
      'reset',
      'choice',
      'short',
      'long'
    ];
    return _defTypes.indexOf(code);
  };

  /**
   * Machine state output interface
   * @param {string} next_question Next question
   * @param {MachineAnswerTypes} answer_type   Type of question
   * @param {function} options       Question options if any
   * @return {Object} Machine state filled
   */
  duck.MachineState = function(next_question, answer_type, options) {
    options = options || function() { return null; };
    return {
      'next_question': next_question,
      'answer_type': answer_type,
      'options': options()
    };
  };

  /**
   * Build the report of the dialog
   * @return {Object} Dialog information
   */
  duck.FitnessStateMachine.prototype.getReport = function() {
    var _QA = [];
    for (var i = 0; i < this.history.questions.length; i++) {
      _QA.push('Q:' + this.history.questions[i]);
      if (this.history.answers.length > i) {
        _QA.push('A:' + this.history.answers[i]);
      }
    }
    return {
      'start_time': this.history.firstQuestionAt,
      'last_time': this.history.lastAnswerAt,
      'dialog': _QA
    };
  };

  /**
   * Calculate next state
   * @param  {string} answer current answer
   * @return {MachineState}        next options
   */
  duck.FitnessStateMachine.prototype.getNext = function(answer) {
    var state, _i, _len, _ref;
    var out = duck.MachineState(
      'Sorry, my super-duck-powers have failed.' +
          ' Have you tried google or stack overflow?',
      'reset'
    );
    if (this.current_state !== false && (!answer || answer === '')) {
      out = this.last_question;
    } else {
      _ref = this.listStates(answer);
      if (this.current_state !== false) {
        this.history.answers.push(answer);
        this.history.lastAnswerAt = new Date();
        _ref[this.current_state].post_action();
      } else {
        this.history.firstQuestionAt = new Date();
      }
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        state = _ref[_i];
        if (state.qualifies()) {
          this.current_state = _i;
          this.visited_states.push(state.name);
          state.pre_action();
          out = duck.MachineState(
            state.question(),
            state.answer_type,
            state.options
          );
          break;
        }
      }
      this.history.questions.push(out.next_question);
      this.last_question = out;
    }
    return out;
  };

  /**
   * List all posible states
   * @param {string} answer Last answer
   * @return {Array} List of states
   */
  duck.FitnessStateMachine.prototype.listStates = function(answer) {
    var _that = this;
    return [
      {
        'qualifies': function() {
          return _that.visited_states.length === 0;
        },
        'pre_action': function() {},
        'post_action': function() {
          var pattern;
          pattern = new duck.PatternMatcher(answer);
          return _that.potential_nouns = pattern.toLikelyNouns();
        },
        'question': function() {
          return 'Can you describe the problem in a paragraph?' +
              ' Please use small sentences, I\'m only a duck.';
        },
        'answer_type': duck.MachineAnswerTypes('long')
      }, {
        'name': 'is it this one?',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.potential_nouns.length === 1;
        },
        'pre_action': function() {
          return _that.noun = _that.potential_nouns[0];
        },
        'post_action': function() {
          if (answer === 'no') {
            return _that.noun = null;
          }
        },
        'question': function() {
          return 'Is ' + _that.noun + ' the thing that has the problem?';
        },
        'answer_type': duck.MachineAnswerTypes('choice'),
        'options': function() {
          return ['yes', 'no'];
        }
      }, {
        'name': 'name your noun',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          _that.visited_states.length === 1 && _that.noun;
          return _that.potential_nouns.length > 1;
        },
        'pre_action': function() {},
        'post_action': function() {
          _that.noun = answer;
          if (_that.noun === 'none of the above') {
            return _that.noun = null;
          }
        },
        'question': function() {
          return 'Is the problematic object one of these?';
        },
        'answer_type': duck.MachineAnswerTypes('choice'),
        'options': function() {
          return _that.potential_nouns.sort(function(a, b) {
            return a.length - b.length;
          }).concat('none of the above');
        }
      }, {
        'qualifies': function() {
          return !_that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {
          if (answer && answer.trim() !== '') {
            return _that.noun = answer;
          }
        },
        'question': function() {
          return 'What should I call the function / object / thing' +
              ' that is misbehaving?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'what does it do?',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {
          return _that.what_it_does = answer;
        },
        'question': function() {
          return 'Can you explain what ' + _that.noun + ' does?';
        },
        'answer_type': duck.MachineAnswerTypes('long')
      }, {
        'name': 'what it does sounds complicated',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun && _that.what_it_does.length > 100;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'Wow, that sounds complicated. Any chance that ' +
              _that.noun + ' can be broken into smaller parts that' +
              ' you could test seperately?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'what it does sounds reasonable',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun && _that.what_it_does.length <= 100 &&
              _that.what_it_does.length > 30;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'So does it do just one thing? Any chance that ' +
              _that.noun + ', or parts of it, can be isolated' +
              ' and test seperately?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'what it does sounds short',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun && _that.what_it_does.length <= 30;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'Do you fully understand how it does what it does?' +
              ' Could you split ' + _that.noun + ' into smaller chunks?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'what is known',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'What parts of ' + _that.noun +
              ' are you certain work, and where are your \'unknowns\'?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'is it compiling',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'Is ' + _that.noun +
              ' being compiled? Can you restart the compiler?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'is it reusable',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'Is something similar to ' + _that.noun +
              ' being used elsewhere? Could common elements be shared?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'how is it modified',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'How is ' + _that.noun + ' modified?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'are vars overwritten',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'Could ' + _that.noun + ', or variables within it,' +
              ' be somehow overwritten or overridden?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'did you pack this bag yourself',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {},
        'question': function() {
          return 'Is everything in ' + _that.noun + ' your code?' +
              ' Could you replace uncertainties with debugging statements?';
        },
        'answer_type': duck.MachineAnswerTypes('short')
      }, {
        'name': 'why do you need it',
        'qualifies': function() {
          if (_that.visited_states.indexOf(this.name) !== -1) {
            return false;
          }
          return _that.noun;
        },
        'pre_action': function() {},
        'post_action': function() {
          return _that.what_it_does = answer;
        },
        'question': function() {
          return 'Why do you need ' + _that.noun + '?';
        },
        'answer_type': duck.MachineAnswerTypes('long')
      }
    ];
  };
})(typeof window == 'undefined' ? global : window);
