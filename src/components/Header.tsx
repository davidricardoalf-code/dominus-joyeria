'use client';

import Image from 'next/image';
import Button from './ui/Button';

export default function Header({ onNew }: { onNew: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-dominus-line bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Dominus Joyería"
            width={1080}
            height={308}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </div>
        <Button onClick={onNew} size="md">
          + Nuevo reloj
        </Button>
      </div>
    </header>
  );
}
