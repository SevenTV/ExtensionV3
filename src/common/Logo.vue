<template>
	<template v-if="p == 'TWITCH'">
		<LogoTWITCH />
	</template>
	<template v-else-if="p == 'FFZ'">
		<LogoFFZ />
	</template>
	<template v-else-if="p == 'BTTV'">
		<LogoBTTV />
	</template>
	<template v-else>
		<Logo7TV />
	</template>
</template>

<script setup lang="ts">
import Logo7TV from "@/assets/svg/Logo7TV.vue";
import LogoFFZ from "@/assets/svg/LogoFFZ.vue";
import LogoBTTV from "@/assets/svg/LogoBTTV.vue";
import LogoTWITCH from "@/assets/svg/LogoTWITCH.vue";
import { ref } from "vue";

const props = defineProps<{
	provider?: SevenTV.Provider;
}>();

const p = ref(props.provider);

if (p.value) {
	p.value = p.value.replace("/G", "") as SevenTV.Provider;
}
</script>
