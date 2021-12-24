import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import type { Board, User, Card, Comment } from '@prisma/client'
import { prisma } from '../lib/db'
import { Button, Form } from 'react-bootstrap'
import React, { useState } from 'react'
import _ from 'lodash'
import { SuperJSONResult } from 'superjson/dist/types'
import { deserialize, serialize } from 'superjson'
import { getSession } from 'next-auth/react'
import { callCreateComment } from './api/comments/create'
import { Formik } from 'formik'
import { CommentComponent, Comment_ } from 'components/commentComponent'
import { Reply_ } from 'components/commentComponent'
import { updateById } from 'lib/array'

type Card_ = Card & {
  owner: User
  board: Board
  comments: (Comment_ & { replies: Reply_[] })[]
}

type Props = {
  initialCard: Card_
}

const cardFindSettings = {
  include: {
    owner: true,
    board: true,
    comments: {
      include: {
        replies: {
          include: {
            author: { select: { id: true, email: true, displayName: true } }
          }
        }
      }
    }
  }
}

export const getServerSideProps: GetServerSideProps<SuperJSONResult> = async (context) => {
  const session = await getSession(context)
  const card = await prisma.card.findUnique({
    where: {
      id: context.query.cardId as string
    },
    ...cardFindSettings
  })
  if (!card) { return { notFound: true } }
  const props: Props = {
    initialCard: card
  }
  return {
    props: serialize(props)
  }
}

class AddCommentForm extends React.Component<{
  cardId: Card['id']
  afterCommentCreated: (comment: Comment) => void
}> {
  render() {
    return (
      <Formik
        initialValues={{ private: false, content: '' }}
        onSubmit={async (values) => {
          const comment = await callCreateComment({
            cardId: this.props.cardId,
            ...values
          })
          this.props.afterCommentCreated(comment)
        }}
      >
        {formik => (
          <Form onSubmit={formik.handleSubmit} className="woc-comment-form">
            <Form.Control name="content" id="content" type="text"
              value={formik.values.content} onChange={formik.handleChange} />
            <Button variant="primary" type="submit">Post</Button>
          </Form>
        )}
      </Formik>
    )
  }
}

const ShowCard: NextPage<SuperJSONResult> = (props) => {
  const { initialCard } = deserialize<Props>(props)

  // Card state & card-modifying methods
  const [card, setCard] = useState(initialCard)

  const addComment = (comment: Comment) => setCard(card => ({
    ...card,
    comments: card.comments.concat([{ ...comment, replies: [] }])
  }))

  const addReply = (commentId, reply: Reply_) => setCard(card => ({
    ...card,
    comments: updateById(card.comments, commentId, (comment => ({
      ...comment,
      replies: comment.replies.concat([reply])
    })))
  }))

  const renderCommentList = (comments) => comments.map(comment => (
    <CommentComponent key={comment.id}
      card={card}
      comment={comment}
      replies={comment.replies}
      afterReplyCreated={reply => addReply(comment.id, reply)}
    />
  ))

  return (
    <>
      <Head>
        <title>{card.title} / WOC</title>
      </Head>

      <h1 className="mb-4">
        {card.title}
      </h1>
      <AddCommentForm afterCommentCreated={addComment} cardId={card.id} />
      <div className="mt-4">
        {renderCommentList(card.comments)}
      </div>
    </>
  )
}

export default ShowCard