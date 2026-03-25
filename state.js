(function exposeGameState() {
  const GAME_STATE = {
    EXPLORE: "EXPLORE_STATE",
    COMBAT: "COMBAT_STATE",
    BOSS_INTRO: "BOSS_INTRO_STATE",
    PORTAL_TRANSIT: "PORTAL_TRANSIT_STATE",
    GAME_OVER: "GAME_OVER_STATE",
  };

  const DEFAULT_TRANSITIONS = {
    EXPLORE_STATE: ["COMBAT_STATE", "BOSS_INTRO_STATE", "PORTAL_TRANSIT_STATE", "GAME_OVER_STATE"],
    COMBAT_STATE: ["EXPLORE_STATE", "GAME_OVER_STATE"],
    BOSS_INTRO_STATE: ["COMBAT_STATE", "EXPLORE_STATE", "GAME_OVER_STATE"],
    PORTAL_TRANSIT_STATE: ["EXPLORE_STATE", "BOSS_INTRO_STATE", "GAME_OVER_STATE"],
    GAME_OVER_STATE: ["EXPLORE_STATE"],
  };

  function validateStateTransition(currentState, nextState, transitionRules) {
    const rules = transitionRules || DEFAULT_TRANSITIONS;
    const allowedTargets = rules[currentState] || [];
    const allowed = allowedTargets.indexOf(nextState) >= 0;
    return {
      from: currentState,
      to: nextState,
      allowed: allowed,
      reason: allowed ? "" : "非法状态切换：" + currentState + " -> " + nextState,
      allowedTargets: allowedTargets.slice(),
    };
  }

  function createGameStateStore(initialState) {
    let currentState = initialState || GAME_STATE.EXPLORE;
    const listeners = [];
    const invalidListeners = [];
    const transitionRules = Object.assign({}, DEFAULT_TRANSITIONS);
    const history = [
      {
        type: "init",
        state: currentState,
        timestamp: Date.now(),
      },
    ];

    function getState() {
      return currentState;
    }

    function canTransition(nextState) {
      return validateStateTransition(currentState, nextState, transitionRules).allowed;
    }

    function getAllowedTransitions(stateName) {
      const sourceState = stateName || currentState;
      return (transitionRules[sourceState] || []).slice();
    }

    function getHistory() {
      return history.slice();
    }

    function setState(nextState, payload) {
      if (!nextState || nextState === currentState) {
        return currentState;
      }
      const validation = validateStateTransition(currentState, nextState, transitionRules);
      if (!validation.allowed) {
        const invalidEvent = {
          type: "invalid",
          from: currentState,
          to: nextState,
          payload: payload || null,
          timestamp: Date.now(),
          reason: validation.reason,
          allowedTargets: validation.allowedTargets,
        };
        history.push(invalidEvent);
        invalidListeners.slice().forEach(function notify(listener) {
          listener(invalidEvent);
        });
        return currentState;
      }
      const previousState = currentState;
      currentState = nextState;
      history.push({
        type: "change",
        from: previousState,
        to: currentState,
        payload: payload || null,
        timestamp: Date.now(),
      });
      listeners.slice().forEach(function notify(listener) {
        listener(currentState, previousState, payload || null);
      });
      return currentState;
    }

    function matches(targetState) {
      return currentState === targetState;
    }

    function subscribe(listener) {
      if (typeof listener !== "function") {
        return function noop() {};
      }
      listeners.push(listener);
      return function unsubscribe() {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    }

    function subscribeInvalid(listener) {
      if (typeof listener !== "function") {
        return function noop() {};
      }
      invalidListeners.push(listener);
      return function unsubscribe() {
        const index = invalidListeners.indexOf(listener);
        if (index >= 0) {
          invalidListeners.splice(index, 1);
        }
      };
    }

    return {
      getState: getState,
      setState: setState,
      canTransition: canTransition,
      getAllowedTransitions: getAllowedTransitions,
      getHistory: getHistory,
      matches: matches,
      subscribe: subscribe,
      subscribeInvalid: subscribeInvalid,
    };
  }

  window.GameStateStore = {
    GAME_STATE: GAME_STATE,
    DEFAULT_TRANSITIONS: DEFAULT_TRANSITIONS,
    validateStateTransition: validateStateTransition,
    createGameStateStore: createGameStateStore,
  };
})();
