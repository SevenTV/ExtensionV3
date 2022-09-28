import { createApp, h } from "vue";
import App from "@/site/App.vue";
import { createPinia } from "pinia";

const root = document.createElement("div");
root.id = "seventv-root";

document.body.append(root);

const app = createApp(App);

app.use(createPinia()).mount("#seventv-root");
