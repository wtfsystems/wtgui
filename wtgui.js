/**
 * 
 * @author Matthew Evans
 * @module wtfsystems/wtgui
 * @version 0.0.4
 * @see README.me
 * @copyright LICENSE.md
 * 
 */

const fs = require('fs')

/**
 * 
 * Custom error object
 * 
 */
class WtGuiError extends Error {
    /**
     * Create a new WtGuiError
     * @param {String} message Error message
     */
    constructor(message) {
        super(message)
        if(Error.captureStackTrace)
            Error.captureStackTrace(this, WtGuiError)
    }
}
exports.WtGuiError = WtGuiError

/**
 *
 * WtGui main object
 * @hideconstructor
 * 
 */
class WtGui {
    constructor() { return false }  //  Don't allow direct construction

    /**
     * WtGui Module settings
     * @prop {boolean} debugMode Enable/disable debug mode
     * @prop {Number} width Width of the gui
     * @prop {Number} height Height of the gui
     * @prop {Number} mouseSize Size of the mouse hitbox
     * @prop {String} clearColor Background color for gui context
     * @prop {String} defaultFont Default font size/face
     * @prop {String} defaultFontColor Default font color
     * @prop {String} defaultMenuColor Default menu background color
     * @prop {String} defaultItemColor Default item background color
     * @prop {String} defaultMenu Default menu to open when all are closed
     */
    static settings = {
        debugMode: false,
        width: Number(0),
        height: Number(0),
        mouseSize: Number(0),
        clearColor: 'rgb(142,142,142)',
        defaultFont: '12px Arial',
        defaultFontColor: 'rgb(255,255,255)',
        defaultMenuColor: 'rgb(0,0,0)',
        defaultItemColor: 'rgb(255,165,0)',
        defaultMenu: 'main_menu',

        keys: {
            menuUp: [ 'up' ],
            menuDown: [ 'down' ],
            menuLeft: [ 'left' ],
            menuRight: [ 'right' ],
            menuSelect: [ 'select' ],
            menuCancel: [ 'cancel' ]
        },

        buttons: {
            menuUp: [ 'up' ],
            menuDown: [ 'down' ],
            menuLeft: [ 'left' ],
            menuRight: [ 'right' ],
            menuSelect: [ 'select' ],
            menuCancel: [ 'cancel' ]
        }
    }

    /**
     * WtGui Module info
     * @prop {Number} fps Frames per second
     * @prop {Number} frameDelta Time between frames
     * @prop {Number} lastRender Time last frame render completed
     */
    static info = {
        get fps() { return WtGui.#renderer.fps },
        get frameDelta() { return WtGui.#renderer.frameDelta },
        get lastRender() { return WtGui.#renderer.lastRender }
    }

    /*
     * Gui Data
     */
    static #data = {
        menuStorage: undefined,  //  Storage for saving menu settings selection
        menuCanvas: {},          //  2d canvas for rendering menus
        glctx: {},               //  WebGL context for main drawing
        ctx: {},                 //  2d context for menu drawing
        configRan: false,        //  Flag to verify config runs once
        imageFiles: [],          //  Array of image files
        audioFiles: [],          //  Array of audio files
        menus: [],               //  Array of available menus
        openedMenus: [],         //  Stack of opened menus
        currentMenu: {},         //  Current opened menu
        activeItem: undefined    //  Active menu item
    }

    /**
     * Configure canvas and start the gui.
     * @param {HTMLCanvasElement} canvas Canvas element to configure.
     */
    static startGui = (canvas) => {
        if(WtGui.#data.menuStorage === undefined)
            throw new WtGuiError(`Please configure menu settings storage.`)
        if(WtGui.#data.configRan) throw new WtGuiError(`WtGui is already running.`)
        if(!(canvas instanceof HTMLCanvasElement))
            throw new WtGuiError(`'${canvas}' is not a HTMLCanvasElement.`)
        if(WtGui.settings.width < 1 || WtGui.settings.height < 1)
            throw new WtGuiError(`Must define a width and height.`)

        //WtGui.#data.glctx = canvas.getContext('webgl2')
        //if(!WtGui.#data.glctx) throw new WtGuiError(`webgl2 error`)
        WtGui.#data.glctx = canvas.getContext('2d')
        canvas.width = WtGui.settings.width
        canvas.height = WtGui.settings.height

        canvas.addEventListener('mousedown', WtGui.#events.onMouseDown, false)
        canvas.addEventListener('mouseup', WtGui.#events.onMouseUp, false)
        canvas.addEventListener('mousemove', WtGui.#events.onMouseMove, false)

        canvas.addEventListener("touchstart", WtGui.#events.onTouchStart, false)
        canvas.addEventListener("touchend", WtGui.#events.onTouchEnd, false)
        canvas.addEventListener("touchcancel", WtGui.#events.onTouchCancel, false)
        canvas.addEventListener("touchmove", WtGui.#events.onTouchMove, false)

        window.addEventListener('keydown', WtGui.#events.onKeyDown, false)
        window.addEventListener('keyup', WtGui.#events.onKeyUp, false)

        WtGui.#data.menuCanvas = canvas.menuCanvas = document.createElement('canvas')
        WtGui.#data.ctx = WtGui.#data.menuCanvas.getContext('2d')

        WtGui.#data.configRan = true
        WtGui.#renderer.start()
    }

    /**
     * 
     * @param {Object} menuStorage
     */
    static setMenuStorage = (menuStorage) => {
        //  add validation
        WtGui.#data.menuStorage = menuStorage
    }

    /**
     * 
     * @returns {Object}
     */
    static get menuStorage() { return WtGui.#data.menuStorage }

    /**
     * Set the background animation function.
     * @param {Function} func New animation function.
     */
    static setBgAnimation = (func) => {
        if(!(func instanceof Function)) throw new WtGuiError(`Background animation must be a function.`)
        WtGui.#renderer.bgAnimation = func
    }

    /**
     * Get the menu drawing context.
     * @returns {CanvasRenderingContext2D} 2D drawing context.
     */
    static get draw() { return WtGui.#data.ctx }

    /*
     * 
     * @returns {WebGL2RenderingContext}
     */
    //static get draw3d() { return WtGui.#data.glctx }

    /**
     * Add an image.
     * @param {String} id Reference name for image.
     * @param {String} file Filename and path of image.
     */
    static addImage = (id, file) => {
        if(WtGui.getImage(id) !== undefined) throw new WtGuiError(`Image ID '${id}' already exists.`)
        WtGui.#data.imageFiles.push({ id: id, file: loadImg(file) })
    }

    /**
     * Add multiple images at once.
     * @param {Array} data An array of objects [ { id: , file: } ]
     */
    static addImages = (data) => {
        data.forEach(item => { WtGui.addImage(item.id, item.file) })
    }

    /**
     * Get an image.
     * @param {String} id ID of image.
     * @returns {Image} Image by ID reference.
     */
    static getImage = (id) => {
        const tempImg = WtGui.#data.imageFiles.find(elm => elm.id === id)
        if(tempImg === undefined) return undefined
        return tempImg.file
    }

    /**
     * wip
     * @param {String} id 
     * @param {String} file 
     */
    static addAudio = (id, file) => {
        if(WtGui.getAudio(id) !== undefined) throw new WtGuiError(`Audio ID '${id}' already exists.`)
        if(!fs.existsSync(file)) throw new WtGuiError(`${file} does not exist.`)
        fs.readFile(file, (error, data) => {
            if(error) throw new WtGuiError(error.message)
            WtGui.#data.audioFiles.push({ id: id, file: data })
        })
    }

    /**
     * wip
     * @param {Array} data 
     */
    static addAudio = (data) => {
        data.forEach(item => { WtGui.addAudio(item.id, item.file) })
    }

    /**
     * wip
     * @param {String} id 
     * @returns {}
     */
    static getAudio = (id) => {
        const tempAudio = WtGui.#data.audioFiles.find(elm => elm.id === id)
        if(tempAudio === undefined) return undefined
        return tempAudio.file
    }

    /**
     * Add a new menu.
     * @param {*} menuObj Menu object to add.
     */
    static addMenu = (menuObj) => {
        if(!(menuObj instanceof WtGuiMenu)) {         //  Verify proper menu object
            menuObj = WtGui.buildMenu(menuObj)        //  Try to build menu if not
            if(!(menuObj instanceof WtGuiMenu))       //  Fail if still not a menu
                throw new WtGuiError(`Object is not a valid menu.`)
        }
        if(WtGui.getMenu(menuObj.id) !== undefined)   //  Verify menu does not exist
            throw new WtGuiError(`Menu ID '${menuObj.id}' already exists.`)
        WtGui.#data.menus.push(menuObj)               //  Add menu
    }

    /**
     * Build a menu from an object.
     * @param {*} menuData Data object to build from.
     * @returns {WtGuiMenu} Generated menu object
     */
    static buildMenu = (menuData) => {
        const tempMenu = new WtGuiMenu(menuData)
        return tempMenu
    }

    /**
     * Get a menu.
     * @param {String} id ID of menu to get.
     * @returns {WtGuiMenu} Menu object by ID.
     */
    static getMenu = (id) => { return WtGui.#data.menus.find(elm => elm.id === id) }

    /**
     * Add an item to a menu.
     * @param {String} menuId ID of menu it add item to.
     * @param {WtGuiItem} itemObj Item object to add.
     */
    static addItem = (menuId, itemObj) => {
        const menu = WtGui.getMenu(menuId)
        if(menu === undefined) throw new WtGuiError(`'${menuId}' - Menu does not exist.`)
        menu.addItem(itemObj)
    }

    /**
     * Gui actions
     */
    static actions = {
        /**
         * Pause the gui
         * @inner
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
            if(tempMenu === undefined) throw new WtGuiError(`'${menuId}' - Menu does not exist.`)
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
        nextFrame: Number(0),   //  Store the call to the animation frame
        paused: false,          //  Flag to pause renderer
        drawFps: false,         //  Flag for drawing fps counter
        fps: Number(0),         //  Store frame rate
        step: Number(0),        //  Used to calculate fps
        frameDelta: Number(0),  //  Time in ms between frames
        lastRender: Number(0),  //  Last render time
        renderTexture: null,
        bgAnimation: () => {},  //  Background animation

        /*
         * Start the renderer
         */
        start: () => {
            //WtGui.#renderer.renderTexture = WtGui.#data.glctx.createTexture()
            WtGui.#data.menuCanvas.width = WtGui.settings.width
            WtGui.#data.menuCanvas.height = WtGui.settings.height
            clearInterval(WtGui.#renderer.fpsCalc)
            WtGui.#renderer.fpsCalc = setInterval(() => {
                WtGui.#renderer.fps = WtGui.#renderer.step
                WtGui.#renderer.step = 0
            }, 1000)
            window.cancelAnimationFrame(WtGui.#renderer.nextFrame)
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
            //WtGui.#data.glctx.deleteTexture(WtGui.#renderer.renderTexture)
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
            const ctx = WtGui.#data.ctx
            const currentMenu = WtGui.#data.currentMenu

            //  Clear the renderer
            ctx.fillStyle = WtGui.settings.clearColor
            ctx.fillRect(0, 0, WtGui.settings.width, WtGui.settings.height)

            //  Run background animation function
            WtGui.#renderer.bgAnimation()

            //  Render the menu
            if(!WtGui.settings.debugMode && currentMenu.bgImage !== undefined) {
                {(currentMenu.scaleImg) ?
                    ctx.drawImage(currentMenu.bgImage,
                        currentMenu.posX + currentMenu.imgOffsetX,
                        currentMenu.posY + currentMenu.imgOffsetY,
                        currentMenu.width, currentMenu.height) :
                    ctx.drawImage(currentMenu.bgImage,
                        currentMenu.posX + currentMenu.imgOffsetX,
                        currentMenu.posY + currentMenu.imgOffsetY)}
            } else {
                ctx.fillStyle = currentMenu.bgColor
                ctx.fillRect(currentMenu.posX, currentMenu.posY,
                    currentMenu.width, currentMenu.height)
            }

            //  Render menu items
            currentMenu.items.forEach(elm => {
                if(!WtGui.settings.debugMode && elm.bgImage !== undefined) {
                    {(elm.scaleImg) ?
                        ctx.drawImage(elm.bgImage,
                            elm.posX + elm.imgOffsetX,
                            elm.posY + elm.imgOffsetY,
                            elm.width, elm.height) :
                        ctx.drawImage(elm.bgImage,
                            elm.posX + elm.imgOffsetX,
                            elm.posY + elm.imgOffsetY)}
                } else {
                    ctx.fillStyle = elm.bgColor
                    ctx.fillRect(currentMenu.posX + elm.posX,
                        currentMenu.posY + elm.posY,
                        elm.width, elm.height)
                }

                if(WtGui.#data.activeItem === elm) {
                    // selected item
                }
            })

            //  Render FPS counter if enabled
            if(WtGui.#renderer.drawFps) {
                ctx.font = '12px Arial'
                ctx.fillStyle = 'orange'
                ctx.textAlign = 'right'
                ctx.fillText(WtGui.#renderer.fps, WtGui.settings.width, 12)
            }

            //  Draw the rendered menu
            /*const gl = WtGui.#data.glctx
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.bindTexture(gl.TEXTURE_2D, WtGui.#renderer.renderTexture)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, WtGui.#data.menuCanvas)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
            gl.generateMipmap(gl.TEXTURE_2D)
            gl.bindTexture(gl.TEXTURE_2D, null)*/

            WtGui.#data.glctx.drawImage(WtGui.#data.menuCanvas, 0, 0)

            //  Update renderer info and request next frame
            WtGui.#renderer.step++
            WtGui.#renderer.frameDelta = Date.now() - WtGui.#renderer.lastRender
            WtGui.#renderer.lastRender = Date.now()
            while(WtGui.#renderer.paused) {}  //  Infinite loop for pause
            WtGui.#renderer.nextFrame = window.requestAnimationFrame(WtGui.#renderer.render)
        }
    }

    /*
     * Events sub-object
     *
     * Event object passed to UI elements:
     * > {object} uiEvent - Original UI event repacked
     * > {number} elmX - Calculated X offset within the UI item
     * > {number} elmY - Calculated Y offset within the UI item
     */
    static #events = {
        /*
         * 
         */
        onMouseDown: (event) => {
            //  See if the mouse clicked on anything
            const res = AABB(
                {
                    posX: event.offsetX - WtGui.#data.currentMenu.posX,
                    posY: event.offsetY - WtGui.#data.currentMenu.posY,
                    width: WtGui.settings.mouseSize,
                    height: WtGui.settings.mouseSize,
                },
                WtGui.#data.currentMenu.items
            )
            if(res !== undefined && res.canSelect)
                res.selectEvent({
                    uiEvent: event,
                    elmX: event.offsetX - WtGui.#data.currentMenu.posX - res.posX,
                    elmY: event.offsetY - WtGui.#data.currentMenu.posY - res.posY
                })
        },

        /*
         * 
         */
        onMouseUp: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onMouseMove: (event) => {
            //  If the mouse is pointing at anything, make it the active item
            const res = AABB(
                {
                    posX: event.offsetX - WtGui.#data.currentMenu.posX,
                    posY: event.offsetY - WtGui.#data.currentMenu.posY,
                    width: WtGui.settings.mouseSize,
                    height: WtGui.settings.mouseSize,
                },
                WtGui.#data.currentMenu.items
            )
            if(res !== undefined && res.canSelect) WtGui.#data.activeItem = res
        },

        /*
         * wip
         */
        onTouchStart: (event) => {
            console.log(event)
            event.targetTouches.forEach(touch => {
                console.log(touch)
                const hitX = 0
                const hitY = 0

                const res = AABB(
                    {
                        posX: event.radiusX - WtGui.#data.currentMenu.posX,
                        posY: event.radiusY - WtGui.#data.currentMenu.posY,
                        width: event.touchRadius,
                        height: event.touchRadius,
                    },
                    WtGui.#data.currentMenu.items
                )
                if(res !== undefined && res.canSelect)
                    res.selectEvent({
                        uiEvent: event,
                        elmX: event.offsetX - WtGui.#data.currentMenu.posX - res.posX,
                        elmY: event.offsetY - WtGui.#data.currentMenu.posY - res.posY
                    })
            })
        },

        /*
         * 
         */
        onTouchEnd: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onTouchCancel: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onTouchMove: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onKeyDown: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onKeyUp: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onButtonDown: (event) => {
            console.log(event)
        },

        /*
         * 
         */
        onButtonUp: (event) => {
            console.log(event)
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
 * Internal functions
 * 
 *************************************** */

/*
 * Parse required arguments.
 * @param {*} scope The scope (this).
 * @param {*} data Data to parse.
 * @param {*} args Arguments to parse for.
 */
const argParser = (scope, data, args) => {
    args.forEach((arg) => {
        if(data[arg] === undefined) throw new WtGuiError(`'${scope}':\n${arg} undefined.`)
        scope[arg] = data[arg]
    })
}

/*
 * Load an image from file.
 * @param {String} file 
 * @returns {Image}
 */
const loadImg = (file) => {
    if(!fs.existsSync(file)) throw new WtGuiError(`'${file}' does not exist.`)
    const tempImg = new Image()
    tempImg.src = file
    return tempImg
}

/*
 * Test for valid rgb(a)/hsl(a)
 * @param {String} str String to test
 * @returns {boolean} True if valid rgb(a)/hsl(a), else false
 */
const testRgb = (str) => { return /^(rgb|hsl)a?\((-?\d+%?[,\s]+){2,3}\s*[\d\.]+%?\)$/i.test(str) }

/*
 * AABB Algorithm
 * @param {elmA} test 
 * @param {[elmB]} collection 
 * @returns {elmB}
 */
const AABB = (test, collection) => {
    if(!(test instanceof Object)) return undefined
    if(!(collection instanceof Array)) return undefined
    let res = undefined
    collection.some((elm) => {
        if(
            test.posX < elm.posX + elm.width &&
            test.posX + test.width > elm.posX &&
            test.posY < elm.posY + elm.height &&
            test.posY + test.height > elm.posY
        ) {
            res = elm
            return true
        } else return false
    })
    return res
}

/* ****************************************
 *
 * Menu & menu item objects
 * 
 *************************************** */

/**
 * 
 * WtGui Menu Object
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
              'posX', 'posY',
              'width', 'height' ])
        this.font = args.font || WtGui.settings.defaultFont
        this.bgColor = args.bgColor || WtGui.settings.defaultMenuColor
        this.fgColor = args.fgColor || WtGui.settings.defaultFontColor

        if(args.bgImage !== undefined) this.bgImage = loadImg(args.bgImage)
        this.scaleImg = args.scaleImg || false

        this.items = []
        this.selectableItems = []

        if(!testRgb(this.bgColor)) throw new WtGuiError(`'${this.bgColor}' - Bad color code`)
        if(!testRgb(this.fgColor)) throw new WtGuiError(`'${this.fgColor}' - Bad color code`)
    }

    /**
     * Add an item to the menu
     * @param {WtGuiItem} itemObj 
     */
    addItem = (itemObj) => {
        if(!(itemObj instanceof WtGuiItem))  //  Verify proper item object
            throw new WtGuiError(`Object is not a valid menu item.`)
        //  Verify item does not already exist
        if(this.items.find(elm => elm.id === itemObj.id) !== undefined)
            throw new WtGuiError(`Item ID '${itemObj.id}' already exists.`)
        this.items.push(itemObj)  //  Add item
        if(itemObj.canSelect) this.selectableItems.push(itemObj)
    }
}
exports.WtGuiMenu = WtGuiMenu

/**
 * 
 * WtGui Menu Item Interface
 * @interface
 * 
 */
class WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        if(this.constructor === WtGuiItem) throw new WtGuiError(`'WtGuiItem' is an interface class.`)
        var args = args || {}
        argParser(this, args,
            [ 'id', 'title',
              'posX', 'posY',
              'width', 'height'])
        this.font = args.font || WtGui.settings.defaultFont
        this.bgColor = args.bgColor || WtGui.settings.defaultItemColor
        this.fgColor = args.fgColor || WtGui.settings.defaultFontColor

        if(args.bgImage !== undefined) this.bgImage = loadImg(args.bgImage)
        this.imgOffsetX = args.imgOffsetX || 0
        this.imgOffsetY = args.imgOffsetY || 0
        this.scaleImg = args.scaleImg || false
        this.canSelect = false

        if(!testRgb(this.bgColor)) throw new WtGuiError(`${this.bgColor} - Bad color code`)
        if(!testRgb(this.fgColor)) throw new WtGuiError(`${this.fgColor} - Bad color code`)
    }

    /**
     * 
     */
    selectEvent = (event) => {
        if(this.canSelect) throw new WtGuiError(`Method 'selectEvent()' must be implemented.`)
    }
}
exports.WtGuiItem = WtGuiItem

/**
 * 
 * WtGui Item Label
 * @extends WtGuiItem
 * 
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
 * WtGui Item Action
 * @extends WtGuiItem
 * 
 */
class WtGuiAction extends WtGuiItem {
    /**
     * 
     * @param {*} args 
     */
    constructor(args) {
        var args = args || {}
        super(args)
        this.canSelect = true
        if(args.type === undefined) {
            if(args.action === undefined) throw new WtGuiError(`Must define an action.`)
            this.action = args.action
        }
        if(args.type === 'open_menu') {
            if(args.menuName === undefined) throw new WtGuiError(`Must define a menu name.`)
            this.action = () => { WtGui.actions.openMenu(args.menuName) }
        }
        if(args.type === 'close_menu') {
            this.allMenus = args.allMenus || false
            this.action = () => { WtGui.actions.closeMenu(this.allMenus) }
        }
    }

    /**
     * 
     */
    selectEvent = (event) => {
        this.action(event)
    }
}
exports.WtGuiAction = WtGuiAction

/**
 * 
 * 
 * @extends WtGuiItem
 * 
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
 * 
 * @extends WtGuiItem
 * 
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
 * 
 * @extends WtGuiItem
 * 
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
