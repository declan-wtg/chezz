<template>
    <div class="flex min-h-screen bg-zinc-900 flex-1">
        <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div class="mx-auto w-full max-w-sm lg:w-96">
                <div>
                    <ChezzLogo class="h-10 w-auto text-blue-600" />
                    <h2 class="mt-8 text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
                    <p class="mt-2 text-sm/6 text-zinc-400">
                        No account?
                        {{ ' ' }}
                        <NuxtLink href="/register" class="font-semibold text-blue-400 hover:text-blue-300">Create your
                            account &rarr;</NuxtLink>
                    </p>
                </div>

                <div class="mt-10">
                    <div>
                        <form @submit.prevent="signin" class="space-y-6">
                            <div>
                                <label for="username" class="block text-sm/6 font-medium text-zinc-100">Username or Email</label>
                                <div class="mt-2">
                                    <input v-model="username" type="text" name="username" id="username" autocomplete="username" required
                                        class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6" />
                                </div>
                            </div>

                            <div>
                                <label for="password" class="block text-sm/6 font-medium text-zinc-100">Password</label>
                                <div class="mt-2">
                                    <input v-model="password" type="password" name="password" id="password" autocomplete="current-password"
                                        required
                                        class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6" />
                                </div>
                            </div>

                            <div class="flex items-center justify-between">
                                <div class="flex gap-3">
                                    <div class="flex h-6 shrink-0 items-center">
                                        <div class="group grid size-4 grid-cols-1">
                                            <input id="remember-me" name="remember-me" type="checkbox"
                                                class="col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 checked:border-blue-500 checked:bg-blue-500 indeterminate:border-blue-500 indeterminate:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:border-zinc-300 disabled:bg-zinc-100 disabled:checked:bg-zinc-100 forced-colors:appearance-auto" />
                                            <svg class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-zinc-950/25"
                                                viewBox="0 0 14 14" fill="none">
                                                <path class="opacity-0 group-has-checked:opacity-100"
                                                    d="M3 8L6 11L11 3.5" stroke-width="2" stroke-linecap="round"
                                                    stroke-linejoin="round" />
                                                <path class="opacity-0 group-has-indeterminate:opacity-100" d="M3 7H11"
                                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <label for="remember-me" class="block text-sm/6 text-zinc-300">Remember me</label>
                                </div>

                                <div class="text-sm/6">
                                    <NuxtLink href="/forgot-password" class="font-semibold text-blue-400 hover:text-blue-300">Forgot
                                        password?</NuxtLink>
                                </div>
                            </div>

                            <div>
                                <ChezzButton type="submit" :loading="loading">Sign in</ChezzButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="relative hidden w-0 flex-1 lg:block">
            <img class="absolute inset-0 size-full object-cover" src="@/assets/background.jpg" alt="" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { api } from "~/composables/api";
import { useUser } from "~/composables/user";
definePageMeta({
    layout: false,
})

const username = ref();
const password = ref();
const loading = ref(false);

const user = useUser();
const router = useRouter();

async function signin() {
    loading.value = true;
    try {
        await user.login({ username: username.value, password: password.value });
        router.push("/");
    } catch (e) {
        console.error(e);
    }
    finally {
        loading.value = false;
    }
}
</script>