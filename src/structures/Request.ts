import axios from 'axios'
import type { AxiosInstance, CreateAxiosDefaults } from 'axios'
import { Logger } from 'tslog'

export default class Request {
  private readonly rest: AxiosInstance
  private readonly logger: Logger<unknown>

  constructor(
    logger: Logger<unknown>,
    name: string,
    config: CreateAxiosDefaults
  ) {
    this.rest = axios.create({
      ...config,
      headers: {
        'User-Agent': 'Mozilla/5.0  ',
      },
    })

    this.logger = logger.getSubLogger({
      name,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async get<T = any>(url: string) {
    this.logger.debug(`GET ${url}`)

    const { data } = await this.rest.get<T>(url)

    return data
  }
}
