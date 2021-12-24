import { Prisma, Reply, User, Comment, subscription_update_kind } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'

interface CreateReplyRequest extends NextApiRequest {
  body: {
    commentId: Reply['commentId']
    content: Reply['content'] // Markdown
  }
}

export type CreateReplyBody = CreateReplyRequest['body']

const schema: SchemaOf<CreateReplyBody> = yup.object({
  commentId: yup.string().uuid().required(),
  content: yup.string().required(),
})

// An augmented reply type that we return from the API
export type ReplyResponse = Reply & {
  author: Pick<User, 'id' | 'email' | 'displayName'>
}

export default async function createReply(req: CreateReplyRequest, res: NextApiResponse<ReplyResponse>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const comment = await prisma.comment.findUnique({
      where: { id: body.commentId },
      select: {
        ownerId: true, settings: true,
        card: {
          select: {
            ownerId: true, settings: true,
            board: { select: { ownerId: true, settings: true } }
          }
        }
      },
      rejectOnNotFound: true,
    })
    if (!session) return res.status(403)

    // Create the reply
    const reply = await prisma.reply.create({
      data: {
        content: body.content,
        commentId: body.commentId,
        settings: {},
        authorId: session.userId,
      }
    })

    const replyAugmented = {
      ...reply,
      author: await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, displayName: true, email: true },
        rejectOnNotFound: true
      }),
    }

    return res.status(201).json(replyAugmented)
  }
}

export async function callCreateReply(body: CreateReplyBody): Promise<ReplyResponse> {
  const { data } = await axios.post('/api/replies/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
