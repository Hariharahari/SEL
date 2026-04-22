import { Play } from 'lucide-react';
import { SELAgentCard } from '@/types';

interface VideoTrailProps {
  agent: SELAgentCard;
}

export default function VideoTrail({ agent }: VideoTrailProps) {
  if (!agent.video_url) {
    return (
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Play className="w-4 h-4" />
          Video Trail
        </h3>
        <p className="text-gray-500 text-sm">No video available yet</p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Play className="w-4 h-4" />
        Video Trail
      </h3>
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`${agent.video_url}${
            agent.video_url.includes('youtube.com') ||
            agent.video_url.includes('youtu.be')
              ? '?rel=0'
              : ''
          }`}
          title={`${agent.name} Video`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
