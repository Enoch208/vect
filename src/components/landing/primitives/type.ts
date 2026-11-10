export const dashedRule =
  "h-px w-full bg-[repeating-linear-gradient(to_right,var(--color-rule)_0_6px,transparent_6px_10px)]";

export const dashedRuleVertical =
  "w-px h-full bg-[repeating-linear-gradient(to_bottom,var(--color-rule)_0_6px,transparent_6px_10px)]";

export const fluidUnit = "[--spacing:min(10px,calc(100vw/39))] lg:[--spacing:calc(100vw/172.8)]";

const displayBase = "font-display font-bold uppercase leading-[0.92] tracking-[-0.045em]";

export const display = {
  xl: `${displayBase} text-[length:calc(var(--spacing)*3.2)] lg:text-[length:calc(var(--spacing)*5.6)]`,
  l: `${displayBase} text-[length:calc(var(--spacing)*3)] lg:text-[length:calc(var(--spacing)*4.8)]`,
  m: `${displayBase} text-[length:calc(var(--spacing)*2.8)] lg:text-[length:calc(var(--spacing)*4)]`,
  s: `${displayBase} text-[length:calc(var(--spacing)*2.4)] lg:text-[length:calc(var(--spacing)*3.2)]`,
  card: `${displayBase} text-[length:calc(var(--spacing)*2.2)] lg:text-[length:calc(var(--spacing)*2.8)]`,
  list: `${displayBase} text-[length:calc(var(--spacing)*1.9)] leading-[1.1] lg:text-[length:calc(var(--spacing)*2.4)]`,
};

export const body = {
  m: "font-sans font-normal tracking-[-0.02em] text-[length:calc(var(--spacing)*1.6)] leading-[1.3]",
  s: "font-sans font-medium tracking-[-0.02em] text-[length:calc(var(--spacing)*1.4)] leading-[1.4]",
};

const monoBase = "font-mono font-medium uppercase tabular-nums";

export const mono = {
  label: `${monoBase} text-[length:calc(var(--spacing)*1.2)] leading-[1.4] lg:text-[length:calc(var(--spacing)*1.4)]`,
  xs: `${monoBase} text-[length:calc(var(--spacing)*1.1)] leading-[1.3] lg:text-[length:calc(var(--spacing)*1.2)]`,
  xxs: `${monoBase} text-[length:calc(var(--spacing)*1)] leading-[1.3]`,
};
