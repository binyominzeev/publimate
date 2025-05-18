import React, { useEffect, useState } from 'react';

export default function ChannelName({ channelId }) {
  const [channelName, setChannelName] = useState('Loading...');

  useEffect(() => {
    if (!channelId) {
      setChannelName('Unknown Channel');
      return;
    }

    console.log('Fetching name for channelId:', channelId); // ✅ DEBUG

    fetch(`/api/channels/${channelId}`)
      .then(res => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then(data => {
        console.log('Fetched channel data:', data); // ✅ DEBUG
        setChannelName(data.name || 'Unknown Channel');
      })
      .catch(err => {
        console.error('Error fetching channel name:', err);
        setChannelName('Unknown Channel');
      });
  }, [channelId]);

  return <span>{channelName}</span>;
}
