export type Spring = { value: number; velocity: number };

export type SpringConfig = { stiffness: number; damping: number };

export const settle: SpringConfig = { stiffness: 170, damping: 20 };
export const glide: SpringConfig = { stiffness: 60, damping: 16 };
export const clunk: SpringConfig = { stiffness: 320, damping: 18 };

const restDistance = 0.004;
const restVelocity = 0.02;
const longestFrame = 0.1;
const finestStep = 1 / 120;

export function stepSpring(
  spring: Spring,
  target: number,
  delta: number,
  config: SpringConfig,
): boolean {
  const elapsed = Math.min(Math.max(delta, 0), longestFrame);
  const subSteps = Math.max(1, Math.ceil(elapsed / finestStep));
  const step = elapsed / subSteps;
  for (let index = 0; index < subSteps; index += 1) {
    const force = (target - spring.value) * config.stiffness - spring.velocity * config.damping;
    spring.velocity += force * step;
    spring.value += spring.velocity * step;
  }
  const resting =
    Math.abs(target - spring.value) < restDistance && Math.abs(spring.velocity) < restVelocity;
  if (resting) {
    spring.value = target;
    spring.velocity = 0;
  }
  return resting;
}

export function snapSpring(spring: Spring, target: number): void {
  spring.value = target;
  spring.velocity = 0;
}
