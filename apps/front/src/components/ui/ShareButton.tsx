'use client';

import { Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ShareButton() {
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <Button variant='outline' size='sm' onClick={handleShare}>
      <Share2 className='mr-2 h-4 w-4' />
      Share this post
    </Button>
  );
}
