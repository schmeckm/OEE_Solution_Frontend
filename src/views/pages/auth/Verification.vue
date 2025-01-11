<script setup>
import AppConfig from '@/layout/AppConfig.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const val1 = ref(null);
const val2 = ref(null);
const val3 = ref(null);
const val4 = ref(null);

function navigateToDashboard() {
    router.push('/');
}

function onDigitInput(event) {
    let element;
    if (event.code !== 'Backspace') {
        if (event.code.includes('Numpad') || event.code.includes('Digit')) {
            element = event.target.nextElementSibling;
        }
    }
    if (event.code === 'Backspace') {
        element = event.target.previousElementSibling;
    }

    if (element == null) return;
    else element.focus();
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
                    <div class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-2">Verification</div>
                    <span class="text-surface-600 dark:text-surface-200 font-medium">We have sent code to you email:</span>
                    <div class="flex items-center mt-1">
                        <i class="pi pi-envelope text-surface-600 dark:text-surface-200"></i>
                        <span class="text-surface-900 dark:text-surface-0 font-bold ml-2">dm**@gmail.com</span>
                    </div>
                </div>
                <div class="flex flex-col">
                    <div class="flex justify-between w-full items-center mb-6 gap-4">
                        <InputText v-model="val1" class="w-12 text-center text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600" maxlength="1" @keyup="onDigitInput($event)" />
                        <InputText v-model="val2" class="w-12 text-center text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600" maxlength="1" @keyup="onDigitInput($event)" />
                        <InputText v-model="val3" class="w-12 text-center text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600" maxlength="1" @keyup="onDigitInput($event)" />
                        <InputText v-model="val4" class="w-12 text-center text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-600" maxlength="1" @keyup="onDigitInput($event)" />
                    </div>

                    <div class="flex flex-wrap gap-2 justify-between">
                        <Button label="Cancel" class="flex-auto" outlined @click="navigateToDashboard"></Button>
                        <Button label="Verify" class="flex-auto" @click="navigateToDashboard"></Button>
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
