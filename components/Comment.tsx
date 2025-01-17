import { ArrowUpIcon, KebabHorizontalIcon } from '@primer/octicons-react';
import { ReactElement, ReactNode, useCallback, useContext, useState } from 'react';
import { handleCommentClick, processCommentBody } from '../lib/adapter';
import { IComment, IReply } from '../lib/types/adapter';
import { Reactions, updateCommentReaction } from '../lib/reactions';
import { formatDate, formatDateDistance } from '../lib/utils';
import { toggleUpvote } from '../services/github/toggleUpvote';
import CommentBox from './CommentBox';
import ReactButtons from './ReactButtons';
import Reply from './Reply';
import { AuthContext } from '../lib/context';

interface ICommentProps {
  children?: ReactNode;
  comment: IComment;
  onCommentUpdate?: (newComment: IComment, promise: Promise<unknown>) => void;
  onReplyUpdate?: (newReply: IReply, promise: Promise<unknown>) => void;
  renderReplyBox?: (viewMore: VoidFunction) => ReactElement<typeof CommentBox>;
}

export default function Comment({
  children,
  comment,
  onCommentUpdate,
  onReplyUpdate,
  renderReplyBox,
}: ICommentProps) {
  const [page, setPage] = useState(0);
  const replies = comment.replies.slice(0, page === 0 ? 3 : undefined);
  const { token } = useContext(AuthContext);

  const updateReactions = useCallback(
    (reaction: Reactions, promise: Promise<unknown>) =>
      onCommentUpdate(updateCommentReaction(comment, reaction), promise),
    [comment, onCommentUpdate],
  );

  const incrementPage = () => page < 1 && setPage(page + 1);

  const upvote = useCallback(() => {
    const upvoteCount = comment.viewerHasUpvoted
      ? comment.upvoteCount - 1
      : comment.upvoteCount + 1;

    const promise = toggleUpvote(
      { upvoteInput: { subjectId: comment.id } },
      token,
      comment.viewerHasUpvoted,
    );

    onCommentUpdate(
      {
        ...comment,
        upvoteCount,
        viewerHasUpvoted: !comment.viewerHasUpvoted,
      },
      promise,
    );
  }, [comment, onCommentUpdate, token]);

  const hidden = comment.deletedAt || comment.isMinimized;

  return (
    <div className="flex my-4 text-sm gsc-comment">
      {!comment.isMinimized && onCommentUpdate ? (
        <div className="flex-shrink-0 mr-2 w-14 gsc-upvotes">
          <div className="flex flex-col">
            <button
              type="button"
              className={`${comment.viewerHasUpvoted ? 'color-text-link' : 'color-text-secondary'}`}
              onClick={upvote}
              disabled={!token || !comment.viewerCanUpvote}
            >
              <ArrowUpIcon className="transform hover:translate-y-[-10%] transition-transform ease-in-out duration-150" />
            </button>
            <div className="flex justify-center w-full">
              <div
                className={`flex flex-row justify-center min-w-[26px] px-2 py-1 rounded-full ${
                  comment.viewerHasUpvoted
                    ? 'color-text-link color-upvote-icon-bg'
                    : 'Counter--secondary'
                }`}
              >
                <div
                  className="overflow-hidden text-xs"
                  title={`${comment.upvoteCount} upvote${comment.upvoteCount !== 1 ? 's' : ''}`}
                >
                  {comment.upvoteCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={`w-full min-w-0 border rounded-md color-bg-primary ${
          comment.viewerDidAuthor ? 'color-box-border-info' : 'color-border-primary'
        }`}
      >
        {!comment.isMinimized ? (
          <div className="flex items-center px-4 gsc-comment-header">
            <h3 className="flex items-center flex-auto pt-2 gsc-comment-author">
              <a
                rel="nofollow noopener noreferrer"
                target="_blank"
                href={comment.author.url}
                className="flex items-center gsc-comment-author-avatar"
              >
                <img
                  className="mr-2 rounded-full"
                  src={comment.author.avatarUrl}
                  width="30"
                  height="30"
                  alt={`@${comment.author.login}`}
                />
                <span className="font-semibold Link--primary">{comment.author.login}</span>
              </a>
              <a
                rel="nofollow noopener noreferrer"
                target="_blank"
                href={comment.url}
                className="ml-2 Link--secondary"
              >
                <div className="whitespace-nowrap" title={formatDate(comment.createdAt)}>
                  {formatDateDistance(comment.createdAt)}
                </div>
              </a>
              {comment.authorAssociation ? (
                <div className="hidden ml-2 text-xs sm:inline-flex">
                  <span
                    className={`px-1 ml-1 capitalize border rounded-md ${
                      comment.viewerDidAuthor ? 'color-box-border-info' : 'color-label-border'
                    }`}
                  >
                    {comment.authorAssociation}
                  </span>
                </div>
              ) : null}
            </h3>
            <div className="flex">
              {comment.lastEditedAt ? (
                <button
                  className="hidden mr-2 sm:inline-block color-text-secondary gsc-comment-edited"
                  title={`Last edited at ${formatDate(comment.lastEditedAt)}`}
                >
                  edited
                </button>
              ) : null}
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
          className={`markdown rounded-t gsc-comment-content ${
            comment.isMinimized
              ? 'px-4 py-2 color-bg-tertiary border-b border-color-primary'
              : 'p-4'
          }`}
          onClick={handleCommentClick}
          dangerouslySetInnerHTML={
            hidden ? undefined : { __html: processCommentBody(comment.bodyHTML) }
          }
        >
          <em className="color-text-secondary">
            This comment {comment.deletedAt ? 'was deleted' : 'has been minimized'}.
          </em>
        </div>
        {children}
        {!comment.isMinimized && onCommentUpdate ? (
          <div
            className={`flex content-center justify-between${
              renderReplyBox || comment.replies.length > 0 ? ' border-b' : ''
            }${comment.replies.length > 0 ? ' rounded-b-md' : ''}`}
          >
            <div className="flex items-start justify-end ml-4 gsc-comment-reactions">
              {!hidden ? (
                <ReactButtons
                  reactionGroups={comment.reactions}
                  subjectId={comment.id}
                  onReact={updateReactions}
                />
              ) : null}
            </div>
            <div className="mb-4 mr-4 gsc-comment-replies-count">
              <span className="text-xs color-text-tertiary">
                {comment.replies.length}&nbsp;{comment.replies.length === 1 ? 'reply' : 'replies'}
              </span>
            </div>
          </div>
        ) : null}
        {comment.replies.length > 0 ? (
          <div
            className={`pt-2 color-bg-canvas-inset color-border-primary gsc-replies ${
              renderReplyBox && !comment.isMinimized ? 'border-b' : 'rounded-b-md'
            }`}
          >
            {onReplyUpdate
              ? replies.map((reply) => (
                  <Reply key={reply.id} reply={reply} onReplyUpdate={onReplyUpdate} />
                ))
              : null}
            {page === 0 && comment.replies.length > 3 ? (
              <button
                className="mb-2 ml-3 text-xs font-semibold color-text-link hover:underline"
                onClick={incrementPage}
              >
                View more
              </button>
            ) : null}
          </div>
        ) : null}
        {!hidden && renderReplyBox ? renderReplyBox(incrementPage) : null}
      </div>
    </div>
  );
}
