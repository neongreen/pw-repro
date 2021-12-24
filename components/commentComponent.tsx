import { Card, Comment, Reply, User } from '@prisma/client'
import React, { useState } from 'react'
import { RenderedMarkdown } from '../lib/markdown'
import { BiCommentDetail } from 'react-icons/bi'
import styles from './commentComponent.module.scss'
import _ from 'lodash'
import { LinkButton } from './linkButton'
import { CreateReplyModal } from './createReplyModal'

export type Comment_ = Comment

export type Reply_ = Reply & {
  author: Pick<User, 'id' | 'email' | 'displayName'> | null
}

// Component in "normal" mode
function ShowReply(props: {
  reply: Reply_
}) {
  const { reply } = props
  return (
    <div>
      {/* NOTE: if you add nested divs here, it will increase the number of elements the selector resolves to */}
      {reply.author!.displayName}
      <RenderedMarkdown className="woc-reply-content rendered-content small" markdown={reply.content} />
    </div>
  )
}

export function ReplyComponent(props: {
  reply: Reply_
}) {
  return (<ShowReply {...props} />)
}

export function CommentComponent(props: {
  card: Card
  comment: Comment_
  replies: Reply_[]
  afterReplyCreated: (newReply: Reply_) => void
}) {
  const { comment } = props
  const classes = `${styles.comment}`
  // Is the reply modal open?
  const [replyModalShown, setReplyModalShown] = useState(false)
  return (
    <div id={`comment-${comment.id}`} className={classes}>
      <CreateReplyModal
        show={replyModalShown}
        comment={props.comment}
        onHide={() => setReplyModalShown(false)}
        afterReplyCreated={(newReply) => {
          setReplyModalShown(false)
          props.afterReplyCreated(newReply)
        }}
      />
      <LinkButton onClick={() => setReplyModalShown(true)} icon={<BiCommentDetail />}>Reply</LinkButton>
      <RenderedMarkdown className="rendered-content" markdown={comment.content} />
      {props.replies.map(reply => (
        <ReplyComponent key={reply.id} reply={reply} />
      ))}
    </div>
  )
}
