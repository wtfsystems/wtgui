/**
 * @author Matthew Evans
 * @module wtfsystems/wtgui
 * @see README.md
 * @copyright MIT see LICENSE.md
 */

import type { App, Plugin } from 'vue'

//  Menu - regestered in plugin
import WtguiMenu from './components/WtguiMenu.vue'

//  Start menu - called via import
export { default as WTGuiStartMenu } from './routes/WTGuiStartMenu.vue'

//  Items - called via import
export { default as WTGuiButton } from './components/WTGuiButton.vue'
export { default as WTGuiInputSetting } from './components/WTGuiInputSetting.vue'
export { default as WTGuiLabel } from './components/WTGuiLabel.vue'
export { default as WTGuiMessageBox } from './components/WTGuiMessageBox.vue'
export { default as WTGuiSelect } from './components/WTGuiSelect.vue'

//  Export plugin
export const WTGui:Plugin = {
  install: (app:App, options:WTGuiOptions) => {
    app.component('WtguiMenu', WtguiMenu)

    if(options.gameTitle === undefined)
      console.warn('Must provide a Game Title option for WTGui!')
    app.provide('gameTitle', options.gameTitle)

    if(options.fontStyle === undefined) options.fontStyle = 'Arial'
    app.provide('fontStyle', options.fontStyle)

    if(options.titleColor === undefined) options.titleColor = 'rgb(255, 0, 0)'
    app.provide('titleColor', options.titleColor)

    if(options.borderColor === undefined) options.borderColor = 'rgb(255, 0, 0)'
    app.provide('borderColor', options.borderColor)

    if(options.itemColor === undefined) options.itemColor = 'rgb(255, 0, 0)'
    app.provide('itemColor', options.itemColor)

    if(options.focusColor === undefined) options.focusColor = 'rgb(100, 108, 255)'
    app.provide('focusColor', options.focusColor)

    if(options.mainMenu === undefined) options.mainMenu = '/main'
    app.provide('mainMenu', options.mainMenu)
  }
}
