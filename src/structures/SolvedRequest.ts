import type { Problem, User } from '../types'
import Request from './Request'
import { Logger } from 'tslog'

export default class SolvedRequest extends Request {
  constructor(logger: Logger<unknown>) {
    super(logger, 'SolvedRequest', {
      baseURL: 'https://solved.ac/api/v3',
      headers: {
        Acccpt: 'application/json',
      },
    })
  }

  async getUser(handle: string) {
    return this.get<User>(`/user/show?handle=${handle}`)
  }

  async getProblem(problemId: number) {
    return this.get<Problem>(`/problem/show?problemId=${problemId}`)
  }

  async getRandomProblem(query: string) {
    const data = await this.get<{ items: Problem[] }>(
      `/search/problem?query=${query}&sort=random`
    )

    return data.items[0]
  }
}
