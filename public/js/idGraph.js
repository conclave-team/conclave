(()=>{var t={973:t=>{for(var e=[],r=0;r<256;++r)e[r]=(r+256).toString(16).substr(1);t.exports=function(t,r){var n=r||0,s=e;return[s[t[n++]],s[t[n++]],s[t[n++]],s[t[n++]],"-",s[t[n++]],s[t[n++]],"-",s[t[n++]],s[t[n++]],"-",s[t[n++]],s[t[n++]],"-",s[t[n++]],s[t[n++]],s[t[n++]],s[t[n++]],s[t[n++]],s[t[n++]]].join("")}},963:t=>{var e="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof window.msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto);if(e){var r=new Uint8Array(16);t.exports=function(){return e(r),r}}else{var n=new Array(16);t.exports=function(){for(var t,e=0;e<16;e++)0==(3&e)&&(t=4294967296*Math.random()),n[e]=t>>>((3&e)<<3)&255;return n}}},998:(t,e,r)=>{var n,s,i=r(963),o=r(973),a=0,c=0;t.exports=function(t,e,r){var h=e&&r||0,u=e||[],l=(t=t||{}).node||n,d=void 0!==t.clockseq?t.clockseq:s;if(null==l||null==d){var f=i();null==l&&(l=n=[1|f[0],f[1],f[2],f[3],f[4],f[5]]),null==d&&(d=s=16383&(f[6]<<8|f[7]))}var p=void 0!==t.msecs?t.msecs:(new Date).getTime(),g=void 0!==t.nsecs?t.nsecs:c+1,m=p-a+(g-c)/1e4;if(m<0&&void 0===t.clockseq&&(d=d+1&16383),(m<0||p>a)&&void 0===t.nsecs&&(g=0),g>=1e4)throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");a=p,c=g,s=d;var y=(1e4*(268435455&(p+=122192928e5))+g)%4294967296;u[h++]=y>>>24&255,u[h++]=y>>>16&255,u[h++]=y>>>8&255,u[h++]=255&y;var v=p/4294967296*1e4&268435455;u[h++]=v>>>8&255,u[h++]=255&v,u[h++]=v>>>24&15|16,u[h++]=v>>>16&255,u[h++]=d>>>8|128,u[h++]=255&d;for(var x=0;x<6;++x)u[h+x]=l[x];return e||o(u)}}},e={};function r(n){var s=e[n];if(void 0!==s)return s.exports;var i=e[n]={exports:{}};return t[n](i,i.exports,r),i.exports}r.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return r.d(e,{a:e}),e},r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{"use strict";const t=class{constructor(t,e){this.digit=t,this.siteId=e}compareTo(t){return this.digit<t.digit?-1:this.digit>t.digit?1:this.siteId<t.siteId?-1:this.siteId>t.siteId?1:0}},e=class{constructor(t,e=32,r=10,n="random",s=2){this.controller=t,this.vector=t.vector,this.struct=[],this.siteId=t.siteId,this.text="",this.base=e,this.boundary=r,this.strategy=n,this.strategyCache=[],this.mult=s}handleLocalInsert(t,e){this.vector.increment();const r=this.generateChar(t,e);this.insertChar(e,r),this.insertText(r.value,e),this.controller.broadcastInsertion(r)}handleRemoteInsert(t){const e=this.findInsertIndex(t);this.insertChar(e,t),this.insertText(t.value,e),this.controller.insertIntoEditor(t.value,e,t.siteId)}insertChar(t,e){this.struct.splice(t,0,e)}handleLocalDelete(t){this.vector.increment();const e=this.struct.splice(t,1)[0];this.deleteText(t),this.controller.broadcastDeletion(e)}handleRemoteDelete(t,e){const r=this.findIndexByPosition(t);this.struct.splice(r,1),this.controller.deleteFromEditor(t.value,r,e),this.deleteText(r)}findInsertIndex(t){let e,r,n=0,s=this.struct.length-1;if(0===this.struct.length||t.compareTo(this.struct[n])<0)return n;if(t.compareTo(this.struct[s])>0)return this.struct.length;for(;n+1<s;){if(e=Math.floor(n+(s-n)/2),r=t.compareTo(this.struct[e]),0===r)return e;r>0?n=e:s=e}return 0===t.compareTo(this.struct[n])?n:s}findIndexByPosition(t){let e,r,n=0,s=this.struct.length-1;if(0===this.struct.length)throw new Error("Character does not exist in CRDT.");for(;n+1<s;){if(e=Math.floor(n+(s-n)/2),r=t.compareTo(this.struct[e]),0===r)return e;r>0?n=e:s=e}if(0===t.compareTo(this.struct[n]))return n;if(0===t.compareTo(this.struct[s]))return s;throw new Error("Character does not exist in CRDT.")}generateChar(t,e){const r=this.struct[e-1]&&this.struct[e-1].position||[],n=this.struct[e]&&this.struct[e].position||[],s=this.generatePosBetween(r,n),i=this.vector.localVersion.counter;return new class{constructor(t,e,r,n){this.position=n,this.counter=e,this.siteId=r,this.value=t}compareTo(t){let e,r,n;const s=this.position,i=t.position;for(let t=0;t<Math.min(s.length,i.length);t++)if(r=s[t],n=i[t],e=r.compareTo(n),0!==e)return e;return s.length<i.length?-1:s.length>i.length?1:0}}(t,i,this.siteId,s)}retrieveStrategy(t){if(this.strategyCache[t])return this.strategyCache[t];let e;switch(this.strategy){case"plus":e="+";break;case"minus":e="-";break;case"random":e=0===Math.round(Math.random())?"+":"-";break;case"every2nd":e=(t+1)%2==0?"-":"+";break;case"every3rd":e=(t+1)%3==0?"-":"+";break;default:e=(t+1)%2==0?"-":"+"}return this.strategyCache[t]=e,e}generatePosBetween(e,r,n=[],s=0){let i=Math.pow(this.mult,s)*this.base,o=this.retrieveStrategy(s),a=e[0]||new t(0,this.siteId),c=r[0]||new t(i,this.siteId);if(c.digit-a.digit>1){let e=this.generateIdBetween(a.digit,c.digit,o);return n.push(new t(e,this.siteId)),n}if(c.digit-a.digit==1)return n.push(a),this.generatePosBetween(e.slice(1),[],n,s+1);if(a.digit===c.digit){if(a.siteId<c.siteId)return n.push(a),this.generatePosBetween(e.slice(1),[],n,s+1);if(a.siteId===c.siteId)return n.push(a),this.generatePosBetween(e.slice(1),r.slice(1),n,s+1);throw new Error("Fix Position Sorting")}}generateIdBetween(t,e,r){return e-t<this.boundary?t+=1:"-"===r?t=e-this.boundary:e=(t+=1)+this.boundary,Math.floor(Math.random()*(e-t))+t}insertText(t,e){this.text=this.text.slice(0,e)+t+this.text.slice(e)}deleteText(t){this.text=this.text.slice(0,t)+this.text.slice(t+1)}populateText(){this.text=this.struct.map((t=>t.value)).join("")}};var n=r(998),s=r.n(n);function i(t){const e=t.struct.map((t=>t.position.map((t=>t.digit)).join(""))),r=e.reduce(((t,e)=>t+e.length),0);return Math.floor(r/e.length)}function o(){return{siteId:s()(),broadcastInsertion:function(){},broadcastDeletion:function(){},insertIntoEditor:function(){},deleteFromEditor:function(){},vector:{localVersion:{counter:0},increment:function(){this.localVersion.counter++}}}}let a,c,h,u,l,d,f,p,g,m;const y=[100,500,1e3,3e3,5e3],v=[[function(t,e){const r=Date.now();let n;for(let r=0;r<e;r++)n=Math.floor(Math.random()*r),t.handleLocalInsert("a",n);return Date.now()-r},"Inserted Randomly"],[function(t,e){const r=Date.now();for(let r=0;r<e;r++)t.handleLocalInsert("a",r);return Date.now()-r},"Inserted at End"],[function(t,e){const r=Date.now();for(let r=0;r<e;r++)t.handleLocalInsert("a",0);return Date.now()-r},"Inserted at Beginning"]];a=[1,2,3],p=[],a.forEach((t=>{v.forEach((r=>{d=[],f=[],l=new e(o(),32,10,"random",t),l.insertText=function(){},l.deleteText=function(){},y.forEach((t=>{r[0](l,t),d.push(t),f.push(i(l)),l.struct=[]})),g=`multiplier: ${t}, ${r[1]}`,p.push({x:d,y:f,type:"scatter",name:g})}))})),m="Different Base Multiplications (base = 32, boundary = 10, strategy = random)",Plotly.newPlot("g0",p,{title:m,height:600}),c=[32,1024,4096],p=[],c.forEach((t=>{v.forEach((r=>{d=[],f=[],l=new e(o(),t,10,"random",2),l.insertText=function(){},l.deleteText=function(){},y.forEach((t=>{r[0](l,t),d.push(t),f.push(i(l)),l.struct=[]})),g=`base: ${t}, ${r[1]}`,p.push({x:d,y:f,type:"scatter",name:g})}))})),m="Different Starting Bases (mult = 2, boundary = 10, strategy = random)",Plotly.newPlot("g1",p,{title:m,height:600}),h=[10,20,30],p=[],h.forEach((t=>{v.forEach((r=>{d=[],f=[],l=new e(o(),32,t,"random",2),l.insertText=function(){},l.deleteText=function(){},y.forEach((t=>{r[0](l,t),d.push(t),f.push(i(l)),l.struct=[]})),g=`boundary: ${t}, ${r[1]}`,p.push({x:d,y:f,type:"scatter",name:g})}))})),m="Different Boundaries (mult = 2, base = 32, strategy = random)",Plotly.newPlot("g2",p,{title:m,height:600}),u=["every2nd","every3rd","random"],p=[],u.forEach((t=>{v.forEach((r=>{d=[],f=[],l=new e(o(),32,10,t,2),l.insertText=function(){},l.deleteText=function(){},y.forEach((t=>{r[0](l,t),d.push(t),f.push(i(l)),l.struct=[]})),g=`strategy: ${t}, ${r[1]}`,p.push({x:d,y:f,type:"scatter",name:g})}))})),m="Different Strategies (mult = 2, base = 32, boundary = 10)",Plotly.newPlot("g3",p,{title:m,height:600})})()})();