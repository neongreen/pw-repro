import { Card } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import * as yup from 'yup'
import { SchemaOf } from 'yup'
import axios from 'axios'
import deepMap from 'deep-map'
import { getSession } from 'next-auth/react'
import { CardSettings } from 'lib/model-settings'

interface CreateCardRequest extends NextApiRequest {
  body: {
    boardId: Card['boardId']
    title: Card['title']
    private?: boolean
  }
}

export type CreateCardBody = CreateCardRequest['body']

const schema: SchemaOf<CreateCardBody> = yup.object({
  boardId: yup.string().uuid().required(),
  title: yup.string().required(),
  private: yup.boolean()
})

export default async function createCard(req: CreateCardRequest, res: NextApiResponse<Card>) {
  if (req.method === 'POST') {
    const body = schema.validateSync(req.body)
    const session = await getSession({ req })
    const board = await prisma.board.findUnique({
      where: { id: body.boardId },
      select: { ownerId: true, settings: true },
      rejectOnNotFound: true,
    })
    const settings: Partial<CardSettings> = {
      visibility: body.private ? 'private' : 'public'
    }
    const card = await prisma.card.create({
      data: {
        title: body.title.trim(),
        boardId: body.boardId,
        settings,
        ownerId: board.ownerId,
      }
    })
    return res.status(201).json(card)
  }
}

export async function callCreateCard(body: CreateCardBody): Promise<Card> {
  const { data } = await axios.post('/api/cards/create', body)
  return deepMap(data, (val, key) => ((key === 'createdAt') ? new Date(val) : val))
}
