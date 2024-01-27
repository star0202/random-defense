import { tierMapping } from '../constants'
import type { User } from '../types'
import { EmbedBuilder } from 'discord.js'

enum COLORS {
  RED = 0xff0000,
}

export default class CustomEmbed extends EmbedBuilder {
  constructor() {
    super()

    this.setColor('#17ce3a')
  }

  setPredefinedColor(color: keyof typeof COLORS) {
    return this.setColor(COLORS[color])
  }

  setTierColor(userOrTier: User | number) {
    const tier = typeof userOrTier === 'number' ? userOrTier : userOrTier.tier

    return this.setColor(tierMapping.get(tier)!.color)
  }
}
