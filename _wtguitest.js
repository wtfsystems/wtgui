const { contextBridge, ipcRenderer } = require('electron')

const { WtGui, WtGuiMenu, WtGuiButton } = require('./WtGui')

WtGui.settings.width = 100
WtGui.settings.height = 100
const menuSystem = new WtGui()

{const res = menuSystem.addMenu(new WtGuiMenu({
    id: 'main_menu',
    title: 'Test Main Menu',
    pos_x: 10, pos_y: 10,
    width: 50, height: 50
}))
if(!res) throw new Error('shit')}

{const res = menuSystem.addItem('main_menu', new WtGuiButton({
    id: 'apply_btn',
    title: 'Apply',
    pos_x: 10, pos_y: 10,
    width: 40, height: 20
}))
if(!res) console.log('shit')}

/*
 *
 */
ipcRenderer.on('send-input-data', (event, message) => {
    //
})

/*
 *
 */
contextBridge.exposeInMainWorld(
    'something',
    {
        data: 'none'
    }
)
