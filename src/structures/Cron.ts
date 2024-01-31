import { CronJob } from 'cron'

export default class CronManager {
  private jobs: CronJob[] = []

  add(config: { cronTime: string; onTick: () => void }) {
    this.jobs.push(
      CronJob.from({ ...config, timeZone: 'Asia/Seoul', start: true })
    )
  }
}
