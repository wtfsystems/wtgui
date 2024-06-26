/**
 * @author Matthew Evans
 * @module wtfsystems/wtgui
 * @see README.md
 * @copyright MIT see LICENSE.md
 */

import { defineStore } from 'pinia'

/** Store value for the Selection test */
export const selectionStore = defineStore('selection', {
  state: () => ({
    options: [ 'Hello World', 'testing', 'test' ],
    value: 'testing'
  }),
  actions: { set(v:string) { this.value = v } }
})
