// components/debug-reservation.tsx
'use client';

import { useEffect } from 'react';

export function DebugReservation({ selectedCards }: { selectedCards: string[] }) {
  useEffect(() => {
    console.log('Selected cards for reservation:', selectedCards);
  }, [selectedCards]);

  return null;
}