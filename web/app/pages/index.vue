<template>
  <div>
    hello, this is app
  </div>
</template>

<script setup lang="ts">
import { createApiClient } from "~~/composables/api";

const client = createApiClient("/");
</script>