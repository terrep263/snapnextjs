'use client';

import React from 'react';
import {
  FacebookShare,
  TwitterShare,
  WhatsappShare,
  LinkedinShare,
  EmailShare,
} from 'react-share-kit';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  size?: number;
}

export default function ShareButtons({
  url,
  title,
  description = 'Check out this event gallery on SnapWorxx!',
  size = 40
}: ShareButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <FacebookShare
        url={url}
        quote={title}
        size={size}
        round
      />

      <TwitterShare
        url={url}
        title={title}
        size={size}
        round
      />

      <WhatsappShare
        url={url}
        title={title}
        size={size}
        round
      />

      <LinkedinShare
        url={url}
        title={title}
        size={size}
        round
      />

      <EmailShare
        url={url}
        subject={title}
        body={`${description}\n\n${url}`}
        size={size}
        round
      />
    </div>
  );
}
