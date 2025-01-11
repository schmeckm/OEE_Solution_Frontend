<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, onBeforeUnmount, onMounted } from 'vue';
import AppBreadcrumb from './AppBreadcrumb.vue';
import AppConfig from './AppConfig.vue';
import AppRightMenu from './AppRightMenu.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutConfig, layoutState, watchSidebarActive, unbindOutsideClickListener } = useLayout();

onMounted(() => {
    watchSidebarActive();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const containerClass = computed(() => {
    return [
        {
            'layout-light': !layoutConfig.darkTheme,
            'layout-dark': layoutConfig.darkTheme,
            'layout-light-menu': layoutConfig.menuTheme === 'light',
            'layout-dark-menu': layoutConfig.menuTheme === 'dark',
            'layout-overlay': layoutConfig.menuMode === 'overlay',
            'layout-static': layoutConfig.menuMode === 'static',
            'layout-slim': layoutConfig.menuMode === 'slim',
            'layout-slim-plus': layoutConfig.menuMode === 'slim-plus',
            'layout-horizontal': layoutConfig.menuMode === 'horizontal',
            'layout-reveal': layoutConfig.menuMode === 'reveal',
            'layout-drawer': layoutConfig.menuMode === 'drawer',
            'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
            'layout-overlay-active': layoutState.overlayMenuActive,
            'layout-mobile-active': layoutState.staticMenuMobileActive,
            'layout-sidebar-active': layoutState.sidebarActive,
            'layout-sidebar-anchored': layoutState.anchored
        }
    ];
});
</script>

<template>
    <div class="layout-container" :class="containerClass">
        <AppTopbar></AppTopbar>
        <AppConfig></AppConfig>
        <div class="layout-content-wrapper">
            <div class="layout-content">
                <AppBreadcrumb></AppBreadcrumb>
                <router-view></router-view>
            </div>
        </div>
        <AppRightMenu></AppRightMenu>

        <div class="layout-mask"></div>
    </div>
    <Toast></Toast>
</template>

<style lang="scss"></style>
