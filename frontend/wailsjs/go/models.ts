export namespace main {
	
	export class DebugLogEntry {
	    _id: string;
	    timestamp: string;
	    message: string;
	    level: string;
	    meta?: Record<string, any>;
	
	    static createFrom(source: any = {}) {
	        return new DebugLogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this._id = source["_id"];
	        this.timestamp = source["timestamp"];
	        this.message = source["message"];
	        this.level = source["level"];
	        this.meta = source["meta"];
	    }
	}
	export class Ownership {
	    companyName: string;
	    type: string;
	    country?: string;
	
	    static createFrom(source: any = {}) {
	        return new Ownership(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.companyName = source["companyName"];
	        this.type = source["type"];
	        this.country = source["country"];
	    }
	}
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
	    lastUpdated?: string;
	    pinned?: boolean;
	    parser: string;
	    normalizer: string;
	    bias?: string;
	    factuality?: string;
	    confidence?: number;
	    ownership?: Ownership;
	    lastFetched?: string;
	
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
	        this.parser = source["parser"];
	        this.normalizer = source["normalizer"];
	        this.bias = source["bias"];
	        this.factuality = source["factuality"];
	        this.confidence = source["confidence"];
	        this.ownership = this.convertValues(source["ownership"], Ownership);
	        this.lastFetched = source["lastFetched"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

