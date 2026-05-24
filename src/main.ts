import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import OpenLayersMap from 'vue3-openlayers'
import 'ol/ol.css'
import { useGeographic } from 'ol/proj'

useGeographic()

const app = createApp(App)

app.use(OpenLayersMap)

app.mount('#app')