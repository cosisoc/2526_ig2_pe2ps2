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
	import Raute6 from '$lib/components/Raute_6.svelte';
	import Raute7 from '$lib/components/Raute_7.svelte';

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
			name: 'Anfangsmuster - Raute',
			component: Pattern0,
			description: 'Anfangsmuster mit schwarz-weißen Rauten'
		},
		{
			name: 'Farbpaletten ',
			component: Raute1,
			description: 'Erste Variation mit Farbpaletten'
		},
		{
			name: 'Abstände',
			component: Raute2,
			description: 'Variation der Abstände zwischen den Stern-Rauten'
		},
		{
			name: 'Verzerrung',
			component: Raute3,
			description: 'Verzerrung der Rauten'
		},
		{
			name: '(kommt später weg)',
			component: Raute4,
			description: 'Full control variant (controls in left sidebar)'
		},

		{
			name: 'Farbmuster Variation',
			component: Raute6,
			description: 'Variation mit vordefinierten Mustern'
		},
		{
			name: 'Raute 7',
			component: Raute7,
			description: 'Raute 7 Ansicht'
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