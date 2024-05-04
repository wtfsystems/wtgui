/**
 * 
 * @author Matthew Evans
 * @module wtfsystems/wtgui
 * @see README.md
 * @copyright MIT see LICENSE.md
 * 
 */

import { settings } from './WTGuiSettings.js'
import { WTGuiRenderer } from './WTGuiRenderer.js'
import { WTGuiMenu } from './WTGuiMenu.js'
import { WTGuiItem } from './items/WTGuiItem.js'
import { WTGuiError, WTGuiTypeError } from './WTGuiError.js'
import { AABB } from './algorithms.js'

interface data {
  initialized:boolean
  imageFiles:Array<{ id:string, file:ImageBitmap }>
  audioFiles:Array<{ id:string, file:HTMLAudioElement }>
  menus:Array<WTGuiMenu>
  openedMenus:Array<WTGuiMenu>
  currentMenu:WTGuiMenu
  activeItem:WTGuiItem
}

export class WTGui {
  static #data:data = {
    initialized: false,          //  Flag to verify config runs once
    imageFiles: [],              //  Array of image files
    audioFiles: [],              //  Array of audio files
    menus: [],                   //  Array of available menus
    openedMenus: [],             //  Stack of opened menus
    currentMenu: <WTGuiMenu>{},  //  Current opened menu
    activeItem: <WTGuiItem>{}    //  Active menu item
  }

  constructor() { return false }  //  Don't allow direct construction

  /** Get WTGui's internal data, read only */
  static get data() { return WTGui.#data }

  /**
   * Starts WTGui
   * Call this to set up the gui and begin rendering
   * Menus must be configured before this is called
   * @throws Throws an error if WTGui is already running
   * @throws Throws an error if no menus were defined
   * @throws Throws any configuration errors
   */
  static start() {
    if(WTGui.#data.initialized)
      throw new WTGuiError(`WTGui is already running!`, WTGui.start)
    if(WTGui.#data.menus.length === 0)
      throw new WTGuiError(`Must define some menus!`, WTGui.start)

    window.addEventListener('keydown', WTGui.#events.onKeyDown, false)
    window.addEventListener('keyup', WTGui.#events.onKeyUp, false)

    document.addEventListener('mousedown', WTGui.#events.onMouseDown, false)
    document.addEventListener('mouseup', WTGui.#events.onMouseUp, false)
    document.addEventListener('mousemove', WTGui.#events.onMouseMove, false)
    document.addEventListener('wheel', WTGui.#events.onMouseWheel, false)

    /*document.addEventListener('touchstart', WTGui.#events.onTouchStart, false)
    document.addEventListener('touchend', WTGui.#events.onTouchEnd, false)
    document.addEventListener('touchcancel', WTGui.#events.onTouchCancel, false)
    document.addEventListener('touchmove', WTGui.#events.onTouchMove, false)
    document.addEventListener('scroll', WTGui.#events.onScroll, false)*/

    WTGui.#data.initialized = true
    WTGuiRenderer.start()
  }

  /**
   * Add an image file
   * @param id Reference name for image
   * @param file Filename of the image to add
   * @throws Throws an error if the ID already exists
   */
  static addImage = (id:string, file:string) => {
    if(WTGui.getImage(id) !== undefined)
      throw new WTGuiError(`Image ID '${id}' already exists!`, WTGui.addImage)
    const tempImg = new Image()
    tempImg.onload = () => {
      Promise.resolve(createImageBitmap(tempImg)).then(tempBmp =>{
        WTGui.#data.imageFiles.push({ id: id, file: tempBmp })
      })
    }
    tempImg.src = file
  }

  /**
   * Add multiple images at once
   * @param data An array of images
   * @throws Throws errors generated by {@link WTGui.addImage}
   */
  static addImages = (data:Array<{ id:string, file:string }>) => {
    try {
      data.forEach(item => WTGui.addImage(item.id, item.file))
    } catch (error:any) { throw error }
  }

  /**
   * Get an image
   * @param id ID of image
   * @returns Image by ID reference
   */
  static getImage = (id:string) => {
    const tempBmp = WTGui.#data.imageFiles.find(elm => elm.id === id)
    if(tempBmp === undefined) return undefined
    return tempBmp.file
  }

  /**
   * Add an audio file
   * @param id Reference name for audio
   * @param file Filename and path of audio file
   * @throws Throws an error if the ID already exists
   */
  static addAudio = (id:string, file:string) => {
    if(WTGui.getAudio(id) !== undefined)
      throw new WTGuiError(`Audio ID '${id}' already exists!`, WTGui.addAudio)
    const tempAudio = new Audio()
    tempAudio.src = file
    WTGui.#data.audioFiles.push({ id: id, file: tempAudio })
  }

  /**
   * Add multiple audio files at once
   * @param data An array of audio files
   * @throws Throws errors generated by {@link WTGui.addAudio}
   */
  static addAudioFiles = (data:Array<{ id:string, file:string }>) => {
    try {
      data.forEach(item => { WTGui.addAudio(item.id, item.file) })
    } catch (error:any) { throw error }
  }

  /**
   * Get an audio file
   * @param id ID of the audio file
   * @returns The audio file by ID reference
   */
  static getAudio = (id:string) => {
    const tempAudio = WTGui.#data.audioFiles.find(elm => elm.id === id)
    if(tempAudio === undefined) return undefined
    return tempAudio.file
  }

  /**
   * Add a new menu
   * @param menuObj Menu object to add
   * @throws Throws an error if menuObj is not derived from {@link WTGuiMenu}
   * @throws Throws an error if the menu ID already exists
   */
  static addMenu = (menuObj:WTGuiMenu) => {
    if(!(menuObj instanceof WTGuiMenu))
      throw new WTGuiTypeError(`Menu is not a valid 'WTGuiMenu' object!`, WTGui.addMenu)
    if(WTGui.getMenu(menuObj.id) !== undefined)
      throw new WTGuiError(`Menu ID '${menuObj.id}' already exists!`, WTGui.addMenu)
    WTGui.#data.menus.push(menuObj)
  }

  /**
   * Get a menu
   * @param id ID of menu to get
   * @returns Menu object by ID
   */
  static getMenu = (id:string) => {
    return WTGui.#data.menus.find(elm => elm.id === id)
  }

  /**
   * Add an item to a menu
   * @param menuId ID of menu it add item to
   * @param itemObj Item object to add
   * @throws Throws an error if itemObj is not derived from {@link WTGuiItem}
   * @throws Throws an error if the menu does not exist
   */
  static addItem = (menuId:string, itemObj:WTGuiItem) => {
    if(!(itemObj instanceof WTGuiItem))
      throw new WTGuiTypeError(`Menu item is not a valid 'WTGuiItem' object!`, WTGui.addItem)
    const menu = WTGui.getMenu(menuId)
    if(menu === undefined)
      throw new WTGuiError(`'${menuId}' - Menu does not exist!`, WTGui.addItem)
    menu.addItem(itemObj)
  }

  /**
   * Open a menu
   * @param menuId Menu ID to open
   * @throws Throws an error if the menu does not exist
   */
  static openMenu = (menuId:string) => {
    const tempMenu = WTGui.getMenu(menuId)
    if(tempMenu === undefined)
      throw new WTGuiError(`'${menuId}' - Menu does not exist!`, WTGui.openMenu)
    WTGui.#data.openedMenus.push(tempMenu)
    WTGui.#data.currentMenu = WTGui.#data.openedMenus[(WTGui.#data.openedMenus.length - 1)]
    WTGui.#data.activeItem = WTGui.#data.currentMenu.selectableItems[0]
  }

  /**
   * Close one or all menus
   * @param closeAll True to close all menus, false to close the top menu
   */
  static closeMenu = (closeAll:boolean) => {
    if(closeAll) {
      WTGui.#data.openedMenus = []
      WTGui.#data.currentMenu = <WTGuiMenu>{}
    } else {
      WTGui.#data.openedMenus.pop()
      if(WTGui.#data.openedMenus.length === 0) WTGui.openMenu(settings.defaultMenu)
      else WTGui.#data.currentMenu = WTGui.#data.openedMenus[(WTGui.#data.openedMenus.length - 1)]
    }
  }
  
  static #actions = {
    scrollTimer: 0,  //  Store running timer function

    //  Timer function to scroll left
    scrollLeft: () => { WTGui.#data.activeItem.onLeft() },

    //  Timer function to scroll right
    scrollRight: () => { WTGui.#data.activeItem.onRight() },

    //  Move the active menu item up in the index
    menuItemUp: () => {
      let idx = WTGui.#data.currentMenu.selectableItems.findIndex(
        elm => elm === WTGui.#data.activeItem)
      if(idx > 0) {
        --idx
        WTGui.#data.activeItem = WTGui.#data.currentMenu.selectableItems[idx]
        return true
      }
      return false
    },

    //  Move the active menu item down in the index
    menuItemDown: () => {
      let idx = WTGui.#data.currentMenu.selectableItems.findIndex(
        elm => elm === WTGui.#data.activeItem)
      if(idx < WTGui.#data.currentMenu.selectableItems.length - 1 && idx >= 0) {
        ++idx
        WTGui.#data.activeItem = WTGui.#data.currentMenu.selectableItems[idx]
        return true
      }
      return false
    },

    //  Start scrolling through the menu item options
    menuItemScrollStart: (direction:boolean) => {
      clearInterval(WTGui.#actions.scrollTimer)
      {(direction) ?
        WTGui.#actions.scrollTimer = setInterval(
          WTGui.#actions.scrollLeft, settings.scrollSpeed) :
        WTGui.#actions.scrollTimer = setInterval(
          WTGui.#actions.scrollRight, settings.scrollSpeed)}
    },

    //  Stop scrolling through the menu item options
    menuItemScrollStop: () => {
      clearInterval(WTGui.#actions.scrollTimer)
    },

    //  Process menu item selection
    menuItemSelect: (event:Event) => {
      if(WTGui.#data.activeItem !== undefined) WTGui.#data.activeItem.onSelect(event)
    },

    //  Menu cancel action
    menuCancel: () => {
      //
    }
  }

  static #events = {
    //  Key Down Events
    onKeyDown: (event:KeyboardEvent) => {
      if(event.repeat) return
      Object.keys(settings.actionBindings.keys).forEach(action => {
        settings.actionBindings.keys[action].forEach(binding => {
          if(event.key.toUpperCase() === binding.toUpperCase())
            WTGui.#events.trigger.down(action, event)
        })
      })
    },

    //  Key Up Events
    onKeyUp: (event:KeyboardEvent) => {
      Object.keys(settings.actionBindings.keys).forEach(action => {
        settings.actionBindings.keys[action].forEach(binding => {
          if(event.key.toUpperCase() === binding.toUpperCase())
            WTGui.#events.trigger.up(action, event)
        })
      })
    },

    //  Mouse Down Event
    onMouseDown: (event:MouseEvent) => {
      const hitX = event.offsetX - WTGui.#data.currentMenu.posX
      const hitY = event.offsetY - WTGui.#data.currentMenu.posY
      //  See if the mouse clicked on anything
      const res:any = AABB(
        {
            posX: hitX,
            posY: hitY,
            width: settings.mouseSize,
            height: settings.mouseSize,
        },
        WTGui.#data.currentMenu.items
      )
      if(res !== undefined && res.canSelect) {
        WTGui.#data.activeItem = res
        if(res.scrollable) {
          (hitX - res.posX < res.width / 2) ?
            WTGui.#actions.menuItemScrollStart(true) :
            WTGui.#actions.menuItemScrollStart(false)
        }
        else res.onSelect(event, (hitX - res.posX), (hitY - res.posY))
      }
    },

    //  Mouse Up Event
    onMouseUp: (event:MouseEvent) => { WTGui.#actions.menuItemScrollStop() },

    //  Mouse Move Event
    onMouseMove: (event:MouseEvent) => {
      //  If the mouse is pointing at anything, make it the active item
      const res:any = AABB(
        {
          posX: event.offsetX - WTGui.#data.currentMenu.posX,
          posY: event.offsetY - WTGui.#data.currentMenu.posY,
          width: settings.mouseSize,
          height: settings.mouseSize,
        },
        WTGui.#data.currentMenu.items
      )
      if(res !== undefined && res.canSelect) {
        if(WTGui.#data.activeItem !== res) WTGui.#actions.menuItemScrollStop()
        WTGui.#data.activeItem = res
      }
    },

    //  Mouse Wheel
    onMouseWheel: (event:MouseEvent) => {
      event.preventDefault()
    },


    /* 
     * wip
     *
    onTouchStart: (event:TouchEvent) => {
      console.log(event)
      event.targetTouches.forEach((touch:Touch) => {
        console.log(touch)
        const hitX = 0
        const hitY = 0

        const res = AABB(
          {
            posX: touch.clientX - WTGui.#data.currentMenu.posX,
            posY: touch.clientY - WTGui.#data.currentMenu.posY,
            width: touch.radiusX,
            height: touch.radiusY,
          },
          WTGui.#data.currentMenu.items
        )
        if(res !== undefined && res.canSelect)
          res.onSelect(event)
      })
    },

    onTouchEnd: (event:TouchEvent) => {
      console.log(event)
    },

    onTouchCancel: (event:TouchEvent) => {
      console.log(event)
    },

    onTouchMove: (event:TouchEvent) => {
      console.log(event)
    },

    onScroll: (event:Event) => {
      console.log(event)
      //event.preventDefault()
    },
    */


    /*
     * wip
     *
    onButtonDown: (event:GamepadEvent) => {
      if(event.repeat) return
      Object.keys(settings.actionBindings.buttons).forEach(action => {
        settings.actionBindings.keys[action].forEach(binding => {
          if(event.gamepad === binding) WTGui.#events.trigger.down(action, event)
        })
      })
    },

    /*
     * wip
     *
    onButtonUp: (event:GamepadEvent) => {
      Object.keys(settings.actionBindings.buttons).forEach(action => {
        settings.actionBindings.keys[action].forEach(binding => {
          if(event.gamepad === binding) WTGui.#events.trigger.up(action, event)
        })
      })
    },
    */

    /*
     * Input triggers
     */
    trigger: {
      /*
       * Input on down triggers
       */
      down: (action:string, event:Event) => {
        switch(action) {
          case 'up':
            WTGui.#actions.menuItemUp()
            break
          case 'down':
            WTGui.#actions.menuItemDown()
            break
          case 'left':
            if(WTGui.#data.activeItem.scrollable)
              WTGui.#actions.menuItemScrollStart(true)
            break
          case 'right':
            if(WTGui.#data.activeItem.scrollable)
              WTGui.#actions.menuItemScrollStart(false)
            break
          case 'select':
            WTGui.#actions.menuItemSelect(event)
            break
          case 'cancel':
            WTGui.#actions.menuCancel()
            break
        }
      },

      /*
       * Input on up triggers
       */
      up: (action:string, event:Event) => {
        switch(action) {
          case 'left':
            WTGui.#actions.menuItemScrollStop()
            break
          case 'right':
            WTGui.#actions.menuItemScrollStop()
            break
        }
      }
    }
  }

  //  Debug functions
  static debug = {
    /** Log menu objects to console */
    logMenus: () => {
      WTGui.#data.menus.forEach(menu => { console.log(menu) })
    },

    /** Log opened menu stack to console */
    logMenuStack: () => {
      WTGui.#data.openedMenus.forEach(menu => { console.log(menu) })
    },

    /** Log image file list to console */
    logImageFiles: () => {
      WTGui.#data.imageFiles.forEach(img => { console.log(img) })
    },

    /** Log audio file list to console */
    logAudioFiles: () => {
      WTGui.#data.audioFiles.forEach(audio => { console.log(audio) })
    }
  }
}
