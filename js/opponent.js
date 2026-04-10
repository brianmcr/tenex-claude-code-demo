export const OPP_STATE = {
  IDLE: 'idle',
  TELEGRAPH: 'telegraph',
  ATTACK: 'attack',
  RECOVERY: 'recovery',
  STUNNED: 'stunned',
  DOWN: 'down',
};

export function createOpponent(config) {
  return {
    name: config.name,
    health: config.health,
    maxHealth: config.health,
    knockdowns: 0,

    state: OPP_STATE.IDLE,
    stateTimer: 0,

    patterns: config.patterns,
    currentPattern: null,
    patternIndex: 0,
    patternCooldown: 1.0,

    telegraphType: null,
    attackType: null,
    attackDirection: null,

    idleMinTime: config.idleMinTime || 1.0,
    idleMaxTime: config.idleMaxTime || 2.0,
    goldenParachute: config.goldenParachute || false,
    usedParachute: false,

    portrait: config.portrait || null,
    title: config.title || '',
    taunt: config.taunt || '',
    color: config.color || '#888',
  };
}

export function updateOpponent(opp, dt) {
  opp.stateTimer -= dt;

  if (opp.state === OPP_STATE.DOWN) return;

  if (opp.stateTimer <= 0) {
    switch (opp.state) {
      case OPP_STATE.IDLE:
        startNextPattern(opp);
        break;
      case OPP_STATE.TELEGRAPH:
        opp.state = OPP_STATE.ATTACK;
        opp.stateTimer = opp.currentPattern.attackDuration;
        break;
      case OPP_STATE.ATTACK:
        opp.state = OPP_STATE.RECOVERY;
        opp.stateTimer = opp.currentPattern.recoveryDuration;
        break;
      case OPP_STATE.RECOVERY:
      case OPP_STATE.STUNNED:
        opp.state = OPP_STATE.IDLE;
        opp.stateTimer = opp.idleMinTime + Math.random() * (opp.idleMaxTime - opp.idleMinTime);
        break;
    }
  }
}

function startNextPattern(opp) {
  const pattern = opp.patterns[opp.patternIndex % opp.patterns.length];
  opp.currentPattern = pattern;
  opp.patternIndex++;

  opp.telegraphType = pattern.telegraph;
  opp.attackType = pattern.attackType;
  opp.attackDirection = pattern.direction;

  opp.state = OPP_STATE.TELEGRAPH;
  opp.stateTimer = pattern.telegraphDuration;
}

export function stunOpponent(opp, duration) {
  opp.state = OPP_STATE.STUNNED;
  opp.stateTimer = duration;
}
