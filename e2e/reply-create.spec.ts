import { test, expect } from '@playwright/test'
import { createBoard, createCard, createComment, createReply } from './util'

test.use({ storageState: 'alice.storageState.json' })

// This was buggy once
test("When you reply to someone else's comment, it shows your name", async ({ page, browser }) => {
  await createBoard(page, { navigate: true })
  await createCard(page, { navigate: true })
  const commentContent = await createComment(page)
  const cardUrl = page.url()

  // Leave a reply as Bob
  {
    const bobContext = await browser.newContext({ storageState: 'bob.storageState.json' })
    const bobPage = await bobContext.newPage()
    await bobPage.goto(cardUrl)
    const replyContent = await createReply(bobPage, commentContent)
    await expect(bobPage.locator(`_react=ReplyComponent >> :has-text("${replyContent}")`)).not.toContainText("Alice T.")
    await expect(bobPage.locator(`_react=ReplyComponent >> :has-text("${replyContent}")`)).toContainText("Bob T.")
  }
})
