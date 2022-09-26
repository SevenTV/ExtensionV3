<script setup lang="ts">
import { getRouter } from "@/common/hook/TwitchHook";

const router = getRouter();
const route = router.props.location;

console.log("start loc", route);

router.props.history.listen((loc, act) => {
	console.log(loc, act);
});
</script>
