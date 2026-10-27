import {searchDocument} from './search.js';
self.onmessage=e=>{try{self.postMessage({result:searchDocument(e.data)});}catch(error){self.postMessage({error:error.message});}};
