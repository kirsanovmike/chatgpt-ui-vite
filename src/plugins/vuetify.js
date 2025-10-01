import { createVuetify } from 'vuetify'
import { aliases, md } from 'vuetify/iconsets/md'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { md3 } from 'vuetify/blueprints'

export default defineNuxtPlugin((nuxtApp) => {
    const vuetify = createVuetify({
        ssr: true, // можно убрать, если у тебя глобально SSR отключён
        blueprint: md3,
        icons: {
            defaultSet: 'md',
            aliases,
            sets: { md },
        },
        components,
        directives,
    })

    nuxtApp.vueApp.use(vuetify)
})