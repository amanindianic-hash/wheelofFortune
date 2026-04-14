// Get a random icon from the public/icons directory
export function getRandomSlotIcon(): string {
  const iconCount = 8; // Icons 1.png through 8.png
  const randomNum = Math.floor(Math.random() * iconCount) + 1;
  return `/icons/${randomNum}.png`;
}
