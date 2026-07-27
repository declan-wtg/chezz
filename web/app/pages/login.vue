<template>
    <div class="grid">
        <input placeholder="Enter Email..." type="text" v-model="email"/>
        <input placeholder="Enter Password..." type="password" v-model="password"/>
    </div>
    <button @click="send">Sign Up</button>
</template>

<script setup lang="ts">
    let email = "";
    let password = "";

    function send() {
        console.log(email);
    }
</script>