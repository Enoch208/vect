import { useState } from "react";
import { VectMark } from "../blueprint/Mark.js";
import { navLinks } from "../links.js";
import { Button } from "../primitives/Buttons.js";
import { mono } from "../primitives/type.js";

type HeaderProps = { onOpenStudio: () => void };

const focus = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink";

function Wordmark() {
  return (
    <a
      href="#top"
      className={`flex items-center gap-[calc(var(--spacing)*1)] font-display text-[length:calc(var(--spacing)*2.6)] font-bold tracking-[-0.04em] uppercase ${focus}`}
    >
      <VectMark className="size-[1.1em]" />
      Vect
    </a>
  );
}

export function Header({ onOpenStudio }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header
      id="top"
      data-intro="drop"
      className="sticky top-[8px] z-30 grid bg-paper lg:relative lg:top-auto h-[48px] grid-cols-2 border-b border-rule lg:h-[56px] lg:grid-cols-[50%_1fr_12%]"
    >
      <div className="flex items-center border-r border-rule px-[12px] lg:px-3">
        <Wordmark />
      </div>
      <nav aria-label="Sections" className="hidden grid-cols-4 lg:grid">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={`${mono.label} flex items-start border-r border-rule px-[10px] pt-[10px] text-muted transition-colors hover:bg-ink/5 hover:text-accent ${focus}`}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="hidden items-stretch lg:flex">
        <button
          type="button"
          onClick={onOpenStudio}
          className={`${mono.label} flex w-full items-start justify-between px-[10px] pt-[10px] text-accent transition-colors hover:bg-accent hover:text-paper ${focus}`}
        >
          Open studio
          <span aria-hidden className="self-end pb-[8px]">
            ↗
          </span>
        </button>
      </div>
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="landing-menu"
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenuOpen(false);
        }}
        onClick={() => {
          setMenuOpen((open) => !open);
        }}
        className={`flex items-center justify-between px-[12px] text-muted lg:hidden ${mono.label} ${focus}`}
      >
        Menu
        <span aria-hidden className="flex w-[14px] flex-col gap-[3px]">
          <span className="h-px bg-current" />
          <span className="h-px bg-current" />
          <span className="h-px bg-current" />
        </span>
      </button>
      <div
        id="landing-menu"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full border-b border-rule bg-paper lg:hidden"
      >
        <ul className="flex flex-col">
          {navLinks.map((link) => (
            <li key={link.label} className="border-t border-rule first:border-t-0">
              <a
                href={link.href}
                onClick={() => {
                  setMenuOpen(false);
                }}
                className={`block px-[12px] lg:px-3 py-3 ${mono.label} text-ink ${focus}`}
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="border-t border-rule p-[12px] lg:p-3">
            <Button onClick={onOpenStudio}>Open the studio</Button>
          </li>
        </ul>
      </div>
    </header>
  );
}
