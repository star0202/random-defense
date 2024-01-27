import type { Status } from '../types'
import Request from './Request'
import * as cheerio from 'cheerio'
import { Logger } from 'tslog'

export default class BaekjoonRequest extends Request {
  constructor(logger: Logger<unknown>) {
    super(logger, 'BaekjoonRequest', {
      baseURL: 'https://acmicpc.net',
    })
  }

  async getLatestStatus(
    handle: string,
    problem: number,
    after = 0,
    onlyAccepted = false
  ): Promise<Status | null> {
    const data = await this.get(
      `/status?user_id=${handle}&problem_id=${problem}` +
        (onlyAccepted ? '&result_id=4' : '')
    )

    const $ = cheerio.load(data)

    const _handle = $(
      '#status-table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(2)'
    ).text()
    const problemId = Number(
      $(
        '#status-table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(3)'
      ).text()
    )
    const result = $(
      '#status-table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(4)'
    ).text()
    const time = Number(
      $(
        '#status-table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(9) > a:nth-child(1)'
      ).attr('data-timestamp')
    )

    if (!(handle && problemId && result && time)) return null

    if (time <= after) return null

    return {
      handle: _handle,
      problemId,
      result,
      time,
    }
  }
}
