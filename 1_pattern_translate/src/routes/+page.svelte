<script>
	import Header from '$lib/components/Header.svelte';
	import { slide } from 'svelte/transition';
	// import Pattern1 from '$lib/components/1_PatternRect.svelte';
	// import Pattern2 from '$lib/components/3_PatternPoly.svelte';
	import Pattern0 from '$lib/components/0_Raute.svelte';	
	import Raute1 from '$lib/components/Raute_1.svelte';	
	import Raute2 from '$lib/components/Raute_2.svelte';	
	import Raute3 from '$lib/components/Raute_3.svelte';	
	import Raute4 from '$lib/components/Raute_4.svelte';	
	import Raute5 from '$lib/components/Raute_5.svelte';

	// Beschreibung der Patterns für die Sidebar, mit Verknüpfung zu euren Komponenten
	let patterns = [
		// {
		// 	name: 'Squares in the Grid (offset)',
		// 	component: Pattern1,
		// 	description: 'A grid of squares divided into two triangles that can get an offset.'
		// },
		// {
		// 	name: 'Squares in the Grid (offset and size)',
		// 	component: Pattern2,
		// 	description: 'A grid of squares divided into two triangles that can get an offset and size.'
		// }o,
		{
			name: 'Anfang (raute)',
			component: Pattern0,
			description: 'Basic rhombus star pattern'
		},
		{
			name: 'Farbe (raute1)',
			component: Raute1,
			description: 'Variation 1 with color mapping'
		},
		{
			name: 'Abstand (raute2)',
			component: Raute2,
			description: 'Variation 2 with offsets'
		},
		{
			name: 'Raute 3',
			component: Raute3,
			description: 'Distorted / warped variation'
		},
		{
			name: 'Raute 4',
			component: Raute4,
			description: 'Full control variant (controls in left sidebar)'
		},
		{
			name: 'Raute 5',
			component: Raute5,
			description: 'Utility / position-based controls'
		}
	];

	// Trigger für Patternwechsel bei Klick auf Pattern in der Sidebar
	let selectedPattern = $state(0);
	let SelectedPattern = $derived(patterns[selectedPattern].component);

</script>

<div class="app-container">
	<Header />
	<main class="app-main">
		<div class="sidebar-left">
			{#each patterns as pattern, index}
				<button
					class="sidebar-left-item"
					class:selected={selectedPattern === index}
					onclick={() => (selectedPattern = index)}
					>{pattern.name}
					{#if selectedPattern === index}
						<div transition:slide class="sidebar-left-description">{pattern.description}</div>
					{/if}
				</button>
			{/each}
		</div>

		<SelectedPattern />
	</main>
</div>