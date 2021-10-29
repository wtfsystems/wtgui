/** ****************************************
 * 
 * @author Matthew Evans
 * @module wtfsystems/wtgui
 * @version 0.0.1
 * @see README.me
 * @copyright LICENSE.md
 * 
 **************************************** */

/**
 * Custom error object
 */
class WtGuiError extends Error {
    /**
     * Create a new WtGuiError
     * @param {String} message 
     */
    constructor(message) {
        super(message)
        if(Error.captureStackTrace)
            Error.captureStackTrace(this, WtGuiError)
    }
}
exports.WtGuiError = WtGuiError

/*
 * Parse required arguments.
 * @param {*} scope The scope (this).
 * @param {*} data Data to parse.
 * @param {*} args Arguments to parse for.
 */
const argParser = (scope, data, args) => {
    args.forEach((arg) => {
        if(data[arg] === undefined) throw new WtGuiError(`${scope}:\n${arg} undefined.`)
        scope[arg] = data[arg]
    })
}

/** ***************************************
 *
 * WtGui main object
 * 
 *************************************** */
class WtGui {
    /**
     * Don't allow direct construction
     * @returns false
     */
    constructor() { return false }

    /**
     * Module settings
     * @prop {Number} width
     * @prop {Number} height
     * @prop {String} defaultFont
     * @prop {String} clearColor
     * @prop {String} defaultMenu
     */
    static settings = {
        width: Number(0),
        height: Number(0),
        defaultFont: '12px Arial',
        clearColor: 'rgb(255,255,255)',
        defaultMenu: 'main_menu'
    }

    /**
     * Module info
     * @prop {Number} fps
     * @prop {Number} frameDelta
     * @prop {Number} lastRender
     * @prop {Number} mousePosX
     * @prop {Number} mousePosY
     */
    static info = {
        get fps() { return WtGui.#renderer.fps },
        get frameDelta() { return WtGui.#renderer.frameDelta },
        get lastRender() { return WtGui.#renderer.lastRender },
        get mousePosX() { return WtGui.#data.mouseCords.posX },
        get mousePosY() { return WtGui.#data.mouseCords.posY }
    }

    /*
     * Gui Data
     */
    static #data = {
        mouseCords: {
            posX: Number(0),
            posY: Number(0)
        },
        canvas: {},            //  Reference to canvas
        configRan: false,      //  Flag to verify config runs once
        imageFiles: [],        //  Array of image files
        menus: [],             //  Array of available menus
        openedMenus: [],       //  Stack of opened menus
        currentMenu: {},       //  Current opened menu
        bgAnimation: () => {}  //  Background animation
    }

    /**
     * Configure canvas and start the gui
     * @param {HTMLCanvasElement} canvas 
     */
    static startGui = (canvas) => {
        if(WtGui.#data.configRan) throw new WtGuiError(`WtGui is already running.`)
        if(!(canvas instanceof HTMLCanvasElement))
            throw new WtGuiError(`${canvas} is not a HTMLCanvasElement.`)
        if(WtGui.settings.width < 1 || WtGui.settings.height < 1)
            throw new WtGuiError(`Must define a width and height.`)

        WtGui.#data.canvas = canvas
        WtGui.#data.canvas.width = WtGui.settings.width
        WtGui.#data.canvas.height = WtGui.settings.height

        WtGui.#data.canvas.addEventListener('mousedown', WtGui.#events.onMouseDown, false)
        WtGui.#data.canvas.addEventListener('mouseup', WtGui.#events.onMouseUp, false)
        WtGui.#data.canvas.addEventListener('mousemove', WtGui.#events.onMouseMove, false)

        WtGui.#data.canvas.addEventListener("touchstart", WtGui.#events.onTouchStart, false)
        WtGui.#data.canvas.addEventListener("touchend", WtGui.#events.onTouchEnd, false)
        WtGui.#data.canvas.addEventListener("touchcancel", WtGui.#events.onTouchCancel, false)
        WtGui.#data.canvas.addEventListener("touchmove", WtGui.#events.onTouchMove, false)

        window.addEventListener('keydown', WtGui.#events.onKeyDown, false)
        window.addEventListener('keyup', WtGui.#events.onKeyUp, false)

        WtGui.#data.canvas.renderCanvas = document.createElement('canvas')

        WtGui.#data.configRan = true
        WtGui.#renderer.start()
    }

    /**
     * 
     * @param {Function} func 
     */
    static setBgAnimation = (func) => {
        if(!(func instanceof Function)) throw new WtGuiError(`Background animation must be a function.`)
        WtGui.#data.bgAnimation = func
    }

    /**
     * Add an image
     * @param {String} id 
     * @param {*} file 
     */
    static addImage = (id, file) => {
        if(WtGui.getImage(id) !== undefined) throw new WtGuiError(`Image ID already exists.`)
        // load file
        WtGui.#data.imageFiles.push({ id: id, file: file })
    }

    /**
     * 
     * @param {*} data 
     */
    static addImages = (data) => {
        //
    }

    /**
     * Get an image
     * @param {String} id 
     * @returns 
     */
    static getImage = (id) => { return WtGui.#data.imageFiles.find(elm => elm.id === id) }

    /**
     * Add a menu
     * @param {*} menuObj 
     */
    static addMenu = (menuObj) => {
        if(!(menuObj instanceof WtGuiMenu)) {         //  Verify proper menu object
            menuObj = WtGui.buildMenu(menuObj)        //  Try to build menu if not
            if(!(menuObj instanceof WtGuiMenu))       //  Fail if still not a menu
                throw new WtGuiError(`Object is not a valid menu.`)
        }
        if(WtGui.getMenu(menuObj.id) !== undefined)   //  Verify menu does not exist
            throw new WtGuiError(`Menu ID already exists.`)
        WtGui.#data.menus.push(menuObj)               //  Add menu
    }

    /**
     * Add a menu item
     * @param {String} menuId 
     * @param {WtGuiItem} itemObj 
     */
    static addItem = (menuId, itemObj) => {
        const menu = WtGui.getMenu(menuId)
        if(menu === undefined) throw new WtGuiError(`Menu does not exist.`)
        menu.addItem(itemObj)
    }

    /**
     * Build a menu from an object
     * @param {*} menuData 
     * @returns {WtGuiMenu}
     */
    static buildMenu = (menuData) => {
        const tempMenu = new WtGuiMenu(menuData)
        return tempMenu
    }

    /**
     * Get a menu
     * @param {String} id 
     * @returns {WtGuiMenu}
     */
    static getMenu = (id) => { return WtGui.#data.menus.find(elm => elm.id === id) }

    /**
     * Gui actions
     */
    static actions = {
        /**
         * Pause the gui
         */
        pauseGui: () => { WtGui.#renderer.paused = true },

        /**
         * Unpause the gui
         */
        unpauseGui: () => { WtGui.#renderer.paused = false },

        /**
         * Restart the gui
         */
        restartGui: () => {
            WtGui.#renderer.stop()
            WtGui.#renderer.start()
        },

        /**
         * Turn fps drawing on or off
         * @param {boolean} toggle 
         */
        drawFps: (toggle) => {
            (toggle) ? WtGui.#renderer.drawFps = true : WtGui.#renderer.drawFps = false
        },

        /**
         * Open a menu
         * @param {String} menuId 
         */
        openMenu: (menuId) => {
            const tempMenu = WtGui.getMenu(menuId)
            if(tempMenu === undefined) throw new WtGuiError(`Menu does not exist.`)
            WtGui.#data.openedMenus.push(tempMenu)
            WtGui.#data.currentMenu = WtGui.#data.openedMenus[(WtGui.#data.openedMenus.length - 1)]
        },

        /**
         * Close one or all menus
         * @param {boolean} closeAll 
         */
        closeMenu: (closeAll) => {
            if(closeAll) {
                WtGui.#data.openedMenus = []
                WtGui.#data.currentMenu = {}
            } else {
                WtGui.#data.openedMenus.pop()
                if(WtGui.#data.openedMenus.length === 0) WtGui.actions.openMenu(WtGui.settings.defaultMenu)
                else WtGui.#data.currentMenu = WtGui.#data.openedMenus[(WtGui.#data.openedMenus.length - 1)]
            }
        }
    }

    /*
     * Renderer sub-object
     */
    static #renderer = {
        fpsCalc: {},            //  Store timed func to calculate fps
        ctx: {},                //  Contex to draw to
        nextFrame: Number(0),   //  Store the call to the animation frame
        paused: false,          //  Flag to pause renderer
        drawFps: false,         //  Flag for drawing fps counter
        fps: Number(0),         //  Store frame rate
        step: Number(0),        //  Used to calculate fps
        frameDelta: Number(0),  //  Time in ms between frames
        lastRender: Number(0),  //  Last render time

        /*
         * Start the renderer
         */
        start: () => {
            WtGui.#data.canvas.renderCanvas.width = WtGui.settings.width
            WtGui.#data.canvas.renderCanvas.height = WtGui.settings.height
            clearInterval(WtGui.#renderer.fpsCalc)
            WtGui.#renderer.fpsCalc = setInterval(() => {
                WtGui.#renderer.fps = WtGui.#renderer.step
                WtGui.#renderer.step = 0
            }, 1000)
            window.cancelAnimationFrame(WtGui.#renderer.nextFrame)
            WtGui.#renderer.ctx = WtGui.#data.canvas.renderCanvas.getContext('2d')
            WtGui.#renderer.frameDelta = WtGui.#renderer.lastRender = Date.now()
            WtGui.#renderer.nextFrame = window.requestAnimationFrame(WtGui.#renderer.render)
        },

        /*
         * Stop the renderer
         */
        stop: () => {
            clearInterval(WtGui.#renderer.fpsCalc)
            window.cancelAnimationFrame(WtGui.#renderer.nextFrame)
            WtGui.#renderer.fps = WtGui.#renderer.step = 0
            WtGui.#renderer.frameDelta = WtGui.#renderer.lastRender = 0
        },

        /*
         * Render draw method
         */
        render: () => {
            if(WtGui.#data.openedMenus.length === 0 ||
               WtGui.#data.currentMenu === {} ||
               WtGui.#data.currentMenu === undefined) WtGui.actions.openMenu(WtGui.settings.defaultMenu)
            if(WtGui.#data.openedMenus.length === 0 ||
               WtGui.#data.currentMenu === {} ||
               WtGui.#data.currentMenu === undefined) throw new WtGuiError(`No menus available.`)
            const ctx = WtGui.#renderer.ctx
            const currentMenu = WtGui.#data.currentMenu

            //  Clear the renderer
            ctx.fillStyle = WtGui.settings.clearColor
            ctx.fillRect(0, 0, WtGui.settings.width, WtGui.settings.height)

            //  Run background animation function
            WtGui.#data.bgAnimation()

            //  Render the menu
            ctx.fillStyle = currentMenu.bgcolor
            ctx.fillRect(currentMenu.pos_x, currentMenu.pos_y,
                currentMenu.width, currentMenu.height)

            //  Render menu items
            currentMenu.items.forEach(elm => {
                ctx.fillStyle = elm.bgcolor
                ctx.fillRect(currentMenu.pos_x + elm.pos_x,
                    currentMenu.pos_y + elm.pos_y,
                    elm.width, elm.height)
            })

            //  Render FPS counter if enabled
            if(WtGui.#renderer.drawFps) {
                ctx.font = '12px Arial'
                ctx.fillStyle = 'orange'
                ctx.textAlign = 'right'
                ctx.fillText(WtGui.#renderer.fps, WtGui.settings.width, 12)
            }

            WtGui.#data.canvas.getContext('2d').drawImage(WtGui.#data.canvas.renderCanvas, 0, 0)
            WtGui.#renderer.step++
            WtGui.#renderer.frameDelta = Date.now() - WtGui.#renderer.lastRender
            WtGui.#renderer.lastRender = Date.now()
            while(WtGui.#renderer.paused) {}  //  Infinite loop for pause
            WtGui.#renderer.nextFrame = window.requestAnimationFrame(WtGui.#renderer.render)
        }
    }

    /*
     * Events sub-object
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
            WtGui.#data.mouseCords.posX = event.offsetX
            WtGui.#data.mouseCords.posY = event.offsetY
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

    /**
     * Gui tests
     */
    static tests = {
        /**
         * Print the menu
         */
        printMenu: () => {
            console.log('menu:')
            console.log(WtGui.#data.menus)
        }
    }
}
exports.WtGui = WtGui

/* ****************************************
 *
 * Menu & menu item objects
 * 
 *************************************** */

/**
 * 
 */
class WtGuiMenu {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        argParser(this, args,
            [ 'id', 'title',
              'pos_x', 'pos_y',
              'width', 'height' ])
        this.items = []
        this.bgimage = args.bgimage || undefined
        this.font = args.font || WtGui.settings.defaultFont
        this.bgcolor = args.bgcolor || 'rgb(0,0,0)'
        this.fgcolor = args.fgcolor || 'rgb(255,255,255)'
    }

    /**
     * 
     * @param {WtGuiItem} itemObj 
     */
    addItem = (itemObj) => {
        if(!(itemObj instanceof WtGuiItem))  //  Verify proper item object
            throw new WtGuiError(`Object is not a valid menu item.`)
        //  Verify item does not already exist
        if(this.items.find(elm => elm.id === itemObj.id) !== undefined)
            throw new WtGuiError(`Item ID already exists.`)
        this.items.push(itemObj)  //  Add item
    }
}
exports.WtGuiMenu = WtGuiMenu

/**
 * 
 * @interface
 */
class WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        argParser(this, args,
            [ 'id', 'title',
              'pos_x', 'pos_y',
              'width', 'height'])
        this.font = args.font || WtGui.settings.defaultFont
        this.bgcolor = args.bgcolor || 'rgb(255,0,0)'
        this.fgcolor = args.fgcolor || 'rgb(255,255,255)'
    }
}
exports.WtGuiItem = WtGuiItem

/**
 * 
 * @extends WtGuiItem
 */
class WtGuiLabel extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiLabel = WtGuiLabel

/**
 * 
 * @extends WtGuiItem
 */
class WtGuiButton extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiButton = WtGuiButton

/**
 * 
 * @extends WtGuiItem
 */
class WtGuiInput extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiInput = WtGuiInput

/**
 * 
 * @extends WtGuiItem
 */
class WtGuiSelection extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiSelection = WtGuiSelection

/**
 * 
 * @extends WtGuiItem
 */
class WtGuiToggle extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiToggle = WtGuiToggle

/**
 * 
 * @extends WtGuiItem
 */
class WtGuiAction extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
    }
}
exports.WtGuiAction = WtGuiAction
