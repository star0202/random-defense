import { tierMapping } from '../constants'
import CronManager from '../structures/Cron'
import CustomEmbed from '../structures/Embed'
import CustomExt from '../structures/Extension'
import Confirm from '../structures/components/Confirm'
import type { Problem } from '../types'
import { successEmoji } from '../utils/emoji'
import { option } from '@pikokr/command.ts'
import { SubCommandGroup } from '@pikokr/command.ts'
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js'

const random = new SubCommandGroup({
  name: 'random',
  description: '랜덤 디펜스',
})

class Random extends CustomExt {
  private userCache = new Map<string, { time: number; problem: Problem }>()

  private readonly cron = new CronManager()

  constructor() {
    super()

    this.cron.add({
      cronTime: '0 6 * * *',
      onTick: () => {
        const now = (Date.now() / 1000) | 0

        this.userCache.forEach((v, k) => {
          if (now - v.time >= 86400) this.userCache.delete(k)
        })
      },
    })
  }

  @random.command({
    name: 'setup',
    description: '랜덤 디펜스 가입',
  })
  async setup(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.String,
      name: 'handle',
      description: 'BOJ 핸들',
      required: true,
    })
    handle: string,
    @option({
      type: ApplicationCommandOptionType.String,
      name: 'query',
      description: '기본 문제 쿼리',
    })
    query?: string,
    @option({
      type: ApplicationCommandOptionType.Boolean,
      name: 'show_tier',
      description: '티어 표시 여부',
    })
    showTier?: boolean
  ) {
    await i.deferReply()

    const _showTier = !!showTier

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (data && data.handle === handle) {
      await this.db.randomUser.update({
        where: {
          id: i.user.id,
        },
        data: {
          handle,
          query,
          showTier: _showTier,
        },
      })

      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('설정 수정 완료')
            .setDescription('설정 수정이 완료되었습니다.'),
        ],
      })
    }

    const res = await i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('인증 필요')
          .setDescription(
            `1000번 문제에서 컴파일 에러를 받은 뒤 '확인' 버튼을 눌러주세요. (1분 뒤 만료)`
          ),
      ],
      components: [new Confirm()],
    })

    let end = false
    res
      .createMessageComponentCollector({
        filter: (j) => j.user.id === i.user.id,
        time: 60000,
      })
      .on('collect', async (c) => {
        if (c.customId === 'confirm') {
          const status = await this.baekjoonRequest.getLatestStatus(
            handle,
            1000
          )

          if (!status || status.result !== '컴파일 에러') {
            await c.update({
              embeds: [
                new CustomEmbed()
                  .setTitle('인증 실패')
                  .setDescription('인증에 실패했습니다.')
                  .setPredefinedColor('RED'),
              ],
              components: [],
            })

            return
          }

          await this.db.randomUser.create({
            data: {
              id: i.user.id,
              handle,
              query,
              showTier: _showTier,
            },
          })

          await c.update({
            embeds: [
              new CustomEmbed()
                .setTitle('가입 완료')
                .setDescription('가입이 완료되었습니다.'),
            ],
            components: [],
          })

          end = true
        } else {
          await c.update({
            embeds: [
              new CustomEmbed()
                .setTitle('인증 취소')
                .setDescription('인증이 취소되었습니다.')
                .setPredefinedColor('RED'),
            ],
            components: [],
          })

          end = true
        }
      })
      .on('end', async () => {
        if (end) return

        await i.editReply({
          embeds: [
            new CustomEmbed()
              .setTitle('인증 만료')
              .setDescription('인증이 만료되었습니다.')
              .setPredefinedColor('RED'),
          ],
          components: [],
        })
      })
  }

  @random.command({
    name: 'settings',
    description: '랜덤 디펜스 설정',
  })
  async settings(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.String,
      name: 'query',
      description: '문제 쿼리',
    })
    query?: string,
    @option({
      type: ApplicationCommandOptionType.Boolean,
      name: 'show_tier',
      description: '티어 표시 여부',
    })
    showTier?: boolean
  ) {
    await i.deferReply()

    const _showTier = !!showTier

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    await this.db.randomUser.update({
      where: {
        id: i.user.id,
      },
      data: {
        query,
        showTier: _showTier,
      },
    })

    i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('설정 완료')
          .setDescription('설정이 완료되었습니다.'),
      ],
    })
  }

  @random.command({
    name: 'profile',
    description: '랜덤 디펜스 프로필',
  })
  async profile(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const { handle, query, showTier } = data
    const { profileImageUrl, tier } = await this.solvedRequest.getUser(handle)

    i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('랜덤 디펜스 프로필')
          .setThumbnail(profileImageUrl)
          .addFields(
            {
              name: '핸들',
              value: handle,
            },
            {
              name: '기본 쿼리',
              value: query ? `\`${query}\`` : '없음',
            },
            {
              name: '티어 표시 여부',
              value: showTier ? '표시' : '표시 안 함',
            }
          )
          .setTierColor(tier),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setURL(`https://acmicpc.net/user/${handle}`)
            .setLabel('BOJ 프로필')
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setURL(`https://solved.ac/profile/${handle}`)
            .setLabel('solved.ac 프로필')
            .setStyle(ButtonStyle.Link)
        ),
      ],
    })
  }

  @random.command({
    name: 'stats',
    description: '랜덤 디펜스 통계',
  })
  async stats(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.Boolean,
      name: 'tier',
      description: '티어별 통계',
    })
    tier?: boolean
  ) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
      select: {
        stats: true,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const { stats } = data

    const total = stats.length

    if (!total) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('통계 없음')
            .setDescription('통계가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    if (tier) {
      const unrated = stats.filter((v) => v.tier === 0)
      const bronze = stats.filter((v) => v.tier >= 1 && v.tier <= 5)
      const silver = stats.filter((v) => v.tier >= 6 && v.tier <= 10)
      const gold = stats.filter((v) => v.tier >= 11 && v.tier <= 15)
      const platinum = stats.filter((v) => v.tier >= 16 && v.tier <= 20)
      const diamond = stats.filter((v) => v.tier >= 21 && v.tier <= 25)
      const ruby = stats.filter((v) => v.tier >= 26 && v.tier <= 30)

      const embed = new CustomEmbed().setTitle('랜덤 디펜스 통계 (티어별)')

      ;[unrated, bronze, silver, gold, platinum, diamond, ruby].forEach((v) => {
        if (!v.length) return

        const total = v.length
        const solved = v.filter((v) => v.success).length

        const avgTime =
          v.reduce((acc, cur) => acc + cur.submittedAfter, 0) / solved

        embed.addFields({
          name: tierMapping.get(v[0].tier)!.name.split(' ')[0],
          value: `${solved}/${total} of ${stats.length} (${(
            (total / stats.length) *
            100
          ).toFixed(2)}%, solved: ${(solved / total) * 100}%, avg: ${
            (avgTime / 60) | 0
          }분 ${avgTime % 60 | 0}초)`,
        })
      })

      return i.editReply({
        embeds: [embed],
      })
    }

    const success = stats.filter((v) => v.success)

    const solved = success.length

    const avgTime =
      success.reduce((acc, cur) => acc + cur.submittedAfter, 0) / solved

    const highestTier =
      tierMapping.get(Math.max(...success.map((v) => v.tier)))?.name ?? '없음'
    const avgTier =
      tierMapping.get(
        Math.round(success.reduce((acc, cur) => acc + cur.tier, 0) / solved)
      )?.name ?? '없음'
    const avgTierTries = tierMapping.get(
      Math.round(stats.reduce((acc, cur) => acc + cur.tier, 0) / total)
    )!.name

    i.editReply({
      embeds: [
        new CustomEmbed().setTitle('랜덤 디펜스 통계').addFields(
          {
            name: '시도한 문제 수',
            value: `${total}문제`,
            inline: true,
          },
          {
            name: '푼 문제 수',
            value: `${solved}문제 (${((solved / total) * 100).toFixed(2)}%)`,
            inline: true,
          },
          {
            name: '평균 성공 시간',
            value: `${(avgTime / 60) | 0}분 ${avgTime % 60 | 0}초`,
            inline: true,
          },
          {
            name: '최고 성공 티어',
            value: highestTier,
            inline: true,
          },
          {
            name: '평균 성공 티어',
            value: avgTier,
            inline: true,
          },
          {
            name: '평균 시도 티어',
            value: avgTierTries,
            inline: true,
          }
        ),
      ],
    })
  }

  @random.command({
    name: 'start',
    description: '랜덤 디펜스 시작',
  })
  async start(
    i: ChatInputCommandInteraction,
    @option({
      type: ApplicationCommandOptionType.String,
      name: 'query',
      description: '문제 쿼리',
    })
    query?: string
  ) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const _query = query ?? data.query

    if (!_query) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('쿼리 없음')
            .setDescription('쿼리가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const problem = await this.solvedRequest.getRandomProblem(
      _query.replaceAll('$me', data.handle)
    )

    if (!problem) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('문제 없음')
            .setDescription('문제가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    if (this.userCache.has(i.user.id))
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('시작 실패')
            .setDescription(
              '이미 진행 중인 문제가 있습니다.\n`/random now`로 확인하거나 `/random end`로 종료할 수 있습니다.'
            )
            .setPredefinedColor('RED'),
        ],
      })

    const { problemId, titleKo, acceptedUserCount, level, averageTries } =
      problem

    this.userCache.set(i.user.id, {
      time: (Date.now() / 1000) | 0,
      problem,
    })

    const embed = new CustomEmbed()
      .setTitle(`**/<${problemId}>** ${titleKo}`)
      .setDescription(
        '문제를 풀거나 포기한 뒤 `/random end`로 종료할 수 있습니다.'
      )
      .addFields(
        {
          name: '난이도',
          value: data.showTier ? tierMapping.get(level)!.name : '*숨겨짐*',
          inline: true,
        },
        {
          name: '맞힌 사람',
          value: `${acceptedUserCount}명`,
          inline: true,
        },
        {
          name: '평균 시도 횟수',
          value: `${averageTries}회`,
          inline: true,
        }
      )

    if (data.showTier) embed.setTierColor(level)

    i.editReply({
      content:
        '⚠️ 매일 KST 06:00에 시작한 지 24시간이 지난 문제는 자동으로 종료됩니다.',
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setURL(`https://acmicpc.net/problem/${problemId}`)
            .setLabel('문제 바로가기')
            .setStyle(ButtonStyle.Link)
        ),
      ],
    })
  }

  @random.command({
    name: 'now',
    description: '랜덤 디펜스 현황',
  })
  async now(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const cache = this.userCache.get(i.user.id)

    if (!cache) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('진행 중인 문제 없음')
            .setDescription(
              '진행 중인 문제가 없습니다.\n`/random start`로 시작할 수 있습니다.'
            )
            .setPredefinedColor('RED'),
        ],
      })
    }

    const { time, problem } = cache

    const { problemId, titleKo, acceptedUserCount, level, averageTries } =
      problem

    const embed = new CustomEmbed()
      .setTitle(`**/<${problemId}>** ${titleKo}`)
      .setDescription(
        '문제를 풀거나 포기한 뒤 `/random end`로 종료할 수 있습니다.'
      )
      .addFields(
        {
          name: '난이도',
          value: data.showTier ? tierMapping.get(level)!.name : '*숨겨짐*',
          inline: true,
        },
        {
          name: '맞힌 사람',
          value: `${acceptedUserCount}명`,
          inline: true,
        },
        {
          name: '평균 시도 횟수',
          value: `${averageTries}회`,
          inline: true,
        },
        {
          name: '시작 시간',
          value: `<t:${time}:R>`,
        }
      )

    if (data.showTier) embed.setTierColor(level)

    i.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setURL(`https://acmicpc.net/problem/${problemId}`)
            .setLabel('문제 바로가기')
            .setStyle(ButtonStyle.Link)
        ),
      ],
    })
  }

  @random.command({
    name: 'end',
    description: '랜덤 디펜스 종료',
  })
  async end(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const cache = this.userCache.get(i.user.id)

    if (!cache) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('진행 중인 문제 없음')
            .setDescription(
              '진행 중인 문제가 없습니다.\n`/random start`로 시작할 수 있습니다.'
            )
            .setPredefinedColor('RED'),
        ],
      })
    }

    const { handle } = data
    const { time, problem } = cache
    const { problemId, level, titleKo } = problem

    const status = await this.baekjoonRequest.getLatestStatus(
      handle,
      problemId,
      time,
      true
    )
    const success = !!status

    const submittedAfter = success ? status.time - time : 0
    const minutes = (submittedAfter / 60) | 0
    const seconds = submittedAfter % 60

    await this.db.randomUser.update({
      where: {
        id: i.user.id,
      },
      data: {
        stats: {
          create: [
            {
              problem: problemId,
              success,
              tier: level,
              time,
              title: titleKo,
              submittedAfter,
            },
          ],
        },
      },
    })

    this.userCache.delete(i.user.id)

    const embed = new CustomEmbed()
      .setTitle(`**/<${problemId}>** ${problem.titleKo}`)
      .setDescription(`${successEmoji(success)} ${success ? '성공' : '실패'}`)
      .setFooter({
        text: `난이도: ${tierMapping.get(level)!.name}`,
      })

    if (success) {
      embed.setTierColor(level).addFields({
        name: '걸린 시간',
        value: `${minutes}분 ${seconds}초`,
      })
    } else embed.setPredefinedColor('RED')

    i.editReply({
      embeds: [embed],
    })
  }

  @random.command({
    name: 'history',
    description: '랜덤 디펜스 기록',
  })
  async history(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
      select: {
        stats: {
          orderBy: {
            time: 'desc',
          },
          take: 5,
        },
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const { stats } = data

    if (!stats.length) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('기록 없음')
            .setDescription('기록이 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('랜덤 디펜스 기록')
          .addFields(
            ...stats.map((v) => ({
              name:
                `${successEmoji(v.success)} **/<${v.problem}>** ${v.title} ` +
                (v.success
                  ? `(${(v.submittedAfter / 60) | 0}분 ${
                      v.submittedAfter % 60 | 0
                    }초)`
                  : ''),
              value: `[**링크**](https://acmicpc.net/problem${v.problem}) <t:${v.time}:R>`,
            }))
          )
          .setFooter({
            text: '최근 5개의 기록만 표시됩니다.',
          }),
      ],
    })
  }

  @random.command({
    name: 'exit',
    description: '랜덤 디펜스 탈퇴',
  })
  async exit(i: ChatInputCommandInteraction) {
    await i.deferReply()

    const data = await this.db.randomUser.findUnique({
      where: {
        id: i.user.id,
      },
    })

    if (!data) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('유저 정보 없음')
            .setDescription('유저 정보가 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const res = await i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('탈퇴 확인')
          .setDescription(
            '정말 탈퇴하시겠습니까?\n탈퇴하시면 모든 정보가 삭제됩니다.'
          ),
      ],
      components: [new Confirm()],
    })

    res
      .createMessageComponentCollector({
        filter: (j) => j.user.id === i.user.id,
      })
      .on('collect', async (c) => {
        if (c.customId === 'confirm') {
          await this.db.randomUser.delete({
            where: {
              id: i.user.id,
            },
          })

          await c.update({
            embeds: [
              new CustomEmbed()
                .setTitle('탈퇴 완료')
                .setDescription('탈퇴가 완료되었습니다.'),
            ],
            components: [],
          })
        } else {
          await c.update({
            embeds: [
              new CustomEmbed()
                .setTitle('탈퇴 취소')
                .setDescription('탈퇴가 취소되었습니다.')
                .setPredefinedColor('RED'),
            ],
            components: [],
          })
        }
      })
  }

  @random.command({
    name: 'kill',
    description: '[OWNER] 랜덤 디펜스 강제 종료',
  })
  async kill(i: ChatInputCommandInteraction) {
    await i.deferReply({
      ephemeral: true,
    })

    if (!(await this.commandClient.isOwner(i.user))) {
      return i.editReply({
        embeds: [
          new CustomEmbed()
            .setTitle('권한 없음')
            .setDescription('권한이 없습니다.')
            .setPredefinedColor('RED'),
        ],
      })
    }

    const problems: string[] = []

    this.userCache.forEach((v, k) =>
      problems.push(`<@${k}>: **/<${v.problem.problemId}>**: <t:${v.time}:R>`)
    )

    const res = await i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('문제 리스트')
          .setDescription(problems.join('\n')),
      ],
      components: [new Confirm()],
    })

    res
      .createMessageComponentCollector({
        filter: (j) => j.user.id === i.user.id,
      })
      .on('collect', async (c) => {
        if (c.customId === 'confirm') {
          await c.update({
            embeds: [
              new CustomEmbed()
                .setTitle('종료 완료')
                .setDescription('종료가 완료되었습니다.'),
            ],
            components: [],
          })

          this.userCache.clear()
        } else {
          await c.update({
            embeds: [
              new CustomEmbed()
                .setTitle('종료 취소')
                .setDescription('종료가 취소되었습니다.')
                .setPredefinedColor('RED'),
            ],
            components: [],
          })
        }
      })
  }

  @random.command({
    name: 'help',
    description: '랜덤 디펜스 도움말',
  })
  async help(i: ChatInputCommandInteraction) {
    await i.deferReply()

    i.editReply({
      embeds: [
        new CustomEmbed()
          .setTitle('랜덤 디펜스 도움말')
          .setThumbnail(
            this.client.user!.displayAvatarURL({
              size: 1024,
            })
          )
          .setDescription('모든 명령어는 `/random`으로 시작합니다.')
          .addFields(
            {
              name: 'setup',
              value: '랜덤 디펜스에 가입합니다.',
            },
            {
              name: 'settings',
              value: '랜덤 디펜스 설정을 수정합니다.',
            },
            {
              name: 'profile',
              value: '랜덤 디펜스 프로필을 확인합니다.',
            },
            {
              name: 'stats',
              value: '랜덤 디펜스 통계를 확인합니다.',
            },
            {
              name: 'start',
              value: '랜덤 디펜스를 시작합니다.',
            },
            {
              name: 'now',
              value: '랜덤 디펜스 현황을 확인합니다.',
            },
            {
              name: 'end',
              value: '랜덤 디펜스를 종료합니다.',
            },
            {
              name: 'history',
              value: '랜덤 디펜스 기록을 확인합니다.',
            },
            {
              name: 'exit',
              value: '랜덤 디펜스를 탈퇴합니다.',
            }
          )
          .setFooter({
            text: 'Made by 스타샤(@starcea)',
          }),
      ],
    })
  }
}

export const setup = async () => new Random()
