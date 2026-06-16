export const playNotificationSound = () => {
  try {
    const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {
    console.log('Lecture audio impossible');
  }
};

export const playSuccessSound = () => {
  try {
    const audio = new Audio('https://www.soundjay.com/misc/sounds/button-09.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {}
};

export const playErrorSound = () => {
  try {
    const audio = new Audio('https://www.soundjay.com/misc/sounds/error-01.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch (e) {}
};