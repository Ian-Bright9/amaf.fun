
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/(market)" | "/" | "/api" | "/api/bets" | "/api/contracts" | "/api/contracts/[id]" | "/api/contracts/[id]/resolve" | "/api/tokens" | "/api/tokens/claim" | "/api/tokens/initialize" | "/api/transactions" | "/api/transactions/create-contract" | "/demo" | "/markets" | "/market" | "/market/create" | "/market/[slug]" | "/wallet" | "/(market)/[slug]";
		RouteParams(): {
			"/api/contracts/[id]": { id: string };
			"/api/contracts/[id]/resolve": { id: string };
			"/market/[slug]": { slug: string };
			"/(market)/[slug]": { slug: string }
		};
		LayoutParams(): {
			"/(market)": { slug?: string };
			"/": { id?: string; slug?: string };
			"/api": { id?: string };
			"/api/bets": Record<string, never>;
			"/api/contracts": { id?: string };
			"/api/contracts/[id]": { id: string };
			"/api/contracts/[id]/resolve": { id: string };
			"/api/tokens": Record<string, never>;
			"/api/tokens/claim": Record<string, never>;
			"/api/tokens/initialize": Record<string, never>;
			"/api/transactions": Record<string, never>;
			"/api/transactions/create-contract": Record<string, never>;
			"/demo": Record<string, never>;
			"/markets": Record<string, never>;
			"/market": { slug?: string };
			"/market/create": Record<string, never>;
			"/market/[slug]": { slug: string };
			"/wallet": Record<string, never>;
			"/(market)/[slug]": { slug: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/bets" | "/api/bets/" | "/api/contracts" | "/api/contracts/" | `/api/contracts/${string}` & {} | `/api/contracts/${string}/` & {} | `/api/contracts/${string}/resolve` & {} | `/api/contracts/${string}/resolve/` & {} | "/api/tokens" | "/api/tokens/" | "/api/tokens/claim" | "/api/tokens/claim/" | "/api/tokens/initialize" | "/api/tokens/initialize/" | "/api/transactions" | "/api/transactions/" | "/api/transactions/create-contract" | "/api/transactions/create-contract/" | "/demo" | "/demo/" | "/markets" | "/markets/" | "/market" | "/market/" | "/market/create" | "/market/create/" | `/market/${string}` & {} | `/market/${string}/` & {} | "/wallet" | "/wallet/" | `/${string}` & {} | `/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/robots.txt" | "/styles/variables.css" | string & {};
	}
}