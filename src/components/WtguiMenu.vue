<script setup lang="ts">
//defineProps<{}>()
</script>

<template>
  <section>
    <slot></slot>
  </section>
</template>

<style lang="stylus" scoped>
section
  border 1px solid red
  padding 12px
  border-radius 12px
  display flex
  flex-flow column nowrap
  place-items center
  color red
  background-color inherit
</style>