<template>
    <div class="flex justify-center content-center items-center h-screen w-screen">
        <div class="grid gap-4 p-4 grid-rows-3 h-40">
            <input placeholder="Enter Email..." type="text" v-model="email" class="outline-solid"/>
            <input placeholder="Enter Password..." type="password" v-model="password" class="outline-solid"/>
            <div class="grid grid-cols-2 gap-2">
                <button @click="send" class="outline-solid">Log In</button>
                <button @click="send" class="outline-solid">Sign Up</button>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
    let email = "";
    let password = "";

    function send() {
        console.log(email);
    }
</script>