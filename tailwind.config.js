/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class', '[class*="app-dark"]'], // Aktiviert Dunkelmodus basierend auf Klasse oder Attribut
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
        '!./src/**/*.stories.js', // Storybook-Dateien ausschließen
        '!./src/**/*.test.js' // Test-Dateien ausschließen
    ],
    plugins: [
        require('tailwindcss-primeui'),
    ],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        },
        extend: {
            colors: {
                primary: '#1a73e8', // Ihre primäre Farbe
                secondary: '#ff5722' // Ihre sekundäre Farbe
            },
            spacing: {
                '128': '32rem',
                '144': '36rem'
            }
        }
    }
};