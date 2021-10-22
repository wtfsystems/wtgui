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
        if(Error.captureStackTrace)
            Error.captureStackTrace(this, WtGuiError)
    }
}
exports.WtGuiError = WtGuiError

/*
 *
 */
const argParser = (scope, data, args) => {
    args.forEach((arg) => {
        if(data[arg] === undefined) throw new WtGuiError(`${arg} undefined.`)
        scope[arg] = data[arg]
    })
}

/*
 *
 */
class WtGui {
    constructor() { return false }  //  Don't allow direct construction

    /*
     * Config this
     */
    static settings = {
        width: Number(0),
        height: Number(0),
        clearColor: 'rgba(0,0,0,0)',  //
        defaultMenu: 'main_menu',     //  Default menu to use
        bgimage: {
            file: undefined
        }
    }

    /*
     * Read this
     */
    static info = {
        get fps() { return WtGui.#data.fps },
        get mousePosX() { return WtGui.#data.mouseCords.posX },
        get mousePosY() { return WtGui.#data.mouseCords.posY }
    }

    /*
     * From here
     */
    static #data = {
        fps: Number(0),
        mouseCords: {
            posX: Number(0),
            posY: Number(0)
        }
    }

    /*
     *
     */
    static #menus = []                 //  Array of available menus
    static #openedMenus = []           //  Array of opened menus
    static #currentMenu = undefined    //  Current opened menu
    static #canvas = null              //  Reference to canvas
    static #configRan = false          //  Flag to verify config runs once

    /*
     *
     */
    static startGui = (canvas) => {
        if(WtGui.#configRan) throw new WtGuiError(`WtGui is already running.`)
        if(!(canvas instanceof HTMLCanvasElement))
            throw new WtGuiError(`${canvas} is not a HTMLCanvasElement`)
        WtGui.#canvas = canvas

        WtGui.#canvas.width = WtGui.settings.width
        WtGui.#canvas.height = WtGui.settings.height

        WtGui.#canvas.addEventListener('mousedown', WtGui.#events.onMouseDown, false)
        WtGui.#canvas.addEventListener('mouseup', WtGui.#events.onMouseUp, false)
        WtGui.#canvas.addEventListener('mousemove', WtGui.#events.onMouseMove, false)

        WtGui.#canvas.addEventListener("touchstart", WtGui.#events.onTouchStart, false)
        WtGui.#canvas.addEventListener("touchend", WtGui.#events.onTouchEnd, false)
        WtGui.#canvas.addEventListener("touchcancel", WtGui.#events.onTouchCancel, false)
        WtGui.#canvas.addEventListener("touchmove", WtGui.#events.onTouchMove, false)

        window.addEventListener('keydown', WtGui.#events.onKeyDown, false)
        window.addEventListener('keyup', WtGui.#events.onKeyUp, false)

        WtGui.#canvas.renderCanvas = document.createElement('canvas')
        WtGui.#canvas.renderCanvas.width = WtGui.settings.width
        WtGui.#canvas.renderCanvas.height = WtGui.settings.height

        WtGui.#data.fps = 0
        WtGui.#configRan = true
        WtGui.#renderer.start()
    }

    /*
     *
     */
    static pause = () => { WtGui.#renderer.paused = true }

    /*
     *
     */
    static unpause = () => { WtGui.#renderer.paused = false }

    /*
     *
     */
    static addMenu = (menuObj) => {
        if(!(menuObj instanceof WtGuiMenu)) {         //  Verify proper menu object
            menuObj = WtGui.buildMenu(menuObj)        //  Try to build menu if not
            if(!(menuObj instanceof WtGuiMenu))       //  Fail if still not a menu
                throw new WtGuiError('Object is not a valid menu')
        }
        if(WtGui.#getMenu(menuObj.id) !== undefined)  //  Verify menu does not exist
            throw new WtGuiError('Menu ID already exists')
        WtGui.#menus.push(menuObj)                    //  Add menu
    }

    /*
     *
     */
    static addItem = (menuId, itemObj) => {
        if(!(itemObj instanceof WtGuiItem))  //  Verify proper item object
            throw new WtGuiError('Object is not a valid menu item')
        const menu = WtGui.#getMenu(menuId)
        //  Verify menu exists
        if(menu === undefined) throw new WtGuiError('Menu does not exist')
        //  Verify item does not already exist
        if(menu.items.find(elm => elm.id === itemObj.id) !== undefined)
            throw new WtGuiError('Item ID already exists')
        menu.items.push(itemObj)             //  Add item
    }

    /*
     *
     */
    static buildMenu = (menuData) => {
        const tempMenu = new WtGuiMenu(menuData)
        return tempMenu
    }

    /*
     *
     */
    static #getMenu = (menuId) => { return WtGui.#menus.find(elm => elm.id === menuId) }

    /*
     *
     */
    static actions = {
        /*
         *
         */
        openMenu: (menuId) => {
            const tempMenu = WtGui.#getMenu(menuId)
            if(tempMenu === undefined) return false
            WtGui.#openedMenus.push(tempMenu)
            WtGui.#currentMenu = WtGui.#openedMenus[(WtGui.#openedMenus.length - 1)]
            return true
        },

        /*
         *
         */
        closeMenu: (closeAll) => {
            if(closeAll) {
                WtGui.#openedMenus = []
                WtGui.#currentMenu = undefined
            } else {
                WtGui.#openedMenus.pop()
                if(WtGui.#openedMenus.length === 0) WtGui.actions.openMenu(WtGui.settings.defaultMenu)
                WtGui.#currentMenu = WtGui.#openedMenus[(WtGui.#openedMenus.length - 1)]
            }
        }
    }

    /*
     *
     */
    static #renderer = {
        fpsCalc: null,         //  Store timed func to calculate fps
        ctx: null,             //  Contex to draw to
        rate: Number(0),       //  Used to calculate fps
        nextFrame: Number(0),  //  Store the call to the animation frame
        paused: false,         //  Flag to pause renderer

        /*
         *
         */
        start: () => {
            WtGui.#renderer.rate = 0
            clearInterval(WtGui.#renderer.fpsCalc)
            WtGui.#renderer.fpsCalc = setInterval(() => {
                WtGui.#data.fps = WtGui.#renderer.rate
                WtGui.#renderer.rate = 0
            }, 1000)
            if(WtGui.#renderer.nextFrame > 0)
                window.cancelAnimationFrame(WtGui.#renderer.nextFrame)
            WtGui.#renderer.ctx = WtGui.#canvas.renderCanvas.getContext('2d')
            WtGui.#renderer.nextFrame = window.requestAnimationFrame(WtGui.#renderer.render)
        },

        /*
         *
         */
        render: () => {
            if(WtGui.#openedMenus.length === 0 || WtGui.#currentMenu === undefined)
                WtGui.actions.openMenu(WtGui.settings.defaultMenu)
            if(WtGui.#currentMenu === undefined) throw new WtGuiError(`No menus available.`)
            const ctx = WtGui.#renderer.ctx

            //  Clear the renderer
            ctx.fillStyle = WtGui.settings.clearColor
            ctx.fillRect(0, 0, WtGui.settings.width, WtGui.settings.height)

            //  add background rendering

            //  Render the menu
            ctx.fillStyle = WtGui.#currentMenu.bgcolor
            ctx.fillRect(WtGui.#currentMenu.pos_x, WtGui.#currentMenu.pos_y,
                WtGui.#currentMenu.width, WtGui.#currentMenu.height)

            //  Render menu items
            WtGui.#currentMenu.items.forEach(elm => {
                ctx.fillStyle = elm.bgcolor
                ctx.fillRect(WtGui.#currentMenu.pos_x + elm.pos_x,
                    WtGui.#currentMenu.pos_y + elm.pos_y,
                    elm.width, elm.height)
            })

            WtGui.#canvas.getContext('2d').drawImage(WtGui.#canvas.renderCanvas, 0, 0)
            WtGui.#renderer.rate++
            while(WtGui.#renderer.paused) {}  //  Infinite loop for pause
            WtGui.#renderer.nextFrame = window.requestAnimationFrame(WtGui.#renderer.render)
        }
    }

    /*
     *
     */
    static #events = {
        /*
         *
         */
        onMouseDown: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onMouseUp: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onMouseMove: (event) => {
            WtGui.#data.mouseCords.posX = 0
            WtGui.#data.mouseCords.posY = 0
        },

        /*
         *
         */
        onTouchStart: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onTouchEnd: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onTouchCancel: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onTouchMove: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onKeyDown: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onKeyUp: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onButtonDown: (event) => {
            //alert(event)
        },

        /*
         *
         */
        onButtonUp: (event) => {
            //alert(event)
        }
    }

    /*
     *
     */
    static tests = {
        printMenu: () => {
            console.log('menu:')
            console.log(WtGui.#menus)
        }
    }
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
        this.bgimage = args.bgimage || undefined
        this.bgcolor = args.bgcolor || 'rgb(0,0,0)'
        this.fgcolor = args.fgcolor || 'rgb(255,255,255)'
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
              'width', 'height'])
        this.bgcolor = args.bgcolor || 'rgb(255,0,0)'
        this.fgcolor = args.fgcolor || 'rgb(255,255,255)'
    }
}
exports.WtGuiItem = WtGuiItem

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

/*
 *
 */
class WtGuiSelection extends WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiSelection = WtGuiSelection

/*
 *
 */
class WtGuiToggle extends WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiToggle = WtGuiToggle

/*
 *
 */
class WtGuiAction extends WtGuiItem {
    /*
     *
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiAction = WtGuiAction
