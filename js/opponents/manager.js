import { createOpponent } from '../opponent.js';

export function createManager() {
  return createOpponent({
    name: 'Middle Manager',
    title: 'Director of Synergy',
    taunt: '"Let\'s take this offline. Permanently."',
    health: 120,
    color: '#7b7b7b',

    idleMinTime: 1.0,
    idleMaxTime: 1.8,

    patterns: [
      {
        telegraph: 'adjustTie',
        telegraphDuration: 0.6,
        attackType: 'jab',
        direction: 'center',
        attackDuration: 0.25,
        recoveryDuration: 0.8,
        damage: 10,
        blockable: true,
      },
      {
        telegraph: 'sipCoffee',
        telegraphDuration: 0.8,
        attackType: 'uppercut',
        direction: 'center',
        attackDuration: 0.3,
        recoveryDuration: 1.5,
        damage: 18,
        blockable: false,
      },
      {
        telegraph: 'adjustTie',
        telegraphDuration: 0.5,
        attackType: 'jab',
        direction: 'left',
        attackDuration: 0.25,
        recoveryDuration: 0.8,
        damage: 10,
        blockable: true,
      },
      {
        telegraph: 'checkPhone',
        telegraphDuration: 0.7,
        attackType: 'combo',
        direction: 'left',
        attackDuration: 0.6,
        recoveryDuration: 1.0,
        damage: 22,
        blockable: true,
      },
      {
        telegraph: 'raiseClipboard',
        telegraphDuration: 0.8,
        attackType: 'slam',
        direction: 'center',
        attackDuration: 0.35,
        recoveryDuration: 1.2,
        damage: 20,
        blockable: false,
      },
    ],
  });
}
