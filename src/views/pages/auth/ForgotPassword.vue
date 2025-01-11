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
                <a @click="navigateToDashboard" class="mb-12" style="cursor: pointer">
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
                <div class="mb-6">
                    <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-2">Forgot Password</div>
                    <span class="text-surface-600 dark:text-surface-200 font-medium">Enter your email to reset your password</span>
                </div>
                <div class="flex flex-col">
                    <IconField class="w-full mb-6">
                        <InputIcon class="pi pi-envelope" />
                        <InputText id="email" type="text" class="w-full md:w-[25rem] text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600" placeholder="Email" />
                    </IconField>
                    <div class="flex flex-wrap gap-2 justify-between">
                        <Button label="Cancel" class="flex-auto" outlined @click="navigateToDashboard"></Button>
                        <Button label="Submit" class="flex-auto" @click="navigateToDashboard"></Button>
                    </div>
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
