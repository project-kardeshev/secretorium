import { Howl } from 'howler';

export const menuSound = new Howl({
  src: ['/sounds/menu-sound.wav'],
  volume: 0.2,
  loop: false,
});

export const errorSound = new Howl({
  src: ['/sounds/error-female.mp3'],
  volume: 0.2,
  loop: false,
});
