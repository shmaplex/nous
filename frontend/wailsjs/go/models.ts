export namespace main {
	
	export class Source {
	    name: string;
	    url: string;
	    instructions?: string;
	    apiLink?: string;
	
	    static createFrom(source: any = {}) {
	        return new Source(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	        this.instructions = source["instructions"];
	        this.apiLink = source["apiLink"];
	    }
	}

}

