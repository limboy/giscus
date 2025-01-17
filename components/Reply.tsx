import { KebabHorizontalIcon } from '@primer/octicons-react';
import ReactButtons from './ReactButtons';
import { IReply } from '../lib/types/adapter';
import { useCallback } from 'react';
import { Reactions, updateCommentReaction } from '../lib/reactions';
import { formatDate, formatDateDistance } from '../lib/utils';
import { handleCommentClick, processCommentBody } from '../lib/adapter';

interface IReplyProps {
  reply: IReply;
  onReplyUpdate: (newReply: IReply, promise: Promise<unknown>) => void;
}

export default function Reply({ reply, onReplyUpdate }: IReplyProps) {
  const updateReactions = useCallback(
    (content: Reactions, promise: Promise<unknown>) =>
      onReplyUpdate(updateCommentReaction(reply, content), promise),
    [reply, onReplyUpdate],
  );

  const hidden = reply.deletedAt || reply.isMinimized;

  return (
    <div className="relative gsc-reply">
      <div className="w-[2px] flex-shrink-0 absolute left-[30px] h-full top-0 gsc-tl-line" />
      <div className={`flex py-2 pl-4 ${hidden ? 'items-center' : ''}`}>
        <div className="z-10 flex-shrink-0 gsc-reply-author-avatar">
          <a
            rel="nofollow noopener noreferrer"
            target="_blank"
            href={reply.author.url}
            className="flex items-center"
          >
            <img
              className="rounded-full"
              src={reply.author.avatarUrl}
              width="30"
              height="30"
              alt={`@${reply.author.login}`}
            />
          </a>
        </div>
        <div className="w-full min-w-0 ml-2">
          {!hidden ? (
            <div className="flex gsc-reply-header">
              <h3 className="flex items-start flex-auto gsc-reply-author">
                <a
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  href={reply.author.url}
                  className="flex items-center"
                >
                  <span className="font-semibold Link--primary">{reply.author.login}</span>
                </a>
                <a
                  rel="nofollow noopener noreferrer"
                  target="_blank"
                  href={reply.url}
                  className="ml-2 Link--secondary"
                >
                  <div className="whitespace-nowrap" title={formatDate(reply.createdAt)}>
                    {formatDateDistance(reply.createdAt)}
                  </div>
                </a>
                {reply.authorAssociation ? (
                  <div className="hidden ml-2 text-xs sm:inline-flex">
                    <span
                      className={`px-1 ml-1 capitalize border rounded-md ${
                        reply.viewerDidAuthor ? 'color-box-border-info' : 'color-label-border'
                      }`}
                    >
                      {reply.authorAssociation}
                    </span>
                  </div>
                ) : null}
              </h3>
              <div className="flex pr-4">
                {reply.lastEditedAt ? (
                  <button
                    className="hidden mr-2 sm:inline-block color-text-secondary gsc-reply-edited"
                    title={`Last edited at ${formatDate(reply.lastEditedAt)}`}
                  >
                    edited
                  </button>
                ) : null}
                <ReactButtons
                  reactionGroups={reply.reactions}
                  subjectId={reply.id}
                  variant="popoverOnly"
                  onReact={updateReactions}
                />
                <button className="hidden Link--secondary">
                  {
                    // TODO: implement menu and add sm:inline-block class
                  }
                  <KebabHorizontalIcon />
                </button>
              </div>
            </div>
          ) : null}
          <div
            className={`w-full pr-4 markdown gsc-reply-content ${!hidden ? 'pb-2' : ''}`}
            onClick={handleCommentClick}
            dangerouslySetInnerHTML={
              hidden ? undefined : { __html: processCommentBody(reply.bodyHTML) }
            }
          >
            <em className="color-text-secondary">
              This comment {reply.deletedAt ? 'was deleted' : 'has been hidden'}.
            </em>
          </div>
          {!hidden ? (
            <div className="flex content-center mr-4 gsc-reply-reactions">
              <ReactButtons
                reactionGroups={reply.reactions}
                subjectId={reply.id}
                variant="groupsOnly"
                onReact={updateReactions}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
