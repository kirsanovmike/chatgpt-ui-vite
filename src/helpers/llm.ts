import { AuthorRole } from '@/data/enums/AuthorRole.js'

type Message = { content?: string; role?: string }

type ModelOptions = { model: string }

type GeneratePayload = {
  messages: Message[]
  promptOptions: ModelOptions
}

export const trimMessagesByTokens = (messages: Message[], _model: string) => messages

class LlmApiMock {
  async generate({ messages }: GeneratePayload) {
    const lastUserMessage = messages.filter(m => m.role === AuthorRole.User).pop()?.content || ''
    return {
      response: {
        content: lastUserMessage ? `Имитация ответа: ${lastUserMessage}` : 'Имитация ответа'
      }
    }
  }
}

const Llm = new LlmApiMock()

export default Llm
