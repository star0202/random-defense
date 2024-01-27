import { CronJob } from 'cron'
import type { Logger } from 'tslog'

export default class CronManager {
  private jobs: CronJob[] = []

  private readonly logger: Logger<unknown>

  constructor(logger: Logger<unknown>) {
    this.logger = logger.getSubLogger({
      name: 'Cron',
    })
  }

  add(config: { cronTime: string; onTick: () => void }) {
    this.jobs.push(
      CronJob.from({ ...config, timeZone: 'Asia/Seoul', start: true })
    )
  }
}
