import { createOpponent } from '../opponent.js';

export function createCEO() {
  return createOpponent({
    name: 'The CEO',
    title: 'Chairman of Pain',
    taunt: '"...You have 30 seconds. Make them count."',
    health: 150,
    color: '#1a1a2e',

    idleMinTime: 0.6,
    idleMaxTime: 1.2,
    goldenParachute: true,

    patterns: [
      {
        telegraph: 'smirk',
        telegraphDuration: 0.35,
        attackType: 'jab',
        direction: 'right',
        attackDuration: 0.15,
        recoveryDuration: 0.5,
        damage: 12,
        blockable: true,
      },
      {
        telegraph: 'adjustCufflinks',
        telegraphDuration: 0.5,
        attackType: 'cross',
        direction: 'center',
        attackDuration: 0.2,
        recoveryDuration: 0.75,
        damage: 20,
        blockable: false,
      },
      {
        telegraph: 'smirk',
        telegraphDuration: 0.35,
        attackType: 'jab',
        direction: 'left',
        attackDuration: 0.15,
        recoveryDuration: 0.5,
        damage: 12,
        blockable: true,
      },
      {
        telegraph: 'feintLeft',
        telegraphDuration: 0.5,
        attackType: 'feint',
        direction: 'right',
        attackDuration: 0.2,
        recoveryDuration: 0.75,
        damage: 22,
        blockable: false,
      },
      {
        telegraph: 'adjustCufflinks',
        telegraphDuration: 0.4,
        attackType: 'cross',
        direction: 'center',
        attackDuration: 0.2,
        recoveryDuration: 0.75,
        damage: 20,
        blockable: false,
      },
      {
        telegraph: 'crackKnuckles',
        telegraphDuration: 0.6,
        attackType: 'boardMeeting',
        direction: 'center',
        attackDuration: 1.0,
        recoveryDuration: 1.0,
        damage: 35,
        blockable: false,
      },
    ],
  });
}
