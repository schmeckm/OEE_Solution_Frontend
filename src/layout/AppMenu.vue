<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Dashboards',
        icon: 'pi pi-home',
        items: [
            {
                label: 'Production Dashboard',
                icon: 'pi pi-fw pi-home',
                to: '/',
            },
        ],
    },
    {
        label: 'OEE',
        icon: 'pi pi-fw pi-chart-line',
        items: [
            {
                label: 'Line OEE',
                icon: 'pi pi-fw pi-sliders-h',
                to: '/oee/manage-line-oee',
            },
            {
                label: 'Plant OEE',
                icon: 'pi pi-fw pi-building',
                to: '/oee/manage-plant-oee',
            },
            {
                label: 'Reason Reporting',
                icon: 'pi pi-fw pi-flag',
                to: '/oee/manage-reason-reporting',
            },
            {
                label: 'Line Status',
                icon: 'pi pi-fw pi-info-circle',
                to: '/oee/manage-line-status',
            },
        ],
    },
    {
        label: 'Master Data',
        icon: 'pi pi-fw pi-database',
        items: [
            {
                label: 'Work Center',
                icon: 'pi pi-fw pi-cog',
                to: '/master-data/manage-work-center',
            },
            {
                label: 'Process Order',
                icon: 'pi pi-fw pi-briefcase',
                to: '/master-data/manage-process-order',
            },
            {
                label: 'UnplannedDownTime',
                icon: 'pi pi-fw pi-briefcase',
                to: '/master-data/manage-unplanned-downtime',
            },
            {
                label: 'PlannedDownTime',
                icon: 'pi pi-fw pi-briefcase',
                to: '/master-data/manage-planned-downtime',
            },
            {
                label: 'Shiftplan',
                icon: 'pi pi-fw pi-calendar',
                to: '/master-data/manage-shiftplan',
            },
            {
                label: 'Reason Code',
                icon: 'pi pi-fw pi-tags',
                to: '/master-data/manage-reason-code',
            },
        ],
    },
    {
        label: 'Settings',
        icon: 'pi pi-fw pi-cog',
        items: [
            {
                label: 'Manage Customizing',
                icon: 'pi pi-fw pi-sliders-h',
                to: '/settings/manage-customizing',
            },
            {
                label: 'OEE Threshold Settings',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/settings/oee-threshold',
            },
            {
                label: 'Shift Plan Configuration',
                icon: 'pi pi-fw pi-calendar',
                to: '/settings/shift-plan',
            },
            {
                label: 'MQTT Topic Configurations',
                icon: 'pi pi-fw pi-sitemap',
                to: '/settings/plant-config',
            },
        ],
    },
    {
        label: 'IT-OT Status',
        icon: 'pi pi-fw pi-user',
        items: [
            {
                label: 'WorkCenter Status',
                icon: 'pi pi-fw pi-list',
                to: '/IT-OT/workcenter-status',
            },
            {
                label: 'MQTT Status',
                icon: 'pi pi-fw pi-lock',
                to: '/IT-OT/mqtt-status',
            },
        ],
    },
    {
        label: 'User Management',
        icon: 'pi pi-fw pi-user',
        items: [
            {
                label: 'List',
                icon: 'pi pi-fw pi-list',
                to: '/profile/list',
            },
            {
                label: 'Create',
                icon: 'pi pi-fw pi-plus',
                to: '/profile/create',
            },
            {
                label: 'Access Control',
                icon: 'pi pi-fw pi-lock',
                to: '/profile/access-control',
            },
        ],
    },
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="i">
            <AppMenuItem :item="item" root :index="i" />
            <li v-if="i < model.length - 1" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped>
.layout-menu {
    width: 250px;
    padding: 0;
    margin: 0;
    list-style: none;
    background-color: #f4f4f4;
}

.menu-separator {
    height: 1px;
    background-color: #ccc;
    margin: 10px 0;
}
</style>
