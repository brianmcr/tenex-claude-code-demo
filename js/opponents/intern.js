import { createOpponent } from '../opponent.js';

export function createIntern() {
  return createOpponent({
    name: 'The Intern',
    title: 'Mail Room Menace',
    taunt: '"S-sorry in advance... I really need this promotion!"',
    health: 80,
    color: '#4a90d9',

    idleMinTime: 1.5,
    idleMaxTime: 2.5,

    patterns: [
      {
        telegraph: 'windUpRight',
        telegraphDuration: 1.0,
        attackType: 'hook',
        direction: 'right',
        attackDuration: 0.4,
        recoveryDuration: 2.0,
        damage: 8,
        blockable: true,
      },
      {
        telegraph: 'windUpLeft',
        telegraphDuration: 1.0,
        attackType: 'hook',
        direction: 'left',
        attackDuration: 0.4,
        recoveryDuration: 2.0,
        damage: 8,
        blockable: true,
      },
      {
        telegraph: 'windUpRight',
        telegraphDuration: 1.0,
        attackType: 'hook',
        direction: 'right',
        attackDuration: 0.4,
        recoveryDuration: 2.0,
        damage: 8,
        blockable: true,
      },
      {
        telegraph: 'flailWindUp',
        telegraphDuration: 1.2,
        attackType: 'flail',
        direction: 'center',
        attackDuration: 0.8,
        recoveryDuration: 2.0,
        damage: 15,
        blockable: false,
      },
    ],
  });
}
