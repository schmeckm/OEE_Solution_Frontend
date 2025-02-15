import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    {
        path: '/',
        component: AppLayout,
        children: [
            // Dashboards
            {
                path: '/',
                name: 'production-dashboard',
                meta: {
                    breadcrumb: ['Dashboards', 'Production Dashboard'],
                },
                component: () => import('@/views/dashboards/production.vue'),
            },

            // OEE Section
            {
                path: '/oee/manage-line-oee',
                name: 'manage-line-oee',
                meta: {
                    breadcrumb: ['OEE', 'Line OEE'],
                },
                component: () => import('@/views/dashboards/production.vue'),
            },
            {
                path: '/oee/manage-plant-oee',
                name: 'manage-plant-oee',
                meta: {
                    breadcrumb: ['OEE', 'Plant OEE'],
                },
                component: () => import('@/views/dashboards/production.vue'),
            },
            {
                path: '/oee/manage-reason-reporting',
                name: 'reason-reporting',
                meta: {
                    breadcrumb: ['OEE', 'Reason Reporting'],
                },
                component: () => import('@/views/dashboards/production.vue'),
            },
            {
                path: '/oee/manage-line-status',
                name: 'line-status',
                meta: {
                    breadcrumb: ['OEE', 'Line Status'],
                },
                component: () => import('@/views/dashboards/production.vue'),
            },

            // Master Data Section
            {
                path: '/master-data/manage-work-center',
                name: 'manage-work-center',
                meta: {
                    breadcrumb: ['Master Data', 'Work Center'],
                },
                component: () => import('@/views/pages/Workcenter.vue'),
            },
            {
                path: '/master-data/manage-process-order',
                name: 'manage-process-order',
                meta: {
                    breadcrumb: ['Master Data', 'Process Order'],
                },
                component: () => import('@/views/pages/ProcessOrder.vue'),
            },
            {
                path: '/master-data/manage-Unplanned-Downtime',
                name: 'manage-Unplanned-Downtime',
                meta: {
                    breadcrumb: ['Master Data', 'Unplanned-Downtime'],
                },
                component: () => import('@/views/pages/UnplannedDowntime.vue'),
            },
            {
                path: '/master-data/manage-planned-Downtime',
                name: 'manage-Planned-Downtime',
                meta: {
                    breadcrumb: ['Master Data', 'Planned-Downtime'],
                },
                component: () => import('@/views/pages/PlannedDowntime.vue'),
            },
            {
                path: '/master-data/manage-shiftplan',
                name: 'manage-shiftplan',
                meta: {
                    breadcrumb: ['Master Data', 'Shiftplan'],
                },
                component: () => import('@/views/pages/ShiftPlan.vue'),
            },
            {
                path: '/master-data/manage-reason-code',
                name: 'manage-reason-code',
                meta: {
                    breadcrumb: ['Master Data', 'Reason Code'],
                },
                component: () => import('@/views/pages/ReasonCode.vue'),
            },

            // Settings Section
            {
                path: '/settings/manage-customizing',
                name: 'manage-customizing',
                meta: {
                    breadcrumb: ['Settings', 'Manage Customizing'],
                },
                component: () => import('@/views/pages/ManageCustomizing.vue'),
            },
            {
                path: '/settings/oee-threshold',
                name: 'oee-threshold',
                meta: {
                    breadcrumb: ['Settings', 'OEE Threshold Settings'],
                },
                component: () => import('@/views/pages/ProcessOrder.vue'),
            },
            {
                path: '/settings/shift-plan',
                name: 'shift-plan',
                meta: {
                    breadcrumb: ['Settings', 'Shift Plan Configuration'],
                },
                component: () => import('@/views/pages/ProcessOrder.vue'),
            },
            {
                path: '/settings/plant-config',
                name: 'plant-config',
                meta: {
                    breadcrumb: ['Settings', 'MQTT Topic Configurations'],
                },
                component: () => import('@/views/pages/OEEConfiguration.vue'),
            },

            // User Management Section
            {
                path: '/profile/list',
                name: 'user-list',
                meta: {
                    breadcrumb: ['User Management', 'List'],
                },
                component: () => import('@/views/user-management/UserList.vue'),
            },
            {
                path: '/profile/create',
                name: 'user-create',
                meta: {
                    breadcrumb: ['User Management', 'Create'],
                },
                component: () => import('@/views/user-management/UserCreate.vue'),
            },
            {
                path: '/profile/access-control',
                name: 'access-control',
                meta: {
                    breadcrumb: ['User Management', 'Access Control'],
                },
                component: () => import('@/views/user-management/UserCreate.vue'),
            },
            // IT-OT Status Section
            {
                path: '/it-ot/workcenter-status',
                name: 'workcenter-status',
                meta: {
                    breadcrumb: ['IT-OT Status', 'WorkCenter Status'],
                },
                component: () => import('@/views/pages/WorkcenterTable.vue'),
            },
            {
                path: '/it-ot/mqtt-status',
                name: 'mqtt-status',
                meta: {
                    breadcrumb: ['IT-OT Status', 'MQTT Status'],
                },
                component: () => import('@/views/pages/WorkcenterTable.vue'),
            },

            // Additional Pages
            {
                path: '/documentation',
                name: 'documentation',
                component: () => import('@/views/utilities/Documentation.vue'),
            },
            {
                path: '/pages/faq',
                name: 'faq',
                meta: {
                    breadcrumb: ['Pages', 'FAQ'],
                },
                component: () => import('@/views/pages/Faq.vue'),
            },
            {
                path: '/pages/contact',
                name: 'contact',
                meta: {
                    breadcrumb: ['Pages', 'Contact Us'],
                },
                component: () => import('@/views/pages/ContactUs.vue'),
            },
            {
                path: '/pages/aboutus',
                name: 'about-us',
                meta: {
                    breadcrumb: ['Pages', 'About Us'],
                },
                component: () => import('@/views/pages/AboutUs.vue'),
            },
            {
                path: '/pages/help',
                name: 'help',
                meta: {
                    breadcrumb: ['Pages', 'Help'],
                },
                component: () => import('@/views/pages/Help.vue'),
            },
            {
                path: '/pages/invoice',
                name: 'invoice',
                meta: {
                    breadcrumb: ['Pages', 'Invoice'],
                },
                component: () => import('@/views/pages/Invoice.vue'),
            },
            {
                path: '/pages/empty',
                name: 'empty',
                component: () => import('@/views/pages/Empty.vue'),
            },
        ],
    },
    // Authentication Pages
    {
        path: '/auth/login',
        name: 'login',
        component: () => import('@/views/pages/auth/Login.vue'),
    },
    {
        path: '/auth/access',
        name: 'accessDenied',
        component: () => import('@/views/pages/auth/AccessDenied.vue'),
    },
    {
        path: '/auth/register',
        name: 'register',
        component: () => import('@/views/pages/auth/Register.vue'),
    },
    {
        path: '/auth/forgotpassword',
        name: 'forgotpassword',
        component: () => import('@/views/pages/auth/ForgotPassword.vue'),
    },
    {
        path: '/auth/newpassword',
        name: 'newpassword',
        component: () => import('@/views/pages/auth/NewPassword.vue'),
    },
    {
        path: '/auth/verification',
        name: 'verification',
        component: () => import('@/views/pages/auth/Verification.vue'),
    },
    {
        path: '/auth/lockscreen',
        name: 'lockscreen',
        component: () => import('@/views/pages/auth/LockScreen.vue'),
    },

    // Fallback Route
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/views/pages/NotFound.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { left: 0, top: 0 };
    },
});

export default router;
