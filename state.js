(function exposeGameState() {
  const GAME_STATE = {
    EXPLORE: "EXPLORE_STATE",
    COMBAT: "COMBAT_STATE",
    BOSS_INTRO: "BOSS_INTRO_STATE",
    PORTAL_TRANSIT: "PORTAL_TRANSIT_STATE",
    GAME_OVER: "GAME_OVER_STATE",
  };

  function createGameStateStore(initialState) {
    let currentState = initialState || GAME_STATE.EXPLORE;
    const listeners = [];

    function getState() {
      return currentState;
    }

    function setState(nextState, payload) {
      if (!nextState || nextState === currentState) {
        return currentState;
      }
      const previousState = currentState;
      currentState = nextState;
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

    return {
      getState: getState,
      setState: setState,
      matches: matches,
      subscribe: subscribe,
    };
  }

  window.GameStateStore = {
    GAME_STATE: GAME_STATE,
    createGameStateStore: createGameStateStore,
  };
})();
