export namespace main {
	
	export class SourceMeta {
	    name: string;
	    bias: string;
	    confidence?: number;
	
	    static createFrom(source: any = {}) {
	        return new SourceMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.bias = source["bias"];
	        this.confidence = source["confidence"];
	    }
	}
	export class Article {
	    id: string;
	    title: string;
	    url: string;
	    content?: string;
	    summary?: string;
	    image?: string;
	    categories?: string[];
	    tags?: string[];
	    language?: string;
	    author?: string;
	    publishedAt?: string;
	    edition?: string;
	    analyzed: boolean;
	    ipfsHash?: string;
	    raw?: any;
	    sourceMeta?: SourceMeta;
	
	    static createFrom(source: any = {}) {
	        return new Article(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.url = source["url"];
	        this.content = source["content"];
	        this.summary = source["summary"];
	        this.image = source["image"];
	        this.categories = source["categories"];
	        this.tags = source["tags"];
	        this.language = source["language"];
	        this.author = source["author"];
	        this.publishedAt = source["publishedAt"];
	        this.edition = source["edition"];
	        this.analyzed = source["analyzed"];
	        this.ipfsHash = source["ipfsHash"];
	        this.raw = source["raw"];
	        this.sourceMeta = this.convertValues(source["sourceMeta"], SourceMeta);
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

