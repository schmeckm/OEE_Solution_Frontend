<script setup>
import AppConfig from '@/layout/AppConfig.vue';
import { useRouter } from 'vue-router';

const router = useRouter();

function navigateToDashboard() {
    router.push('/');
}
</script>

<template>
    <div class="bg-surface-0 dark:bg-surface-900">
        <div class="flex items-center justify-between flex-col h-screen">
            <div class="flex flex-col items-center justify-center w-full md:w-4/12 h-full text-center py-12 px-6">
                <a @click="navigateToDashboard" style="cursor: pointer">
                    <svg height="56" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0H6.00019V3.82345L17 1.66667V6.66667L6.00019 8.82345V10.4901L17 8.33333V13.3333L6.00019 15.4901V20H0V0Z" fill="url(#paint0_linear)" />
                        <defs>
                            <linearGradient id="paint0_linear" x1="3.33335" y1="3.08442e-08" x2="8.49995" y2="20" gradientUnits="userSpaceOnUse">
                                <stop stop-color="var(--p-primary-400)" />
                                <stop offset="1" stop-color="var(--p-primary-700)" />
                            </linearGradient>
                        </defs>
                    </svg>
                </a>
                <div class="text-center mt-12" style="margin-bottom: 3.5rem">
                    <div class="text-primary text-xl font-semibold mb-2">Lock Screen</div>
                    <span class="text-surface-500 dark:text-surface-300 font-normal mb-8">Please enter your password</span>
                </div>
                <div class="mb-6 w-full md:w-[25rem] flex gap-6 items-center justify-between">
                    <div class="text-center flex items-center">
                        <img src="/demo/images/avatar/amyelsner.png" class="w-12 h-12 mb-2" alt="Avatar" />
                        <div class="flex flex-col gap-1 ml-4 text-left">
                            <span class="font-normal text-lg text-surface-900 dark:text-surface-0">Amy Elsner</span>
                            <span class="font-normal text-surface-500 dark:text-surface-300">Webmaster</span>
                        </div>
                    </div>

                    <Button icon="pi pi-sign-out" label="Signout" text @click="navigateToDashboard"></Button>
                </div>
                <div class="flex flex-col w-full md:w-[25rem]">
                    <IconField class="w-full mb-6">
                        <InputIcon class="pi pi-lock" />
                        <InputText id="password" type="password" class="w-full md:w-[25rem] text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600" placeholder="Password" />
                    </IconField>
                    <Button label="Unlock" class="w-full" @click="navigateToDashboard"></Button>
                    <span class="font-normal text-surface-500 dark:text-surface-300 mt-6">Forgot password? </span>
                </div>
            </div>
            <div class="flex flex-wrap items-center pb-20 px-6">
                <span class="text-2xl font-semiboldm-0 mr-8" style="line-height: 22px">freya</span>
                <span class="m-0 font-medium text-surface-300 dark:text-surface-500" style="line-height: 17px">Copyright Ⓒ PrimeTek Informatics</span>
            </div>
        </div>
    </div>

    <AppConfig simple />
</template>
