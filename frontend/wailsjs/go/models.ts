export namespace main {
	
	export class Source {
	    name: string;
	    endpoint: string;
	    apiKey?: string;
	    instructions?: string;
	    apiLink?: string;
	    enabled?: boolean;
	    requiresApiKey?: boolean;
	    category?: string;
	    tags?: string[];
	    language?: string;
	    region?: string;
	    authType?: string;
	    rateLimitPerMinute?: number;
	    headers?: Record<string, string>;
	    lastUpdated?: any;
	    pinned?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Source(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.endpoint = source["endpoint"];
	        this.apiKey = source["apiKey"];
	        this.instructions = source["instructions"];
	        this.apiLink = source["apiLink"];
	        this.enabled = source["enabled"];
	        this.requiresApiKey = source["requiresApiKey"];
	        this.category = source["category"];
	        this.tags = source["tags"];
	        this.language = source["language"];
	        this.region = source["region"];
	        this.authType = source["authType"];
	        this.rateLimitPerMinute = source["rateLimitPerMinute"];
	        this.headers = source["headers"];
	        this.lastUpdated = source["lastUpdated"];
	        this.pinned = source["pinned"];
	    }
	}

}

