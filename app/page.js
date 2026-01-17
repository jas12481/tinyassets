'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main game (or asset choice if you want to keep that flow)
    router.push('/kid/game');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 flex items-center justify-center">
      <div className="text-white text-2xl">Loading...</div>
    </div>
  );
}