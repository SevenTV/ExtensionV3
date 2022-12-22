<template>
	<div class="seventv-ban-slider" :style="{ width: data.pos }">
		<div class="container">
			<div class="behind" :style="{ backgroundColor: data.color }">
				<span class="text">
					{{ data.text }}
				</span>
			</div>
			<div class="grabbable-wrapper">
				<div class="grabbable-outer" @pointerdown="handleDown" @pointerup="handleRelease" @pointermove="update">
					<div class="grabbable-inner">
						<div class="dots" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
	msg: Twitch.ChatMessage;
	controller?: Twitch.ChatControllerComponent;
}>();

const minVal = 40.0;
const delVal = 80.0;
const maxVal = 300.0;
const maxSeconds = 1209600.0;

const numberToTime = (val: number): string => {
	if (val < 60) {
		return `${Math.round(val)} seconds`;
	} else if (val < 60 * 60) {
		return `${Math.round(val / 60)} minutes`;
	} else if (val < 60 * 60 * 24) {
		return `${Math.round(val / (60 * 60))} hours`;
	} else {
		return `${Math.round(val / (60 * 60 * 24))} days`;
	}
};

class sliderData {
	command = "";
	text = "";
	time = 0;
	unbanVis = 0;
	color = "";
	pos = "0px";

	constructor(pos: number) {
		this.pos = `${pos}px`;

		if (pos < -40) {
			this.command = "/unban {user}";
			this.unbanVis = 1;
		} else if (pos < minVal) {
			return;
		} else if (pos < delVal) {
			this.command = "/delete {id}";
			this.text = "Delete";
			this.color = "#FFFF00";
		} else if (pos < maxVal) {
			const time = Math.pow((pos + 0.25 * maxVal - delVal) / (1.25 * maxVal - delVal), 10) * maxSeconds;

			this.command = `/timeout {user} ${Math.round(time)}`;
			this.text = String(numberToTime(time));
			this.color = "#FFA500";
		} else {
			this.command = "/ban {user}";
			this.text = "Ban";
			this.color = "#C40000";
		}
	}
}
const data = ref(new sliderData(0));
let initial = 0;
let tracking = false;

const handleDown = (e: PointerEvent) => {
	e.stopPropagation();
	initial = e.pageX;
	tracking = true;
	(e.target as HTMLElement).setPointerCapture(e.pointerId);
};

const handleRelease = (e: PointerEvent): void => {
	tracking = false;

	if (data.value.command && props.controller) {
		const message = data.value.command.replace("{user}", props.msg.user.userLogin).replace("{id}", props.msg.id);
		props.controller.sendMessage(message);
	}

	data.value = new sliderData(0);

	(e.target as HTMLElement).releasePointerCapture(e.pointerId);
};

const update = (e: PointerEvent): void => {
	if (!tracking) return;
	e.preventDefault();

	const calcPos = Math.min(e.pageX - initial, maxVal);

	data.value = new sliderData(calcPos);
};
</script>

<style lang="scss">
.seventv-ban-slider {
	width: 0;
	height: auto;
	.container {
		width: 100%;
		height: 100%;
		display: inline-flex;
	}

	.behind {
		width: 100%;
		min-width: 0;
		box-shadow: inset 0.1em 0.1em 0.4em black;
		display: flex;
		align-items: center;
		overflow: hidden;
		.text {
			position: relative;
			white-space: nowrap;
			width: 100%;
			text-align: center;
			text-shadow: 0.1em 0 0.2rem var(--color-background-body), 0 0.1em 0.2rem var(--color-background-body),
				-0.1em 0 0.2rem var(--color-background-body), 0 -0.1em 0.2rem var(--color-background-body);
		}
	}

	.grabbable-wrapper {
		width: 0px;
		.grabbable-outer {
			height: 100%;
			display: inline-flex;
			width: 2rem;
			pointer-events: all;
			cursor: grab;

			.grabbable-inner {
				border: 0.1rem outset var(--color-border-input);
				border-radius: 0 0.3rem 0.3rem 0;
				margin: 0.5rem 0 0.5rem 0;
				display: inline-flex;
				align-items: center;
				border-left: none;
				box-shadow: 0 0 0.4rem black;
				.dots {
					background-image: radial-gradient(circle, var(--color-border-input) 0.1rem, transparent 0.2rem);
					background-size: 100% 33.33%;
					height: 1.4rem;
					width: 0.6rem;
				}
			}
		}
	}
}
</style>
