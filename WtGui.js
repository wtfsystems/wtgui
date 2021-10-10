/* ****************************************
 *
 * Filename:  WtGui.js
 * 
 **************************************** */

const { Gamepads } = require('gamepads')

/*
 *
 */
class WtGuiError extends Error {
    constructor(message) {
        super(message)
        if(Error.captureStackTrace) {
            Error.captureStackTrace(this, WtGuiError);
        }
    }
}
exports.WtGuiError = WtGuiError

/*
 *
 */
const argParser = (scope, data, args) => {
    args.forEach((arg) => {
        if(data[arg] === undefined)
            throw new WtGuiError(`${arg} undefined.`)
        scope[arg] = data[arg]
    })
}

/*
 *
 */
class WtGui {
    /*
     *
     */
    static settings = {
        width: 0,
        height: 0,
        bgcolor: 'rgba(0,0,0,255)',
        canvas: 'WTGuiCanvas'
    }
    static #singleton = undefined

    #menus = []
    #openedMenus = []
    #renderer = {}

    #menuRunning = false
    #gameRunning = false

    /*
     *
     */
    constructor(args) {
        if(WtGui.#singleton === undefined) WtGui.#singleton = this 
        else return WtGui.#singleton
        var args = args || {}
        if(args.width !== undefined) WtGui.settings.width = args.width
        if(args.height !== undefined) WtGui.settings.height = args.height
        if(!(WtGui.settings.width > 0)) throw new WtGuiError(`width undefined.`)
        if(!(WtGui.settings.height > 0)) throw new WtGuiError(`height undefined.`)
        return WtGui.#singleton
    }

    /*
     *
     */
    #renderGui = () => {
        if(this.#openedMenus.length === 0) {
            if(this.#gameRunning) this.openMenu('game_menu')
            else this.openMenu('main_menu')
        }
        if(this.#openedMenus.length === 0) throw new WtGuiError(`No menus available.`)
        this.#openedMenus[(this.#openedMenus.length - 1)]
        const ctx = this.#getCanvas().getContext('2d')
        ctx.fillStyle = WtGui.settings.bgcolor
        ctx.fillRect(0, 0, WtGui.settings.width, WtGui.settings.height)
    }

    /*
     *
     */
    #configCanvas = () => {
        const canvas = this.#getCanvas()
        canvas.width = WtGui.settings.width
        canvas.height = WtGui.settings.height
    }

    /*
     *
     */
    #getCanvas = () => { return document.getElementById(WtGui.settings.canvas) }

    /*
     *
     */
    startRenderer = () => {
        this.#configCanvas()
        this.#renderer = setInterval(this.#renderGui(), 33)
        this.#menuRunning = true
    }

    /*
     *
     */
    stopRenderer = () => {
        clearInterval(this.#renderer)
        this.#menuRunning = false
    }

    /*
     *
     */
    isRunning = () => { return this.#menuRunning }

    /*
     *
     */
    addMenu = (menuObj) => {
        if(this.getMenu(menuObj.id) !== undefined) return false
        if(typeof menu !== WtGuiMenu) return false
        this.#menus.push(menuObj)
        return true
    }

    /*
     *
     */
    getMenu = (id) => { return this.#menus.find((elm) => { elm.id === id }) }

    /*
     *
     */
    addItem = (menuid, itemObj) => {
        const menu = this.getMenu(menuid)
        if(menu === undefined) return false
        if(typeof itemObj !== WtGuiItem) return false
        menu.items.push(itemObj)
        return true
    }

    /*
     *
     */
    openMenu = (id) => {
        const tempMenu = this.getMenu(id)
        if(tempMenu === undefined) return false
        this.#openedMenus.push(tempMenu)
        return true
    }

    /*
     *
     */
    closeMenu = (bool) => { (bool) ? this.#openedMenus = [] : this.#openedMenus.pop() }
}
exports.WtGui = WtGui

/*
 *
 */
class WtGuiMenu {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        argParser(this, args,
            [ 'id', 'title',
              'pos_x', 'pos_y',
              'width', 'height' ])
        this.items = []
    }
}
exports.WtGuiMenu = WtGuiMenu

/*
 *
 */
class WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        argParser(this, args,
            [ 'id', 'title',
              'pos_x', 'pos_y',
              'width', 'height' ])
    }
}
exports.WtGuiItem = WtGuiItem

/*
 *
 */
class WtGuiButton extends WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiButton = WtGuiButton

/*
 *
 */
class WtGuiLabel extends WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiLabel = WtGuiLabel

/*
 *
 */
class WtGuiInput extends WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiInput = WtGuiInput
