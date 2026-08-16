<template>
    <div class="flex min-h-screen bg-zinc-900 flex-1">
        <div class="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div class="mx-auto w-full max-w-sm lg:w-96">
                <div>
                    <ChezzLogo class="h-10 w-auto text-blue-600" />
                    <h2 class="mt-8 text-2xl/9 font-bold tracking-tight text-white">Reset Password</h2>
                </div>

                <div class="mt-10">
                    <div>
                        <form @submit.prevent="resetpassword" class="space-y-6">
                            <div>
                                <label for="email" class="block text-sm/6 font-medium text-zinc-100">Email</label>
                                <div class="mt-2">
                                    <input v-model="email" type="text" name="email" id="email" autocomplete="email" required
                                        class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6" />
                                </div>
                            </div>
                            <div>
                                <label for="password" class="block text-sm/6 font-medium text-zinc-100">New Password</label>
                                <div class="mt-2">
                                    <input v-model="password" type="password" name="password" id="password" autocomplete="password" required
                                        class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-zinc-500 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500 sm:text-sm/6" />
                                </div>
                            </div>

                            <div>
                                <ChezzButton type="submit" :loading="loading">Reset Password</ChezzButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <div class="relative hidden w-0 flex-1 lg:block">
            <img class="absolute inset-0 size-full object-cover" src="@/assets/background.jpg" alt="" />
        </div>
        <InfoNotification ref="notification" />
    </div>
</template>

<script setup lang="ts">
import { api } from "~/composables/api";
import InfoNotification from "~/components/Notifications/InfoNotification.vue";
definePageMeta({
    layout: false,
})
const route = useRoute();
const router = useRouter();
const token = route.params.token!.toString();

const email = ref();
const password = ref();
const loading = ref(false);

const notification = ref();

async function resetpassword() {
    loading.value = true;
    try {
        await api.Identity_ResetPassword({
            email: email.value,
            resetCode: token,
            newPassword: password.value,
        });
        router.push("/signin");
    } catch (e) {
        console.error(e);
    }
    finally {
        loading.value = false;
    }
}
</script>