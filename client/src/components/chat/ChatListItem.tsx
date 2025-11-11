import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type ChatListItemProps = {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
  avatarUrl?: string;
  onClick: () => void;
};

export function ChatListItem({
  id,
  name,
  lastMessage,
  lastMessageAt,
  unreadCount,
  isActive,
  avatarUrl,
  onClick,
}: ChatListItemProps) {
  const hasUnread = unreadCount > 0;
  const displayMessage = lastMessage
    ? lastMessage.length > 30
      ? `${lastMessage.substring(0, 30)}...`
      : lastMessage
    : 'No messages yet';

  return (
    <div
      className={cn(
        'p-3 border-b cursor-pointer transition-colors hover:bg-muted/50',
        isActive ? 'bg-muted/50' : ''
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>
              {name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm truncate">{name}</h3>
              {lastMessageAt && (
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatDistanceToNow(new Date(lastMessageAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <p
              className={cn(
                'text-sm truncate mt-0.5',
                hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'
              )}
            >
              {displayMessage}
            </p>
          </div>
        </div>
        {hasUnread && (
          <Badge variant="default" className="ml-2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );
}
