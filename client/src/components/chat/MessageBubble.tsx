import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

type MessageBubbleProps = {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  metadata?: {
    readBy?: number[];
    aiAnalysis?: {
      sentiment: 'positive' | 'neutral' | 'negative';
    };
  };
  isOwn: boolean;
  showAvatar: boolean;
  showName: boolean;
  showStatus: boolean;
  currentUserId?: number;
  className?: string;
};

export function MessageBubble({
  id,
  content,
  sender,
  attachments = [],
  metadata = {},
  isOwn,
  showAvatar,
  showName,
  showStatus,
  currentUserId,
  className,
}: MessageBubbleProps) {
  const { readBy = [], aiAnalysis } = metadata;
  const isRead = readBy?.length > 0;
  const isReadByMe = currentUserId ? readBy?.includes(currentUserId) : false;
  const isGroupMessage = showName || showAvatar;

  const renderAttachment = (file: any, index: number) => {
    if (file.type.startsWith('image/')) {
      return (
        <div key={index} className="mt-2 rounded-md overflow-hidden">
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-64 object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(file.url, '_blank')}
          />
        </div>
      );
    }

    return (
      <a
        key={index}
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-2 mt-2 text-sm border rounded-md hover:bg-accent transition-colors"
      >
        <span className="truncate max-w-xs">{file.name}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
      </a>
    );
  };

  return (
    <div
      className={cn(
        'flex w-full mb-2 group',
        isOwn ? 'justify-end' : 'justify-start',
        className
      )}
    >
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 self-end mb-1 mr-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={sender.avatarUrl} alt={sender.name} />
            <AvatarFallback>
              {sender.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div className={cn('flex flex-col max-w-[80%]', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && showName && (
          <span className="text-xs font-medium text-muted-foreground mb-1">
            {sender.name}
          </span>
        )}
        <div
          className={cn(
            'relative px-4 py-2 rounded-2xl',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm',
            aiAnalysis?.sentiment === 'positive' && 'ring-1 ring-green-500/30',
            aiAnalysis?.sentiment === 'negative' && 'ring-1 ring-red-500/30'
          )}
        >
          <div className="whitespace-pre-wrap break-words">{content}</div>
          
          {attachments.map(renderAttachment)}
          
          <div
            className={cn(
              'flex items-center justify-end mt-1 space-x-1 text-xs',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            <span>
              {formatDistanceToNow(new Date(id), { addSuffix: true })}
            </span>
            {isOwn && (
              <span className="flex items-center">
                {isRead ? (
                  <CheckCheck className="h-3 w-3 ml-1" />
                ) : (
                  <Check className="h-3 w-3 ml-1" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
