# WTGuiMessageBox

```ts
import { WTGuiMessageBox } from '@wtfsystems/wtgui'
```

## Properties

| Name        | Required           | Type     | Purpose                             |
|-------------|:------------------:|----------|-------------------------------------|
| label       | :white_check_mark: | string   | Message to display                  |
| show-close  | :white_check_mark: | boolean  | Show the close button or not        |
| border-size | :x:                | number   | Thickness of the border (default 6) |
| sound-open  | :x:                | string   | Sound file to play on open          |
| sound-close | :x:                | string   | Sound file to play on close press   |

## Example

```vue{2,10}
<script>
const showMessageBox = ref(false)  //  Flip to true to show message box
</script>

<WTGuiMessageBox
  label="Your text here"
  :show-close="true"
  sound-open="./src/assets/open.wav"
  sound-close="./src/assets/close.wav"
  v-model="showMessageBox"/>
```
