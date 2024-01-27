import type CustomClient from './Client'
import { Extension } from '@pikokr/command.ts'

export default class CustomExt extends Extension {
  protected get commandClient() {
    return super.commandClient as CustomClient
  }

  protected get db() {
    return this.commandClient.db
  }

  protected get baekjoonRequest() {
    return this.commandClient.baekjoonRequest
  }

  protected get solvedRequest() {
    return this.commandClient.solvedRequest
  }
}
